import { Router, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authRequired } from '../middleware/auth.js';
import { tenantRequired, TenantRequest } from '../middleware/tenant.js';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const prisma = new PrismaClient();

// Rate limiting for check-ins (10 per minute per IP)
const checkInRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: 'Too many check-in attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /v1/visits - Create a new visit (check-in)
router.post('/', 
  checkInRateLimit,
  authRequired(['staff', 'manager', 'owner']), 
  tenantRequired(), 
  async (req: TenantRequest, res: Response) => {
    try {
      const { membershipId, gymId } = req.body;
      const companyId = req.tenant!.companyId;

      // Validate required fields
      if (!membershipId) {
        return res.status(400).json({ message: 'membershipId is required' });
      }

      // Verify membership belongs to the tenant
      const membership = await prisma.membership.findFirst({
        where: {
          id: membershipId,
          companyId: companyId
        },
        include: {
          member: true
        }
      });

      if (!membership) {
        return res.status(404).json({ message: 'Membership not found or access denied' });
      }

      if (membership.status !== 'active') {
        return res.status(400).json({ message: 'Membership is not active' });
      }

      // Check for existing open visit (prevent double check-in)
      const existingVisit = await prisma.visit.findFirst({
        where: {
          membershipId: membershipId,
          checkOut: null // Still checked in
        }
      });

      if (existingVisit) {
        // Check if it's within 2 minutes (allow re-entry for mistakes)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        if (existingVisit.checkIn > twoMinutesAgo) {
          return res.status(409).json({ 
            message: 'Member is already checked in',
            existingVisit: {
              id: existingVisit.id,
              checkIn: existingVisit.checkIn
            }
          });
        }
      }

      // Get default gym if not specified
      let selectedGymId = gymId;
      if (!selectedGymId) {
        const defaultGym = await prisma.gym.findFirst();
        if (!defaultGym) {
          return res.status(400).json({ message: 'No gym available for check-in' });
        }
        selectedGymId = defaultGym.id;
      }

      // Verify gym exists
      const gym = await prisma.gym.findUnique({
        where: { id: selectedGymId }
      });

      if (!gym) {
        return res.status(404).json({ message: 'Gym not found' });
      }

      // Create the visit
      const visit = await prisma.visit.create({
        data: {
          membershipId: membershipId,
          gymId: selectedGymId,
          checkIn: new Date()
        },
        include: {
          membership: {
            include: {
              member: true
            }
          },
          gym: true
        }
      });

      res.status(201).json({
        id: visit.id,
        membershipId: visit.membershipId,
        gymId: visit.gymId,
        checkIn: visit.checkIn,
        status: 'in_progress',
        member: visit.membership.member ? {
          id: visit.membership.member.id,
          firstName: visit.membership.member.firstName,
          lastName: visit.membership.member.lastName
        } : null,
        gym: {
          id: visit.gym.id,
          name: visit.gym.name
        }
      });

    } catch (error) {
      console.error('Error creating visit:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// PATCH /v1/visits/:id/checkout - Check out from a visit
router.patch('/:id/checkout',
  authRequired(['staff', 'manager', 'owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const visitId = req.params.id;
      const companyId = req.tenant!.companyId;

      // Find the visit and verify it belongs to the tenant
      const visit = await prisma.visit.findFirst({
        where: {
          id: visitId,
          membership: {
            companyId: companyId
          }
        },
        include: {
          membership: {
            include: {
              member: true
            }
          },
          gym: true
        }
      });

      if (!visit) {
        return res.status(404).json({ message: 'Visit not found or access denied' });
      }

      if (visit.checkOut) {
        return res.status(400).json({ 
          message: 'Visit already checked out',
          checkOut: visit.checkOut
        });
      }

      // Update the visit with checkout time
      const checkOutTime = new Date();
      const updatedVisit = await prisma.visit.update({
        where: { id: visitId },
        data: { checkOut: checkOutTime },
        include: {
          membership: {
            include: {
              member: true
            }
          },
          gym: true
        }
      });

      // Calculate duration in minutes
      const durationMs = checkOutTime.getTime() - visit.checkIn.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      res.json({
        id: updatedVisit.id,
        membershipId: updatedVisit.membershipId,
        gymId: updatedVisit.gymId,
        checkIn: updatedVisit.checkIn,
        checkOut: updatedVisit.checkOut,
        durationMinutes: durationMinutes,
        status: 'completed',
        member: updatedVisit.membership.member ? {
          id: updatedVisit.membership.member.id,
          firstName: updatedVisit.membership.member.firstName,
          lastName: updatedVisit.membership.member.lastName
        } : null,
        gym: {
          id: updatedVisit.gym.id,
          name: updatedVisit.gym.name
        }
      });

    } catch (error) {
      console.error('Error checking out visit:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// GET /v1/visits - List visits for the tenant
router.get('/',
  authRequired(['staff', 'manager', 'owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const companyId = req.tenant!.companyId;
      const { page = 1, limit = 20, memberId, gymId, from, to } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      
      // Build where clause
      const where: any = {
        membership: {
          companyId: companyId
        }
      };

      if (memberId) {
        where.membership.memberId = memberId;
      }

      if (gymId) {
        where.gymId = gymId;
      }

      if (from || to) {
        where.checkIn = {};
        if (from) {
          where.checkIn.gte = new Date(from as string);
        }
        if (to) {
          where.checkIn.lte = new Date(to as string);
        }
      }

      const [visits, total] = await Promise.all([
        prisma.visit.findMany({
          where,
          include: {
            membership: {
              include: {
                member: true
              }
            },
            gym: true
          },
          orderBy: { checkIn: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.visit.count({ where })
      ]);

      res.json({
        visits: visits.map(visit => ({
          id: visit.id,
          membershipId: visit.membershipId,
          gymId: visit.gymId,
          checkIn: visit.checkIn,
          checkOut: visit.checkOut,
          durationMinutes: visit.checkOut 
            ? Math.round((visit.checkOut.getTime() - visit.checkIn.getTime()) / (1000 * 60))
            : null,
          status: visit.checkOut ? 'completed' : 'in_progress',
          member: visit.membership.member ? {
            id: visit.membership.member.id,
            firstName: visit.membership.member.firstName,
            lastName: visit.membership.member.lastName
          } : null,
          gym: {
            id: visit.gym.id,
            name: visit.gym.name
          }
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error fetching visits:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;
