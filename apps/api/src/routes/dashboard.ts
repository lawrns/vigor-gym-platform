import express, { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authRequired } from '../middleware/auth.js';
import { tenantRequired, TenantRequest } from '../middleware/tenant.js';
import { logger } from '../utils/auditLogger.js';
import {
  validateDashboardQuery,
  validateActivityQuery,
  validateTenantAccess,
  validateDateRange,
  DashboardValidationError,
} from '../lib/validation/dashboard.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /v1/dashboard/summary
 * Get aggregated dashboard metrics for the tenant
 */
router.get(
  '/summary',
  authRequired(['owner', 'manager', 'staff']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { companyId } = req.tenant!;

      // Validate query parameters
      let validatedQuery;
      try {
        validatedQuery = validateDashboardQuery({
          orgId: companyId, // Use tenant's companyId as orgId
          locationId: req.query.locationId || null,
          range: req.query.range || '7d',
        });
      } catch (error) {
        if (error instanceof DashboardValidationError) {
          return res.status(422).json({
            error: error.code,
            message: error.message,
            field: error.field,
          });
        }
        throw error;
      }

      const { locationId, range } = validatedQuery;

      // Calculate date range with validation
      const { from: fromDate, to: toDate } = validateDateRange(undefined, undefined, range);

      // Extract days from range for response
      const days = Number(range.replace('d', '')) || 7;
      if (!Number.isFinite(days) || days < 1 || days > 366) {
        return res.status(422).json({
          error: {
            code: 'INVALID_RANGE',
            message: 'range must be between 1 and 366 days',
            field: 'range',
          },
        });
      }

      // Build location filter
      const locationFilter = locationId ? { id: locationId as string } : {};

      // Get active visits count (currently checked in)
      const activeVisitsCount = await prisma.visit.count({
        where: {
          membership: { companyId },
          checkOut: null, // Still checked in
          ...(locationId && { gymId: locationId as string }),
        },
      });

      // Get gym capacity limits (mock for now - would come from gym settings)
      const gyms = await prisma.gym.findMany({
        where: {
          ...locationFilter,
        },
        select: {
          id: true,
          name: true,
          // capacity: true, // Would be added to schema
        },
      });

      // Mock capacity calculation (would be configurable per gym)
      const totalCapacity = gyms.length * 60; // 60 per gym default
      const utilizationPercent =
        totalCapacity > 0 ? Math.round((activeVisitsCount / totalCapacity) * 100) : 0;

      // Get expiring memberships counts
      const now = new Date();
      const expiringCounts = await Promise.all([
        // 7 days
        prisma.membership.count({
          where: {
            companyId,
            status: 'active',
            endsAt: {
              gte: now,
              lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        // 14 days
        prisma.membership.count({
          where: {
            companyId,
            status: 'active',
            endsAt: {
              gte: now,
              lte: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        // 30 days
        prisma.membership.count({
          where: {
            companyId,
            status: 'active',
            endsAt: {
              gte: now,
              lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      // Get revenue metrics for the range
      const revenueData = await prisma.payment.aggregate({
        where: {
          invoice: {
            companyId,
          },
          status: 'succeeded',
          createdAt: { gte: fromDate },
        },
        _sum: { paidMxnCents: true },
        _count: true,
      });

      // Get failed payments count
      const failedPayments = await prisma.payment.count({
        where: {
          invoice: {
            companyId,
          },
          status: 'failed',
          createdAt: { gte: fromDate },
        },
      });

      // Calculate MRR (Monthly Recurring Revenue)
      const activeMemberships = await prisma.membership.findMany({
        where: {
          companyId,
          status: 'active',
        },
        include: {
          plan: true,
        },
      });

      const mrr = activeMemberships.reduce((total, membership) => {
        if (membership.plan?.priceMxnCents) {
          // Convert to monthly amount based on billing cycle
          const monthlyAmount =
            membership.plan.billingCycle === 'monthly'
              ? membership.plan.priceMxnCents
              : membership.plan.billingCycle === 'annual'
                ? membership.plan.priceMxnCents / 12
                : membership.plan.priceMxnCents; // Default to monthly
          return total + (monthlyAmount || 0);
        }
        return total;
      }, 0);

      // Get today's classes count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const classesToday = await prisma.class.count({
        where: {
          startsAt: {
            gte: today,
            lt: tomorrow,
          },
          ...(locationId && { gymId: locationId as string }),
        },
      });

      // Mock staff gaps calculation (would integrate with shift management)
      const staffGaps = 0; // Placeholder

      const summary = {
        activeVisits: activeVisitsCount,
        capacityLimit: totalCapacity,
        utilizationPercent,
        expiringCounts: {
          '7d': expiringCounts[0],
          '14d': expiringCounts[1],
          '30d': expiringCounts[2],
        },
        revenue: {
          total: revenueData._sum.paidMxnCents || 0,
          mrr: Math.round(mrr),
          failedPayments,
          transactionCount: revenueData._count,
        },
        classesToday,
        staffGaps,
        dateRange: {
          from: fromDate.toISOString(),
          to: new Date().toISOString(),
          days,
        },
        locationId: locationId || null,
      };

      // Log the request for monitoring
      logger.info(
        {
          companyId,
          locationId: locationId || 'all',
          range,
          activeVisits: activeVisitsCount,
          utilizationPercent,
        },
        'Dashboard summary requested'
      );

      res.json(summary);
    } catch (e) {
      const error = e as Error;
      logger.error(
        { error: error.message, companyId: req.tenant?.companyId },
        'Dashboard summary error'
      );
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch dashboard summary',
        },
      });
    }
  }
);

/**
 * GET /v1/dashboard/analytics/revenue
 * Get revenue analytics with time series data
 */
router.get(
  '/analytics/revenue',
  authRequired(['owner', 'manager']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { companyId } = req.tenant!;
      const { range = '30d' } = req.query;

      const rangeMap: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
      };
      const days = rangeMap[range as string] || 30;
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      // Get daily revenue data
      const dailyRevenue = (await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          SUM(amount) as revenue,
          COUNT(*) as transactions
        FROM payments 
        WHERE company_id = ${companyId}
          AND status = 'COMPLETED'
          AND created_at >= ${fromDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `) as Array<{ date: Date; revenue: bigint; transactions: bigint }>;

      // Format the data for sparkline
      const sparklineData = dailyRevenue.map(day => ({
        date: day.date.toISOString().split('T')[0],
        revenue: Number(day.revenue),
        transactions: Number(day.transactions),
      }));

      res.json({
        range,
        data: sparklineData,
        summary: {
          totalRevenue: sparklineData.reduce((sum, day) => sum + day.revenue, 0),
          totalTransactions: sparklineData.reduce((sum, day) => sum + day.transactions, 0),
          avgDailyRevenue:
            sparklineData.length > 0
              ? Math.round(
                  sparklineData.reduce((sum, day) => sum + day.revenue, 0) / sparklineData.length
                )
              : 0,
        },
      });
    } catch (e) {
      const error = e as Error;
      logger.error(
        { error: error.message, companyId: req.tenant?.companyId },
        'Revenue analytics error'
      );
      res.status(500).json({ message: 'Failed to fetch revenue analytics' });
    }
  }
);

/**
 * GET /v1/dashboard/activity - Get recent activity events
 *
 * Query Parameters:
 * - orgId: Required UUID of the organization (for compatibility with SSE)
 * - locationId: Optional UUID of specific gym location
 * - since: Optional ISO timestamp to get events after
 * - limit: Optional number of events to return (default: 25, max: 100)
 */
router.get(
  '/activity',
  authRequired(['owner', 'manager', 'staff']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { companyId } = req.tenant!;

      // Validate query parameters
      let validatedQuery;
      try {
        validatedQuery = validateActivityQuery({
          orgId: req.query.orgId || companyId, // Default to tenant's companyId
          locationId: req.query.locationId || null,
          since: req.query.since,
          limit: req.query.limit || '25',
        });
      } catch (error) {
        if (error instanceof DashboardValidationError) {
          return res.status(422).json({
            error: error.code,
            message: error.message,
            field: error.field,
          });
        }
        throw error;
      }

      const { orgId, locationId, since, limit } = validatedQuery;

      // Validate tenant access
      validateTenantAccess(companyId, orgId);

      const limitNum = parseInt(limit, 10);
      const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

      // Get recent visits (check-ins and check-outs)
      const recentVisits = await prisma.visit.findMany({
        where: {
          membership: {
            companyId,
          },
          ...(locationId && { gymId: locationId as string }),
          OR: [
            {
              checkIn: {
                gte: sinceDate,
              },
            },
            {
              checkOut: {
                gte: sinceDate,
              },
            },
          ],
        },
        include: {
          membership: {
            include: {
              member: true,
            },
          },
          gym: true,
        },
        orderBy: [{ checkIn: 'desc' }, { checkOut: 'desc' }],
        take: limitNum,
      });

      // Convert visits to activity events
      const events = [];

      for (const visit of recentVisits) {
        // Check-in event
        if (visit.checkIn && visit.checkIn >= sinceDate) {
          events.push({
            id: `visit-checkin-${visit.id}`,
            type: 'visit.checkin',
            at: visit.checkIn.toISOString(),
            orgId: companyId,
            locationId: visit.gymId,
            payload: {
              visitId: visit.id,
              memberId: visit.membership.memberId,
              memberName: `${visit.membership.member?.firstName || ''} ${visit.membership.member?.lastName || ''}`,
              gymId: visit.gymId,
              gymName: visit.gym.name,
              checkinAt: visit.checkIn.toISOString(),
            },
          });
        }

        // Check-out event
        if (visit.checkOut && visit.checkOut >= sinceDate) {
          const durationMinutes =
            visit.checkIn && visit.checkOut
              ? Math.floor((visit.checkOut.getTime() - visit.checkIn.getTime()) / 60000)
              : 0;

          events.push({
            id: `visit-checkout-${visit.id}`,
            type: 'visit.checkout',
            at: visit.checkOut.toISOString(),
            orgId: companyId,
            locationId: visit.gymId,
            payload: {
              visitId: visit.id,
              memberId: visit.membership.memberId,
              memberName: `${visit.membership.member?.firstName || ''} ${visit.membership.member?.lastName || ''}`,
              gymId: visit.gymId,
              gymName: visit.gym.name,
              checkoutAt: visit.checkOut.toISOString(),
              durationMinutes,
            },
          });
        }
      }

      // Sort all events by timestamp (most recent first)
      events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

      // Limit to requested number of events
      const limitedEvents = events.slice(0, limitNum);

      res.json({
        events: limitedEvents,
        total: limitedEvents.length,
        since: sinceDate.toISOString(),
        generatedAt: new Date().toISOString(),
      });
    } catch (e) {
      const error = e as Error;
      logger.error(
        { error: error.message, companyId: req.tenant?.companyId },
        'Dashboard activity error'
      );
      res.status(500).json({
        message: 'Failed to fetch dashboard activity',
      });
    }
  }
);

export default router;
