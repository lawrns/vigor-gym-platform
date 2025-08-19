import express, { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma/index.js';
import { deviceAuthRequired, DeviceAuthenticatedRequest } from '../middleware/deviceAuth.js';
import { logCheckinScan, logCheckinCheckout, logRateLimitHit } from '../utils/auditLogger.js';
import { broadcastVisitCheckin, broadcastVisitCheckout } from '../utils/eventBroadcaster.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiting for check-ins (disabled in test mode)
const isTestMode = process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMITING === 'true';

const scanRateLimit = isTestMode
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 60, // 60 scans per minute per device
      message: { message: 'Too many scan attempts, please try again later', code: 'RATE_LIMITED' },
      standardHeaders: true,
      legacyHeaders: false,
      handler: async (req: Request, res: Response) => {
        await logRateLimitHit('checkin.scan', req.ip, req.ip, req.get('User-Agent'));
        res.status(429).json({
          message: 'Too many scan attempts, please try again later',
          code: 'RATE_LIMITED',
        });
      },
    });

const checkoutRateLimit = isTestMode
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 60, // 60 checkouts per minute per device
      message: {
        message: 'Too many checkout attempts, please try again later',
        code: 'RATE_LIMITED',
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: async (req: Request, res: Response) => {
        await logRateLimitHit('checkin.checkout', req.ip, req.ip, req.get('User-Agent'));
        res.status(429).json({
          message: 'Too many checkout attempts, please try again later',
          code: 'RATE_LIMITED',
        });
      },
    });

// Validation schemas
const scanMemberSchema = z
  .object({
    memberId: z.string().uuid().optional(),
    qrCode: z.string().optional(),
    biometricStub: z.string().optional(),
    gymId: z.string().uuid(),
  })
  .refine(data => data.memberId || data.qrCode || data.biometricStub, {
    message: 'At least one of memberId, qrCode, or biometricStub must be provided',
  });

const checkoutSchema = z.object({
  visitId: z.string().uuid(),
});

/**
 * Evaluate membership state and determine access rules
 */
function evaluateMembershipState(membership: any): {
  allowed: boolean;
  denied: boolean;
  warning: boolean;
  state: 'OK' | 'PAST_DUE' | 'DENIED';
  code?: string;
  message: string;
} {
  const now = new Date();

  // Check if membership has expired by date
  if (membership.endsAt && membership.endsAt < now) {
    return {
      allowed: false,
      denied: true,
      warning: false,
      state: 'DENIED',
      code: 'MEMBERSHIP_EXPIRED',
      message: 'Membership has expired',
    };
  }

  // Business rules based on membership status
  switch (membership.status) {
    case 'active':
      return {
        allowed: true,
        denied: false,
        warning: false,
        state: 'OK',
        message: 'Access granted',
      };

    case 'past_due':
      // Allow access but show warning
      return {
        allowed: true,
        denied: false,
        warning: true,
        state: 'PAST_DUE',
        code: 'PAST_DUE',
        message: 'Access granted - membership payment overdue',
      };

    case 'frozen':
      // Deny access unless override flag (future implementation)
      return {
        allowed: false,
        denied: true,
        warning: false,
        state: 'DENIED',
        code: 'MEMBERSHIP_FROZEN',
        message: 'Membership is frozen',
      };

    case 'expired':
    case 'canceled':
      return {
        allowed: false,
        denied: true,
        warning: false,
        state: 'DENIED',
        code: 'NO_ACTIVE_MEMBERSHIP',
        message: 'No active membership found',
      };

    default:
      return {
        allowed: false,
        denied: true,
        warning: false,
        state: 'DENIED',
        code: 'INVALID_MEMBERSHIP_STATUS',
        message: 'Invalid membership status',
      };
  }
}

/**
 * Helper function to extract member ID from different input types
 */
function extractMemberId(data: {
  memberId?: string;
  qrCode?: string;
  biometricStub?: string;
}): string | null {
  if (data.memberId) {
    return data.memberId;
  }

  if (data.qrCode) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(data.qrCode);
      if (parsed.type === 'member' && parsed.id) {
        return parsed.id;
      }
    } catch {
      // If not JSON, treat as direct member ID
      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(data.qrCode)) {
        return data.qrCode;
      }
    }
  }

  if (data.biometricStub) {
    // For now, treat biometric stub as member ID (future implementation)
    return data.biometricStub;
  }

  return null;
}

/**
 * POST /v1/checkins/scan
 * Scan member and create visit (check-in)
 */
router.post(
  '/scan',
  deviceAuthRequired(),
  scanRateLimit,
  async (req: DeviceAuthenticatedRequest, res: Response) => {
    try {
      const validatedData = scanMemberSchema.parse(req.body);
      const deviceCompanyId = req.device!.companyId;
      const deviceId = req.device!.id;

      // Extract member ID from input
      const memberId = extractMemberId(validatedData);
      if (!memberId) {
        await logCheckinScan(
          deviceId,
          deviceCompanyId,
          'unknown',
          'unknown',
          false,
          'manual',
          req.ip,
          req.get('User-Agent'),
          'INVALID_FORMAT',
          'Invalid member identification format'
        );
        return res
          .status(400)
          .json({ message: 'Invalid member identification format', code: 'INVALID_FORMAT' });
      }

      // Determine scan method
      const scanMethod: 'qr' | 'manual' | 'biometric' = validatedData.qrCode
        ? 'qr'
        : validatedData.biometricStub
          ? 'biometric'
          : 'manual';

      // Find member and their memberships (including non-active ones for state checking)
      const member = await prisma.member.findFirst({
        where: {
          id: memberId,
          companyId: deviceCompanyId,
        },
        include: {
          memberships: {
            where: {
              OR: [
                { status: 'active' },
                { status: 'past_due' },
                { status: 'frozen' },
                { status: 'expired' },
                { status: 'canceled' },
              ],
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!member) {
        await logCheckinScan(
          deviceId,
          deviceCompanyId,
          memberId,
          'unknown',
          false,
          scanMethod,
          req.ip,
          req.get('User-Agent'),
          'MEMBER_NOT_FOUND',
          'Member not found or access denied'
        );
        return res
          .status(404)
          .json({ message: 'Member not found or access denied', code: 'MEMBER_NOT_FOUND' });
      }

      if (member.status !== 'active') {
        await logCheckinScan(
          deviceId,
          deviceCompanyId,
          memberId,
          'unknown',
          false,
          scanMethod,
          req.ip,
          req.get('User-Agent'),
          'MEMBER_INACTIVE',
          'Member account is not active'
        );
        return res.status(403).json({
          message: 'Member account is not active',
          code: 'MEMBER_INACTIVE',
          state: 'DENIED',
        });
      }

      const membership = member.memberships[0];
      if (!membership) {
        await logCheckinScan(
          deviceId,
          deviceCompanyId,
          memberId,
          'unknown',
          false,
          scanMethod,
          req.ip,
          req.get('User-Agent'),
          'NO_MEMBERSHIP',
          'No membership found'
        );
        return res
          .status(403)
          .json({ message: 'No membership found', code: 'NO_MEMBERSHIP', state: 'DENIED' });
      }

      // Implement membership state business rules
      const membershipStateResult = evaluateMembershipState(membership);

      if (membershipStateResult.denied) {
        await logCheckinScan(
          deviceId,
          deviceCompanyId,
          memberId,
          'unknown',
          false,
          scanMethod,
          req.ip,
          req.get('User-Agent'),
          membershipStateResult.code,
          membershipStateResult.message
        );
        return res.status(403).json({
          message: membershipStateResult.message,
          code: membershipStateResult.code,
          state: 'DENIED',
        });
      }

      // Check for existing open visit (prevent double check-in)
      const existingVisit = await prisma.visit.findFirst({
        where: {
          membershipId: membership.id,
          checkOut: null, // Still checked in
        },
      });

      if (existingVisit) {
        // Check if it's within 5 minutes (allow re-entry for mistakes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (existingVisit.checkIn > fiveMinutesAgo) {
          await logCheckinScan(
            deviceId,
            deviceCompanyId,
            memberId,
            existingVisit.id,
            false,
            scanMethod,
            req.ip,
            req.get('User-Agent'),
            'DUPLICATE_CHECKIN',
            'Member is already checked in'
          );
          return res.status(409).json({
            message: 'Member is already checked in',
            code: 'DUPLICATE_CHECKIN',
            existingVisit: {
              id: existingVisit.id,
              checkIn: existingVisit.checkIn,
            },
          });
        } else {
          // Auto-checkout the old visit if it's older than 5 minutes
          await prisma.visit.update({
            where: { id: existingVisit.id },
            data: { checkOut: new Date() },
          });
        }
      }

      // Create new visit
      const visit = await prisma.visit.create({
        data: {
          membershipId: membership.id,
          gymId: validatedData.gymId,
          deviceId: deviceId,
          checkIn: new Date(),
        },
        include: {
          membership: {
            include: {
              member: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          gym: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Log successful check-in
      await logCheckinScan(
        deviceId,
        deviceCompanyId,
        memberId,
        visit.id,
        true,
        scanMethod,
        req.ip,
        req.get('User-Agent')
      );

      // Broadcast real-time event for dashboard updates
      broadcastVisitCheckin(
        visit.id,
        deviceCompanyId,
        visit.gymId,
        visit.membership.memberId,
        `${visit.membership.member.firstName} ${visit.membership.member.lastName}`,
        visit.gym.name
      );

      res.status(201).json({
        visit: {
          id: visit.id,
          checkIn: visit.checkIn,
          member: visit.membership.member,
          gym: visit.gym,
        },
        state: membershipStateResult.state,
        code: membershipStateResult.code,
        message: membershipStateResult.message,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Check-in scan error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * POST /v1/checkins/checkout
 * Close visit (check-out)
 */
router.post(
  '/checkout',
  deviceAuthRequired(),
  checkoutRateLimit,
  async (req: DeviceAuthenticatedRequest, res: Response) => {
    try {
      const validatedData = checkoutSchema.parse(req.body);
      const deviceCompanyId = req.device!.companyId;

      // Find the visit and verify it belongs to the device's company
      const visit = await prisma.visit.findFirst({
        where: {
          id: validatedData.visitId,
          checkOut: null, // Still checked in
          membership: {
            companyId: deviceCompanyId,
          },
        },
        include: {
          membership: {
            include: {
              member: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!visit) {
        await logCheckinCheckout(
          deviceCompanyId,
          deviceCompanyId,
          validatedData.visitId,
          0,
          false,
          req.ip,
          req.get('User-Agent'),
          'VISIT_NOT_FOUND',
          'Visit not found or already checked out'
        );
        return res
          .status(404)
          .json({ message: 'Visit not found or already checked out', code: 'VISIT_NOT_FOUND' });
      }

      // Calculate duration (minimum 1 minute as per requirements)
      const checkOutTime = new Date();
      const durationMs = checkOutTime.getTime() - visit.checkIn.getTime();
      const durationMinutes = Math.max(1, Math.floor(durationMs / (1000 * 60)));

      // Update visit with checkout time
      const updatedVisit = await prisma.visit.update({
        where: { id: visit.id },
        data: { checkOut: checkOutTime },
        include: {
          membership: {
            include: {
              member: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      // Log successful checkout
      await logCheckinCheckout(
        deviceCompanyId,
        deviceCompanyId,
        visit.id,
        durationMinutes,
        true,
        req.ip,
        req.get('User-Agent')
      );

      // Broadcast real-time event for dashboard updates
      broadcastVisitCheckout(
        visit.id,
        deviceCompanyId,
        visit.gymId,
        visit.membership.memberId,
        `${updatedVisit.membership.member.firstName} ${updatedVisit.membership.member.lastName}`,
        visit.gym.name,
        durationMinutes
      );

      res.json({
        visit: {
          id: updatedVisit.id,
          checkIn: updatedVisit.checkIn,
          checkOut: updatedVisit.checkOut,
          durationMinutes,
          member: updatedVisit.membership.member,
        },
        message: 'Check-out successful',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Check-out error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * GET /v1/checkins/:id
 * Get visit details
 */
router.get('/:id', deviceAuthRequired(), async (req: DeviceAuthenticatedRequest, res: Response) => {
  try {
    const visitId = req.params.id;
    const deviceCompanyId = req.device!.companyId;

    const visit = await prisma.visit.findFirst({
      where: {
        id: visitId,
        membership: {
          companyId: deviceCompanyId,
        },
      },
      include: {
        membership: {
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
        device: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    // Calculate duration if checked out
    let durationMinutes = null;
    if (visit.checkOut) {
      const durationMs = visit.checkOut.getTime() - visit.checkIn.getTime();
      durationMinutes = Math.floor(durationMs / (1000 * 60));
    }

    res.json({
      visit: {
        id: visit.id,
        checkIn: visit.checkIn,
        checkOut: visit.checkOut,
        durationMinutes,
        member: visit.membership.member,
        gym: visit.gym,
        device: visit.device,
      },
    });
  } catch (error) {
    console.error('Get visit error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
