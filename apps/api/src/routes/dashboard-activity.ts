/**
 * Dashboard Activity Endpoint
 *
 * Provides recent activity events for polling fallback when SSE is unavailable
 */

import { Router, Request, Response } from 'express';
import { authRequired } from '../middleware/auth';
import { PrismaClient } from '../generated/prisma/index.js';

const router = Router();
const prisma = new PrismaClient();

interface ActivityQuery {
  orgId?: string;
  locationId?: string;
  since?: string;
  limit?: string;
}

/**
 * GET /v1/dashboard/activity - Get recent activity events
 *
 * Query Parameters:
 * - orgId: Required UUID of the organization
 * - locationId: Optional UUID of specific gym location
 * - since: Optional ISO timestamp to get events after
 * - limit: Optional number of events to return (default: 25, max: 100)
 */
router.get('/activity', authRequired(), async (req: Request, res: Response) => {
  try {
    const { orgId, locationId, since, limit = '25' } = req.query as ActivityQuery;
    const user = (req as any).user;

    // Validate required parameters
    if (!orgId) {
      return res.status(422).json({
        error: 'MISSING_ORG_ID',
        message: 'orgId query parameter is required',
      });
    }

    // Enforce tenant isolation
    if (user.companyId !== orgId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Access denied to organization data',
      });
    }

    const limitNum = Math.min(parseInt(limit, 10) || 25, 100);
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

    // Get recent visits (check-ins and check-outs)
    const recentVisits = await prisma.visit.findMany({
      where: {
        membership: {
          companyId: orgId,
        },
        ...(locationId && { gymId: locationId }),
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
          orgId,
          locationId: visit.gymId,
          payload: {
            visitId: visit.id,
            memberId: visit.membership.memberId,
            memberName: `${visit.membership.member.firstName} ${visit.membership.member.lastName}`,
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
          orgId,
          locationId: visit.gymId,
          payload: {
            visitId: visit.id,
            memberId: visit.membership.memberId,
            memberName: `${visit.membership.member.firstName} ${visit.membership.member.lastName}`,
            gymId: visit.gymId,
            gymName: visit.gym.name,
            checkoutAt: visit.checkOut.toISOString(),
            durationMinutes,
          },
        });
      }
    }

    // Get expiring memberships (within next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringMemberships = await prisma.membership.findMany({
      where: {
        companyId: orgId,
        status: 'active',
        endsAt: {
          lte: thirtyDaysFromNow,
          gte: new Date(), // Not already expired
        },
      },
      include: {
        member: true,
        plan: true,
      },
      orderBy: {
        endsAt: 'asc',
      },
      take: 10, // Limit expiring memberships
    });

    for (const membership of expiringMemberships) {
      const daysLeft = Math.ceil(
        (membership.endsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );

      // Only include if expiring soon (within 7 days) for activity feed
      if (daysLeft <= 7) {
        events.push({
          id: `membership-expiring-${membership.id}`,
          type: 'membership.expiring',
          at: new Date().toISOString(), // Current time for sorting
          orgId,
          locationId: null, // Memberships are org-wide
          payload: {
            membershipId: membership.id,
            memberId: membership.memberId,
            memberName: `${membership.member.firstName} ${membership.member.lastName}`,
            planName: membership.plan.name,
            expiresAt: membership.endsAt.toISOString(),
            daysLeft,
          },
        });
      }
    }

    // Get recent failed payments
    const recentFailedPayments = await prisma.payment.findMany({
      where: {
        invoice: {
          companyId: orgId,
        },
        status: 'failed',
        createdAt: {
          gte: sinceDate,
        },
      },
      include: {
        invoice: {
          include: {
            membership: {
              include: {
                member: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit failed payments
    });

    for (const payment of recentFailedPayments) {
      if (payment.invoice.membership) {
        events.push({
          id: `payment-failed-${payment.id}`,
          type: 'payment.failed',
          at: payment.createdAt.toISOString(),
          orgId,
          locationId: null, // Payments are org-wide
          payload: {
            paymentId: payment.id,
            invoiceId: payment.invoiceId,
            memberId: payment.invoice.membership.memberId,
            memberName: `${payment.invoice.membership.member.firstName} ${payment.invoice.membership.member.lastName}`,
            amountMxnCents: payment.paidMxnCents || 0,
            reason: payment.failureReason || 'Unknown error',
            retryCount: 0, // Would need to track this separately
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
  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({
      message: 'Failed to fetch dashboard activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
