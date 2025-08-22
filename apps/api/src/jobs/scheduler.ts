import cron from 'node-cron';
import { processMembershipExpirations } from './memberships/expire.js';
import { logger } from '../utils/auditLogger.js';

// Job configuration
const JOBS_ENABLED = process.env.JOBS_ENABLED !== 'false';
const JOB_TZ = process.env.JOB_TZ || 'America/Mexico_City';

/**
 * Initialize and start all scheduled jobs
 */
export function initializeScheduler(): void {
  if (!JOBS_ENABLED) {
    logger.info('Job scheduler disabled via JOBS_ENABLED=false');
    return;
  }

  logger.info({ timezone: JOB_TZ }, 'Initializing job scheduler');

  // Membership expiration job - runs daily at 2:00 AM
  cron.schedule(
    '0 2 * * *',
    async () => {
      logger.info('Starting scheduled membership expiration job');

      try {
        const result = await processMembershipExpirations();
        logger.info(
          {
            processedCount: result.processedCount,
            expiredCount: result.expiredCount,
            soonToExpireCount: result.soonToExpireCount,
            errorCount: result.errors.length,
            executionTime: result.executionTime,
          },
          'Scheduled membership expiration job completed'
        );
      } catch (e) {
        const error = e as Error;
        logger.error(
          {
            error: error.message,
            stack: error.stack,
          },
          'Scheduled membership expiration job failed'
        );
      }
    },
    {
      timezone: JOB_TZ,
    }
  );

  // Health check job - runs every hour to ensure scheduler is alive
  cron.schedule(
    '0 * * * *',
    () => {
      logger.info('Job scheduler health check');
    },
    {
      timezone: JOB_TZ,
    }
  );

  logger.info('Job scheduler initialized successfully');
}

/**
 * Get scheduler status and next run times
 */
export function getSchedulerStatus(): {
  enabled: boolean;
  timezone: string;
  jobs: Array<{
    name: string;
    schedule: string;
    nextRun: string | null;
  }>;
} {
  return {
    enabled: JOBS_ENABLED,
    timezone: JOB_TZ,
    jobs: [
      {
        name: 'membership-expiration',
        schedule: '0 2 * * * (Daily at 2:00 AM)',
        nextRun: JOBS_ENABLED ? getNextRunTime('0 2 * * *') : null,
      },
      {
        name: 'health-check',
        schedule: '0 * * * * (Hourly)',
        nextRun: JOBS_ENABLED ? getNextRunTime('0 * * * *') : null,
      },
    ],
  };
}

/**
 * Calculate next run time for a cron expression
 */
function getNextRunTime(_cronExpression: string): string {
  try {
    // This is a simplified calculation - in production, use a proper cron parser
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // Next 2 AM

    return tomorrow.toISOString();
  } catch (error) {
    return 'Unable to calculate';
  }
}
