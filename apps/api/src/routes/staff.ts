import express, { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma/index.js';
import { authRequired, AuthenticatedRequest } from '../middleware/auth.js';
import {
  tenantRequired,
  withTenantFilter,
  validateTenantAccess,
  TenantRequest,
  logTenantAction,
} from '../middleware/tenant.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createStaffSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['ADMIN', 'TRAINER', 'RECEPTIONIST', 'MANAGER', 'MAINTENANCE']),
  phone: z.string().optional(),
  hireDate: z.string().datetime().optional(),
});

const updateStaffSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(['ADMIN', 'TRAINER', 'RECEPTIONIST', 'MANAGER', 'MAINTENANCE']).optional(),
  phone: z.string().optional(),
  active: z.boolean().optional(),
  hireDate: z.string().datetime().optional(),
});

const createShiftSchema = z.object({
  gymId: z.string().uuid().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
});

const createCertificationSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().optional(),
  obtainedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

// GET /v1/staff - List staff with search and pagination
router.get(
  '/',
  authRequired(['owner', 'manager']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { search, role, active, page = '1', pageSize = '20' } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string, 10)));
      const offset = (pageNum - 1) * pageSizeNum;

      // Build where clause
      const where: any = {
        companyId: req.tenant!.companyId,
      };

      if (search) {
        const searchTerm = search as string;
        where.OR = [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (active !== undefined) {
        where.active = active === 'true';
      }

      const [staff, total] = await Promise.all([
        prisma.staff.findMany({
          where,
          include: {
            _count: {
              select: {
                shifts: true,
                certifications: true,
              },
            },
          },
          orderBy: [{ active: 'desc' }, { firstName: 'asc' }],
          skip: offset,
          take: pageSizeNum,
        }),
        prisma.staff.count({ where }),
      ]);

      res.json({
        staff,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages: Math.ceil(total / pageSizeNum),
        },
      });
    } catch (error) {
      console.error('List staff error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// POST /v1/staff - Create a new staff member
router.post(
  '/',
  authRequired(['owner', 'manager']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const validatedData = createStaffSchema.parse(req.body);
      const { companyId } = req.tenant!;

      // Check if staff with this email already exists in the company
      const existingStaff = await prisma.staff.findFirst({
        where: {
          email: validatedData.email.toLowerCase(),
          companyId,
        },
      });

      if (existingStaff) {
        return res.status(409).json({ message: 'Staff member with this email already exists' });
      }

      // Role-based access control: only owners can create ADMIN or MANAGER roles
      if (['ADMIN', 'MANAGER'].includes(validatedData.role) && req.user!.role !== 'owner') {
        return res.status(403).json({ message: 'Only owners can create admin or manager staff' });
      }

      const staff = await prisma.staff.create({
        data: {
          ...validatedData,
          email: validatedData.email.toLowerCase(),
          companyId,
          hireDate: validatedData.hireDate ? new Date(validatedData.hireDate) : new Date(),
        },
        include: {
          _count: {
            select: {
              shifts: true,
              certifications: true,
            },
          },
        },
      });

      // Log audit trail
      await logTenantAction(prisma, req, 'staff.created', 'staff', staff.id, null, {
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role,
      });

      res.status(201).json({ staff });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create staff error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// GET /v1/staff/:id - Get specific staff member
router.get(
  '/:id',
  authRequired(['owner', 'manager', 'staff']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { id } = req.params;

      const staff = await prisma.staff.findUnique({
        where: { id },
        include: {
          shifts: {
            include: {
              gym: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { startTime: 'desc' },
            take: 10,
          },
          certifications: {
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              shifts: true,
              certifications: true,
            },
          },
        },
      });

      // Validate tenant access
      validateTenantAccess(req, staff);

      // Staff can only view their own profile unless they're admin/manager
      if (req.user!.role === 'staff' && staff.email !== req.user!.email) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json({ staff });
    } catch (error) {
      console.error('Get staff error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// PATCH /v1/staff/:id - Update staff member
router.patch(
  '/:id',
  authRequired(['owner', 'manager']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateStaffSchema.parse(req.body);

      // Get current staff data for audit log
      const currentStaff = await prisma.staff.findUnique({
        where: { id },
      });

      if (!currentStaff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }

      // Role-based access control for role changes
      if (
        validatedData.role &&
        ['ADMIN', 'MANAGER'].includes(validatedData.role) &&
        req.user!.role !== 'owner'
      ) {
        return res.status(403).json({ message: 'Only owners can assign admin or manager roles' });
      }

      // Check email uniqueness if email is being updated
      if (validatedData.email && validatedData.email !== currentStaff.email) {
        const existingStaff = await prisma.staff.findFirst({
          where: {
            email: validatedData.email.toLowerCase(),
            companyId: req.tenant!.companyId,
            id: { not: id },
          },
        });

        if (existingStaff) {
          return res.status(409).json({ message: 'Staff member with this email already exists' });
        }
      }

      const updateData: any = { ...validatedData };
      if (validatedData.email) {
        updateData.email = validatedData.email.toLowerCase();
      }
      if (validatedData.hireDate) {
        updateData.hireDate = new Date(validatedData.hireDate);
      }

      const staff = await prisma.staff.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              shifts: true,
              certifications: true,
            },
          },
        },
      });

      // Log audit trail
      await logTenantAction(
        prisma,
        req,
        'staff.updated',
        'staff',
        id,
        {
          email: currentStaff.email,
          firstName: currentStaff.firstName,
          lastName: currentStaff.lastName,
          role: currentStaff.role,
          active: currentStaff.active,
        },
        updateData
      );

      res.json({ staff });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Update staff error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// DELETE /v1/staff/:id - Deactivate staff member (soft delete)
router.delete(
  '/:id',
  authRequired(['owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { id } = req.params;

      const staff = await prisma.staff.findUnique({
        where: { id },
      });

      if (!staff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }

      // Soft delete by setting active to false
      const updatedStaff = await prisma.staff.update({
        where: { id },
        data: { active: false },
      });

      // Log audit trail
      await logTenantAction(
        prisma,
        req,
        'staff.deactivated',
        'staff',
        id,
        { active: true },
        { active: false }
      );

      res.json({ message: 'Staff member deactivated successfully', staff: updatedStaff });
    } catch (error) {
      console.error('Deactivate staff error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// GET /v1/staff/:id/schedule - Get staff schedule
router.get(
  '/:id/schedule',
  authRequired(['owner', 'manager', 'staff']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { from, to, limit = '50' } = req.query;

      // Verify staff exists and belongs to tenant
      const staff = await prisma.staff.findUnique({
        where: { id },
      });

      if (!staff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }

      // Staff can only view their own schedule unless they're admin/manager
      if (req.user!.role === 'staff' && staff.email !== req.user!.email) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const where: any = { staffId: id };

      if (from || to) {
        where.startTime = {};
        if (from) {
          where.startTime.gte = new Date(from as string);
        }
        if (to) {
          where.startTime.lte = new Date(to as string);
        }
      }

      const shifts = await prisma.staffShift.findMany({
        where,
        include: {
          gym: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
        take: parseInt(limit as string, 10),
      });

      res.json({ shifts });
    } catch (error) {
      console.error('Get staff schedule error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// POST /v1/staff/:id/shifts - Create a new shift for staff member
router.post(
  '/:id/shifts',
  authRequired(['owner', 'manager']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = createShiftSchema.parse(req.body);

      // Verify staff exists and belongs to tenant
      const staff = await prisma.staff.findUnique({
        where: { id },
      });

      if (!staff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }

      // Validate shift times
      const startTime = new Date(validatedData.startTime);
      const endTime = new Date(validatedData.endTime);

      if (endTime <= startTime) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }

      // Check for overlapping shifts
      const overlappingShift = await prisma.staffShift.findFirst({
        where: {
          staffId: id,
          OR: [
            {
              startTime: { lte: startTime },
              endTime: { gt: startTime },
            },
            {
              startTime: { lt: endTime },
              endTime: { gte: endTime },
            },
            {
              startTime: { gte: startTime },
              endTime: { lte: endTime },
            },
          ],
        },
      });

      if (overlappingShift) {
        return res.status(409).json({ message: 'Shift overlaps with existing shift' });
      }

      const shift = await prisma.staffShift.create({
        data: {
          staffId: id,
          gymId: validatedData.gymId,
          startTime,
          endTime,
          notes: validatedData.notes,
        },
        include: {
          gym: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
      });

      res.status(201).json({ shift });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create shift error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// POST /v1/staff/:id/certifications - Add certification for staff member
router.post(
  '/:id/certifications',
  authRequired(['owner', 'manager']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = createCertificationSchema.parse(req.body);

      // Verify staff exists and belongs to tenant
      const staff = await prisma.staff.findUnique({
        where: { id },
      });

      if (!staff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }

      const certification = await prisma.staffCertification.create({
        data: {
          staffId: id,
          name: validatedData.name,
          issuer: validatedData.issuer,
          obtainedAt: validatedData.obtainedAt ? new Date(validatedData.obtainedAt) : null,
          expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        },
      });

      res.status(201).json({ certification });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create certification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;
