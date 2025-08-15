import express, { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma/index.js';
import { authRequired, AuthenticatedRequest } from '../middleware/auth.js';
import { tenantRequired, withTenantFilter, TenantRequest, logTenantAction } from '../middleware/tenant.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createMemberSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  status: z.enum(['active', 'invited', 'paused', 'cancelled']).optional().default('active'),
});

const updateMemberSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  status: z.enum(['active', 'invited', 'paused', 'cancelled']).optional(),
});

const importMembersSchema = z.object({
  members: z.array(z.object({
    email: z.string().email(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    status: z.enum(['active', 'invited', 'paused', 'cancelled']).optional().default('active'),
  })).min(1).max(1000), // Limit to 1000 members per import
});

// GET /v1/members - List members with search and pagination
router.get('/', authRequired(['owner', 'manager', 'staff']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const { search, page = '1', pageSize = '20', status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string, 10)));
    const offset = (pageNum - 1) * pageSizeNum;

    // Build where clause with tenant filter
    const whereClause = withTenantFilter(req, {
      ...(status && { status: status as string }),
      ...(search && {
        OR: [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    });

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              memberships: {
                where: { status: 'active' }
              }
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' },
          { lastName: 'asc' },
          { firstName: 'asc' }
        ],
        take: pageSizeNum,
        skip: offset,
      }),
      prisma.member.count({ where: whereClause }),
    ]);

    res.json({
      members,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /v1/members - Create a new member
router.post('/', authRequired(['owner', 'manager', 'staff']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const validatedData = createMemberSchema.parse(req.body);
    const { companyId } = req.tenant!;

    // Check if member with this email already exists in the company
    const existingMember = await prisma.member.findFirst({
      where: {
        email: validatedData.email.toLowerCase(),
        companyId,
      },
    });

    if (existingMember) {
      return res.status(409).json({ message: 'Member with this email already exists' });
    }

    const member = await prisma.member.create({
      data: {
        ...validatedData,
        email: validatedData.email.toLowerCase(),
        companyId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
      },
    });

    // Log audit trail
    await logTenantAction(
      prisma,
      req,
      'member.created',
      'member',
      member.id,
      null,
      {
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        status: member.status,
      },
      {
        memberName: `${member.firstName} ${member.lastName}`,
        memberEmail: member.email,
      }
    );

    res.status(201).json({ member });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Create member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /v1/members/:id - Get specific member
router.get('/:id', authRequired(['owner', 'manager', 'staff']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;

    const member = await prisma.member.findUnique({
      where: withTenantFilter(req, { id }),
      include: {
        memberships: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                code: true,
                priceMxnCents: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json({ member });
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /v1/members/:id - Update member
router.patch('/:id', authRequired(['owner', 'manager', 'staff']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateMemberSchema.parse(req.body);

    // Get current member data for audit log
    const currentMember = await prisma.member.findUnique({
      where: withTenantFilter(req, { id }),
    });

    if (!currentMember) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Check for email conflicts if email is being updated
    if (validatedData.email && validatedData.email.toLowerCase() !== currentMember.email) {
      const existingMember = await prisma.member.findFirst({
        where: {
          email: validatedData.email.toLowerCase(),
          companyId: req.tenant!.companyId,
          id: { not: id },
        },
      });

      if (existingMember) {
        return res.status(409).json({ message: 'Member with this email already exists' });
      }
    }

    const updatedMember = await prisma.member.update({
      where: withTenantFilter(req, { id }),
      data: {
        ...validatedData,
        ...(validatedData.email && { email: validatedData.email.toLowerCase() }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
      },
    });

    // Log audit trail
    await logTenantAction(
      prisma,
      req,
      'member.updated',
      'member',
      updatedMember.id,
      {
        email: currentMember.email,
        firstName: currentMember.firstName,
        lastName: currentMember.lastName,
        status: currentMember.status,
      },
      {
        email: updatedMember.email,
        firstName: updatedMember.firstName,
        lastName: updatedMember.lastName,
        status: updatedMember.status,
      },
      {
        memberName: `${updatedMember.firstName} ${updatedMember.lastName}`,
        memberEmail: updatedMember.email,
      }
    );

    res.json({ member: updatedMember });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Update member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /v1/members/:id - Delete member
router.delete('/:id', authRequired(['owner', 'manager']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get member data for audit log
    const member = await prisma.member.findUnique({
      where: withTenantFilter(req, { id }),
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Check if member has active memberships
    const activeMemberships = await prisma.membership.count({
      where: {
        memberId: id,
        status: 'active',
      },
    });

    if (activeMemberships > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete member with active memberships. Please cancel memberships first.' 
      });
    }

    await prisma.member.delete({
      where: withTenantFilter(req, { id }),
    });

    // Log audit trail
    await logTenantAction(
      prisma,
      req,
      'member.deleted',
      'member',
      member.id,
      {
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        status: member.status,
      },
      null,
      {
        memberName: `${member.firstName} ${member.lastName}`,
        memberEmail: member.email,
      }
    );

    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /v1/members/import - Import members from CSV
router.post('/import', authRequired(['owner', 'manager']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const validatedData = importMembersSchema.parse(req.body);
    const { companyId } = req.tenant!;

    // Check for duplicate emails within the import
    const emails = validatedData.members.map(m => m.email.toLowerCase());
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      return res.status(400).json({ message: 'Duplicate emails found in import data' });
    }

    // Check for existing members with these emails
    const existingMembers = await prisma.member.findMany({
      where: {
        email: { in: emails },
        companyId,
      },
      select: { email: true },
    });

    if (existingMembers.length > 0) {
      const existingEmails = existingMembers.map(m => m.email);
      return res.status(409).json({
        message: 'Some members already exist',
        existingEmails,
      });
    }

    // Import members in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdMembers = [];

      for (const memberData of validatedData.members) {
        const member = await tx.member.create({
          data: {
            ...memberData,
            email: memberData.email.toLowerCase(),
            companyId,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            createdAt: true,
          },
        });
        createdMembers.push(member);
      }

      return createdMembers;
    });

    // Log audit trail for bulk import
    await logTenantAction(
      prisma,
      req,
      'members.imported',
      'member',
      'bulk',
      null,
      {
        count: result.length,
        emails: result.map(m => m.email),
      },
      {
        importCount: result.length,
      }
    );

    res.status(201).json({
      message: `Successfully imported ${result.length} members`,
      members: result,
      count: result.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Import members error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
