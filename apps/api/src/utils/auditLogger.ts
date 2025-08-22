import { PrismaClient } from '../generated/prisma/index.js';
import pino from 'pino';

const prisma = new PrismaClient();

// Create structured logger with PII redaction
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'deviceSecret',
      'password',
      'passwordHash',
      'email',
      'phone',
      'ssn',
      'creditCard',
      'token',
      'authorization',
      'cookie',
    ],
    censor: '[REDACTED]',
  },
  formatters: {
    level: label => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'vigor-api',
    version: process.env.npm_package_version || '1.0.0',
  },
});

export interface AuditEvent {
  action: string;
  userId?: string;
  deviceId?: string;
  companyId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface SecurityMetrics {
  deviceLogins: number;
  checkinsScanned: number;
  checkinsBlockedDuplicate: number;
  devicesActive24h: number;
  authFailures: number;
  rateLimitHits: number;
}

// Metrics counters (in production, use Prometheus or similar)
const metrics: SecurityMetrics = {
  deviceLogins: 0,
  checkinsScanned: 0,
  checkinsBlockedDuplicate: 0,
  devicesActive24h: 0,
  authFailures: 0,
  rateLimitHits: 0,
};

/**
 * Log audit event with structured logging
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    // Structure the log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: event.action,
      userId: event.userId,
      deviceId: event.deviceId,
      companyId: event.companyId,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      success: event.success,
      errorCode: event.errorCode,
      errorMessage: event.errorMessage,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      metadata: event.metadata,
    };

    // Log to structured logger
    if (event.success) {
      logger.info(logEntry, `Audit: ${event.action}`);
    } else {
      logger.warn(logEntry, `Audit Failed: ${event.action}`);
    }

    // Store in database for compliance (optional, based on requirements)
    if (process.env.AUDIT_DB_ENABLED === 'true') {
      await prisma.$executeRaw`
        INSERT INTO audit_logs (
          action, user_id, device_id, company_id, resource_type, resource_id,
          success, error_code, error_message, ip_address, user_agent, metadata, created_at
        ) VALUES (
          ${event.action}, ${event.userId}, ${event.deviceId}, ${event.companyId},
          ${event.resourceType}, ${event.resourceId}, ${event.success}, ${event.errorCode},
          ${event.errorMessage}, ${event.ipAddress}, ${event.userAgent}, 
          ${JSON.stringify(event.metadata)}, NOW()
        )
      `;
    }
  } catch (error) {
    // Never fail the main operation due to audit logging issues
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to log audit event');
  }
}

/**
 * Log device registration event
 */
export async function logDeviceRegistration(
  userId: string,
  companyId: string,
  deviceId: string,
  deviceName: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action: 'device.register',
    userId,
    companyId,
    resourceType: 'device',
    resourceId: deviceId,
    metadata: { deviceName },
    ipAddress,
    userAgent,
    success: true,
  });
}

/**
 * Log device login event
 */
export async function logDeviceLogin(
  deviceId: string,
  companyId: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  errorCode?: string,
  errorMessage?: string
): Promise<void> {
  await logAuditEvent({
    action: 'device.login',
    deviceId,
    companyId,
    resourceType: 'device',
    resourceId: deviceId,
    ipAddress,
    userAgent,
    success,
    errorCode,
    errorMessage,
  });

  // Update metrics
  if (success) {
    metrics.deviceLogins++;
  } else {
    metrics.authFailures++;
  }
}

/**
 * Log check-in scan event
 */
export async function logCheckinScan(
  deviceId: string,
  companyId: string,
  memberId: string,
  visitId: string,
  success: boolean,
  scanMethod: 'qr' | 'manual' | 'biometric',
  ipAddress?: string,
  userAgent?: string,
  errorCode?: string,
  errorMessage?: string
): Promise<void> {
  await logAuditEvent({
    action: 'checkin.scan',
    deviceId,
    companyId,
    resourceType: 'visit',
    resourceId: visitId,
    metadata: { memberId, scanMethod },
    ipAddress,
    userAgent,
    success,
    errorCode,
    errorMessage,
  });

  // Update metrics
  if (success) {
    metrics.checkinsScanned++;
  }
  if (errorCode === 'DUPLICATE_CHECKIN') {
    metrics.checkinsBlockedDuplicate++;
  }
}

/**
 * Log check-out event
 */
export async function logCheckinCheckout(
  deviceId: string,
  companyId: string,
  visitId: string,
  durationMinutes: number,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  errorCode?: string,
  errorMessage?: string
): Promise<void> {
  await logAuditEvent({
    action: 'checkin.checkout',
    deviceId,
    companyId,
    resourceType: 'visit',
    resourceId: visitId,
    metadata: { durationMinutes },
    ipAddress,
    userAgent,
    success,
    errorCode,
    errorMessage,
  });
}

/**
 * Log rate limit hit
 */
export async function logRateLimitHit(
  action: string,
  identifier: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action: 'rate_limit.hit',
    metadata: { originalAction: action, identifier },
    ipAddress,
    userAgent,
    success: false,
    errorCode: 'RATE_LIMITED',
  });

  metrics.rateLimitHits++;
}

/**
 * Get current security metrics
 */
export function getSecurityMetrics(): SecurityMetrics {
  return { ...metrics };
}

/**
 * Reset metrics (for testing or periodic resets)
 */
export function resetMetrics(): void {
  Object.keys(metrics).forEach(key => {
    metrics[key as keyof SecurityMetrics] = 0;
  });
}

/**
 * Update active devices count (called periodically)
 */
export async function updateActiveDevicesCount(): Promise<void> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const activeDevices = await prisma.device.count({
      where: {
        lastSeenAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    metrics.devicesActive24h = activeDevices;
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to update active devices count');
  }
}

/**
 * Check for security alerts
 */
export function checkSecurityAlerts(): Array<{
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}> {
  const alerts = [];

  // Check device login failure rate
  const totalLogins = metrics.deviceLogins + metrics.authFailures;
  if (totalLogins > 0) {
    const failureRate = metrics.authFailures / totalLogins;
    if (failureRate > 0.02) {
      // 2% threshold
      alerts.push({
        type: 'device_login_failure_rate',
        message: `Device login failure rate is ${(failureRate * 100).toFixed(1)}% (threshold: 2%)`,
        severity: failureRate > 0.05 ? 'high' : 'medium',
      });
    }
  }

  // Check duplicate check-ins spike
  const duplicateRate = metrics.checkinsBlockedDuplicate / Math.max(metrics.checkinsScanned, 1);
  if (duplicateRate > 0.01) {
    // 1% baseline
    alerts.push({
      type: 'duplicate_checkins_spike',
      message: `Duplicate check-ins rate is ${(duplicateRate * 100).toFixed(1)}% (baseline: 1%)`,
      severity: duplicateRate > 0.05 ? 'high' : 'medium',
    });
  }

  // Check rate limit hits
  if (metrics.rateLimitHits > 100) {
    alerts.push({
      type: 'high_rate_limit_hits',
      message: `High number of rate limit hits: ${metrics.rateLimitHits}`,
      severity: 'medium',
    });
  }

  return alerts;
}

export { logger };
