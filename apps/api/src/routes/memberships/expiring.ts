import express, { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../../generated/prisma/index.js';
import { authRequired } from '../../middleware/auth.js';
import { tenantRequired, TenantRequest } from '../../middleware/tenant.js';
import { getExpirationSummary, triggerExpirationJob } from '../../jobs/memberships/expire.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const expiringQuerySchema = z.object({
  days: z.enum(['7', '14']).optional().default('14'),
  page: z
    .string()
    .optional()
    .transform(val => parseInt(val || '1')),
  limit: z
    .string()
    .optional()
    .transform(val => parseInt(val || '20')),
});

/**
 * GET /v1/memberships/expiring
 * Get memberships expiring within specified days
 */
router.get(
  '/',
  authRequired(['owner', 'manager', 'staff']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { days, page, limit } = expiringQuerySchema.parse(req.query);
      const { companyId } = req.tenant!;

      const today = new Date();
      const targetDate = new Date(today.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get expiring memberships
      const [memberships, total] = await Promise.all([
        prisma.membership.findMany({
          where: {
            companyId,
            status: { in: ['active', 'past_due'] },
            endsAt: {
              gte: today,
              lte: targetDate,
            },
          },
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
          orderBy: { endsAt: 'asc' },
          skip,
          take: limit,
        }),
        prisma.membership.count({
          where: {
            companyId,
            status: { in: ['active', 'past_due'] },
            endsAt: {
              gte: today,
              lte: targetDate,
            },
          },
        }),
      ]);

      // Calculate days until expiry for each membership
      const membershipsWithDays = memberships.map(membership => {
        const daysUntilExpiry = Math.ceil(
          (membership.endsAt!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...membership,
          daysUntilExpiry,
        };
      });

      res.json({
        memberships: membershipsWithDays,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          days: parseInt(days),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error fetching expiring memberships:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * GET /v1/memberships/expiring/summary
 * Get expiration summary counts for dashboard widgets
 */
router.get(
  '/summary',
  authRequired(['owner', 'manager', 'staff']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { companyId } = req.tenant!;
      const summary = await getExpirationSummary(companyId);

      res.json({
        summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching expiration summary:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * POST /v1/memberships/expiring/process
 * Manually trigger expiration job (admin only)
 */
router.post(
  '/process',
  authRequired(['owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const result = await triggerExpirationJob();

      res.json({
        message: 'Expiration job completed',
        result,
      });
    } catch (error) {
      console.error('Error running expiration job:', error);
      res.status(500).json({
        message: 'Expiration job failed',
        error: error.message,
      });
    }
  }
);

/**
 * GET /v1/memberships/expiring/details/:membershipId
 * Get detailed expiration information for a specific membership
 */
router.get(
  '/details/:membershipId',
  authRequired(['owner', 'manager', 'staff']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { membershipId } = req.params;
      const { companyId } = req.tenant!;

      const membership = await prisma.membership.findFirst({
        where: {
          id: membershipId,
          companyId,
        },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              createdAt: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true,
              durationUnit: true,
            },
          },
          visits: {
            where: {
              checkIn: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
            orderBy: { checkIn: 'desc' },
            take: 10,
            select: {
              id: true,
              checkIn: true,
              checkOut: true,
              gym: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!membership) {
        return res.status(404).json({ message: 'Membership not found' });
      }

      const today = new Date();
      const daysUntilExpiry = membership.endsAt
        ? Math.ceil((membership.endsAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Calculate usage statistics
      const totalVisits = await prisma.visit.count({
        where: {
          membershipId: membership.id,
        },
      });

      const visitsLast30Days = membership.visits.length;
      const lastVisit = membership.visits[0];

      res.json({
        membership: {
          ...membership,
          daysUntilExpiry,
          usage: {
            totalVisits,
            visitsLast30Days,
            lastVisit: lastVisit
              ? {
                  date: lastVisit.checkIn,
                  gym: lastVisit.gym.name,
                }
              : null,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching membership details:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;
