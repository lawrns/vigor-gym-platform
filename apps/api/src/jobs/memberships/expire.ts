import { PrismaClient } from '../../generated/prisma/index.js';
import { logger } from '../../utils/auditLogger.js';

const prisma = new PrismaClient();

export interface ExpirationJobResult {
  processedCount: number;
  expiredCount: number;
  soonToExpireCount: number;
  errors: string[];
  executionTime: number;
}

/**
 * Nightly job to process membership expirations
 * - Mark memberships as expired when endDate < today
 * - Identify memberships expiring soon (7, 14 days)
 * - Queue notification emails (future enhancement)
 */
export async function processMembershipExpirations(): Promise<ExpirationJobResult> {
  const startTime = Date.now();
  const result: ExpirationJobResult = {
    processedCount: 0,
    expiredCount: 0,
    soonToExpireCount: 0,
    errors: [],
    executionTime: 0,
  };

  try {
    logger.info('Starting membership expiration job');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Step 1: Mark expired memberships
    const expiredResult = await prisma.membership.updateMany({
      where: {
        status: {
          in: ['active', 'past_due'], // Only update active or past_due memberships
        },
        endsAt: {
          lt: today, // End date is before today
        },
      },
      data: {
        status: 'expired',
        updatedAt: now,
      },
    });

    result.expiredCount = expiredResult.count;
    logger.info({ expiredCount: result.expiredCount }, 'Marked memberships as expired');

    // Step 2: Identify soon-to-expire memberships for notifications
    const _sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const soonToExpire = await prisma.membership.findMany({
      where: {
        status: {
          in: ['active', 'past_due'],
        },
        endsAt: {
          gte: today,
          lte: fourteenDaysFromNow,
        },
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    result.soonToExpireCount = soonToExpire.length;

    // Step 3: Queue notification emails (future enhancement)
    for (const membership of soonToExpire) {
      try {
        const daysUntilExpiry = Math.ceil(
          (membership.endsAt!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Log for audit trail
        logger.info(
          {
            membershipId: membership.id,
            memberId: membership.member.id,
            companyId: membership.companyId,
            daysUntilExpiry,
          },
          'Membership expiring soon'
        );

        // TODO: Queue email notification
        // await queueExpirationEmail(membership, daysUntilExpiry);

        result.processedCount++;
      } catch (error) {
        const errorMsg = `Failed to process membership ${membership.id}: ${error.message}`;
        result.errors.push(errorMsg);
        logger.error({ membershipId: membership.id, error: error.message }, errorMsg);
      }
    }

    // Step 4: Update company-level expiration metrics (for dashboard)
    const companies = await prisma.company.findMany({
      select: { id: true },
    });

    for (const company of companies) {
      try {
        await updateCompanyExpirationMetrics(company.id, today);
      } catch (error) {
        const errorMsg = `Failed to update metrics for company ${company.id}: ${error.message}`;
        result.errors.push(errorMsg);
        logger.error({ companyId: company.id, error: error.message }, errorMsg);
      }
    }

    result.executionTime = Date.now() - startTime;

    logger.info(
      {
        processedCount: result.processedCount,
        expiredCount: result.expiredCount,
        soonToExpireCount: result.soonToExpireCount,
        errorCount: result.errors.length,
        executionTime: result.executionTime,
      },
      'Membership expiration job completed'
    );

    return result;
  } catch (error) {
    result.executionTime = Date.now() - startTime;
    result.errors.push(`Job failed: ${error.message}`);

    logger.error(
      {
        error: error.message,
        executionTime: result.executionTime,
      },
      'Membership expiration job failed'
    );

    throw error;
  }
}

/**
 * Update company-level expiration metrics for dashboard widgets
 */
async function updateCompanyExpirationMetrics(companyId: string, today: Date): Promise<void> {
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Count memberships by expiration status
  const [expiring7Days, expiring14Days, pastDue, expired] = await Promise.all([
    prisma.membership.count({
      where: {
        companyId,
        status: { in: ['active', 'past_due'] },
        endsAt: { gte: today, lte: sevenDaysFromNow },
      },
    }),
    prisma.membership.count({
      where: {
        companyId,
        status: { in: ['active', 'past_due'] },
        endsAt: { gte: today, lte: fourteenDaysFromNow },
      },
    }),
    prisma.membership.count({
      where: {
        companyId,
        status: 'past_due',
      },
    }),
    prisma.membership.count({
      where: {
        companyId,
        status: 'expired',
      },
    }),
  ]);

  // Store metrics (could be in a separate metrics table or cache)
  logger.info(
    {
      companyId,
      expiring7Days,
      expiring14Days,
      pastDue,
      expired,
    },
    'Updated company expiration metrics'
  );
}

/**
 * Get expiration summary for a company
 */
export async function getExpirationSummary(companyId: string): Promise<{
  expiring7Days: number;
  expiring14Days: number;
  pastDue: number;
  expired: number;
}> {
  const today = new Date();
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [expiring7Days, expiring14Days, pastDue, expired] = await Promise.all([
    prisma.membership.count({
      where: {
        companyId,
        status: { in: ['active', 'past_due'] },
        endsAt: { gte: today, lte: sevenDaysFromNow },
      },
    }),
    prisma.membership.count({
      where: {
        companyId,
        status: { in: ['active', 'past_due'] },
        endsAt: { gte: today, lte: fourteenDaysFromNow },
      },
    }),
    prisma.membership.count({
      where: {
        companyId,
        status: 'past_due',
      },
    }),
    prisma.membership.count({
      where: {
        companyId,
        status: 'expired',
      },
    }),
  ]);

  return {
    expiring7Days,
    expiring14Days,
    pastDue,
    expired,
  };
}

/**
 * Manual trigger for expiration job (for testing)
 */
export async function triggerExpirationJob(): Promise<ExpirationJobResult> {
  logger.info('Manually triggering membership expiration job');
  return await processMembershipExpirations();
}
