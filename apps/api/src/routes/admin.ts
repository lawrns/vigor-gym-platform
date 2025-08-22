import express, { Response } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authRequired } from '../middleware/auth.js';
import { tenantRequired, TenantRequest } from '../middleware/tenant.js';
import { logger } from '../utils/auditLogger.js';
import { seedDemoCompany } from '../seed/demoCompany.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /v1/admin/demo/reset
 * Reset demo company with fresh deterministic data
 * Guarded route - only available when ENABLE_DEMO_SEED=1
 */
router.post(
  '/demo/reset',
  authRequired(['owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      // Guard: Only allow if demo seeding is enabled
      if (process.env.ENABLE_DEMO_SEED !== '1') {
        return res.status(403).json({
          error: 'DEMO_SEED_DISABLED',
          message: 'Demo seeding is not enabled in this environment',
        });
      }

      const { companyId } = req.tenant!;

      // Additional guard: Only allow for demo company
      const demoCompanyId = process.env.DEMO_COMPANY_ID;
      if (demoCompanyId && companyId !== demoCompanyId) {
        return res.status(403).json({
          error: 'NOT_DEMO_COMPANY',
          message: 'Demo reset is only allowed for the designated demo company',
        });
      }

      logger.info({ companyId }, 'Starting demo company reset');

      // Reset demo company data
      const result = await seedDemoCompany(companyId);

      logger.info(
        {
          companyId,
          membersCreated: result.membersCreated,
          visitsCreated: result.visitsCreated,
          paymentsCreated: result.paymentsCreated,
        },
        'Demo company reset completed'
      );

      res.json({
        message: 'Demo company reset completed successfully',
        data: {
          companyId,
          membersCreated: result.membersCreated,
          visitsCreated: result.visitsCreated,
          paymentsCreated: result.paymentsCreated,
          classesCreated: result.classesCreated,
          staffCreated: result.staffCreated,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      const error = e as Error;
      logger.error(
        {
          error: error.message,
          companyId: req.tenant?.companyId,
        },
        'Demo reset error'
      );

      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to reset demo company',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * GET /v1/admin/demo/status
 * Get demo company status and configuration
 */
router.get(
  '/demo/status',
  authRequired(['owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { companyId } = req.tenant!;

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          _count: {
            select: {
              members: true,
              staff: true,
              memberships: true,
              devices: true,
            },
          },
        },
      });

      if (!company) {
        return res.status(404).json({
          error: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        });
      }

      // Get recent activity counts
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [visitsCount, paymentsCount] = await Promise.all([
        prisma.visit.count({
          where: {
            membership: {
              companyId,
            },
            checkIn: {
              gte: thirtyDaysAgo,
            },
          },
        }),
        prisma.payment.count({
          where: {
            invoice: {
              companyId,
            },
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
        }),
      ]);

      const isDemoCompany = process.env.DEMO_COMPANY_ID === companyId;
      const demoSeedEnabled = process.env.ENABLE_DEMO_SEED === '1';

      res.json({
        company: {
          id: company.id,
          name: company.name,
          isDemoCompany,
          counts: {
            members: company._count.members,
            memberships: company._count.memberships,
            devices: company._count.devices,
            staff: company._count.staff,
            visitsLast30Days: visitsCount,
            paymentsLast30Days: paymentsCount,
          },
        },
        config: {
          demoSeedEnabled,
          demoCompanyId: process.env.DEMO_COMPANY_ID,
          canReset: isDemoCompany && demoSeedEnabled,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      const error = e as Error;
      logger.error(
        {
          error: error.message,
          companyId: req.tenant?.companyId,
        },
        'Demo status error'
      );

      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch demo status',
      });
    }
  }
);

export default router;
