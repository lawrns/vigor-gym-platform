import { Router, Request, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { authRequired } from '../middleware/auth.js';
import {
  tenantRequired,
  withTenantFilter,
  TenantRequest,
  logTenantAction,
} from '../middleware/tenant.js';
import expiringRoutes from './memberships/expiring.js';

const router = Router();

// We'll inject the prisma instance from the main app
let prisma: any;

export function setPrismaInstance(prismaInstance: any) {
  prisma = prismaInstance;
}

// Rate limiting for membership creation
const membershipRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per org
  keyGenerator: (req: TenantRequest) => `membership:${req.tenant?.companyId || 'unknown'}`,
  message: { message: 'Too many membership requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const createMembershipSchema = z.object({
  planId: z.string().uuid('Invalid plan ID format'),
  draft: z.boolean().optional().default(false),
  memberId: z.string().uuid('Invalid member ID format').optional(),
});

// POST /v1/memberships - Create a new membership (draft or active)
router.post(
  '/',
  membershipRateLimit,
  authRequired(['owner', 'manager']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const validatedData = createMembershipSchema.parse(req.body);
      const { planId, draft, memberId } = validatedData;

      // Validate that the plan exists
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
        select: { id: true, name: true, code: true },
      });

      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      // If memberId is provided, validate that the member belongs to the current tenant
      if (memberId) {
        const member = await prisma.member.findUnique({
          where: withTenantFilter(req, { id: memberId }),
          select: { id: true, firstName: true, lastName: true },
        });

        if (!member) {
          return res.status(404).json({ message: 'Member not found or access denied' });
        }
      }

      // Check for existing draft membership for this company
      if (draft) {
        const existingDraft = await prisma.membership.findFirst({
          where: {
            companyId: req.tenant!.companyId,
            status: 'draft',
          },
          select: { id: true },
        });

        if (existingDraft) {
          return res.status(409).json({
            message:
              'A draft membership already exists for this company. Please complete or cancel it first.',
            existingDraftId: existingDraft.id,
          });
        }
      }

      // Create the membership
      const membershipData: any = {
        companyId: req.tenant!.companyId,
        planId,
        status: draft ? 'draft' : 'active',
      };

      if (memberId) {
        membershipData.memberId = memberId;
      }

      if (!draft) {
        membershipData.startsAt = new Date();
      }

      const membership = await prisma.membership.create({
        data: membershipData,
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              code: true,
              priceMxnCents: true,
            },
          },
          member: memberId
            ? {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              }
            : false,
        },
      });

      // Log audit trail
      await logTenantAction(
        prisma,
        req,
        draft ? 'membership.draft.created' : 'membership.created',
        'membership',
        membership.id,
        null,
        {
          planId,
          planName: plan.name,
          status: membership.status,
          memberId: memberId || null,
        }
      );

      // Track analytics event
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
        // In a real app, you'd emit to PostHog here
        console.log('Analytics event:', {
          event: draft ? 'membership.draft.created' : 'membership.created',
          properties: {
            planId,
            planCode: plan.code,
            companyId: req.tenant!.companyId,
            hasMember: !!memberId,
          },
        });
      }

      res.status(201).json({
        membership: {
          id: membership.id,
          status: membership.status,
          planId: membership.planId,
          companyId: membership.companyId,
          memberId: membership.memberId,
          startsAt: membership.startsAt,
          endsAt: membership.endsAt,
          createdAt: membership.createdAt,
          plan: membership.plan,
          member: membership.member,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      console.error('Create membership error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// GET /v1/memberships - List memberships for the current tenant
router.get(
  '/',
  authRequired(['owner', 'manager', 'staff']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { status, limit = '50', offset = '0' } = req.query;

      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      const whereClause = withTenantFilter(req, status ? { status } : {});

      const [memberships, total] = await Promise.all([
        prisma.membership.findMany({
          where: whereClause,
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                code: true,
                priceMxnCents: true,
              },
            },
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limitNum,
          skip: offsetNum,
        }),
        prisma.membership.count({ where: whereClause }),
      ]);

      res.json({
        data: memberships,
        total,
        limit: limitNum,
        offset: offsetNum,
      });
    } catch (error) {
      console.error('List memberships error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// GET /v1/memberships/:id - Get specific membership
router.get(
  '/:id',
  authRequired(['owner', 'manager', 'staff']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { id } = req.params;

      const membership = await prisma.membership.findUnique({
        where: withTenantFilter(req, { id }),
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              code: true,
              priceMxnCents: true,
              featuresJson: true,
            },
          },
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!membership) {
        return res.status(404).json({ message: 'Membership not found' });
      }

      res.json({ membership });
    } catch (error) {
      console.error('Get membership error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Mount expiring memberships routes
router.use('/expiring', expiringRoutes);

export default router;
