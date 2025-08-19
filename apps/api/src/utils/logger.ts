import pino from 'pino';

// PII fields that should be masked in logs
const PII_FIELDS = [
  'email',
  'firstName',
  'lastName',
  'phone',
  'address',
  'card_last4',
  'payment_method',
  'stripe_customer_id',
  'password',
  'passwordHash',
  'token',
  'jwt',
  'authorization',
  'cookie',
];

/**
 * Recursively mask PII fields in an object
 */
function maskPII(obj: any, depth = 0): any {
  if (depth > 10) return '[MAX_DEPTH]'; // Prevent infinite recursion

  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Check if this looks like an email
    if (obj.includes('@') && obj.includes('.')) {
      const [local, domain] = obj.split('@');
      return `${local.substring(0, 2)}***@${domain}`;
    }
    return obj;
  }

  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => maskPII(item, depth + 1));
  }

  const masked: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    if (PII_FIELDS.some(field => lowerKey.includes(field))) {
      if (typeof value === 'string') {
        if (value.length <= 4) {
          masked[key] = '***';
        } else {
          masked[key] = `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
        }
      } else {
        masked[key] = '[MASKED]';
      }
    } else {
      masked[key] = maskPII(value, depth + 1);
    }
  }

  return masked;
}

/**
 * Create logger configuration based on environment
 */
function createLoggerConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

  const baseConfig = {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => ({ level: label }),
    },
    serializers: {
      req: (req: any) => ({
        method: req.method,
        url: req.url,
        headers: maskPII(req.headers),
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
        headers: maskPII(res.headers),
      }),
      err: pino.stdSerializers.err,
    },
  };

  if (isDevelopment) {
    return {
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    };
  }

  return baseConfig;
}

// Create the main logger instance
export const logger = pino(createLoggerConfig());

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: Record<string, any>) {
  return logger.child(maskPII(context));
}

/**
 * Log request timing and metrics
 */
export function logRequestMetrics(data: {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  tenantId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
}) {
  const maskedData = maskPII(data);

  if (data.statusCode >= 500) {
    logger.error(maskedData, 'Request completed with server error');
  } else if (data.statusCode >= 400) {
    logger.warn(maskedData, 'Request completed with client error');
  } else {
    logger.info(maskedData, 'Request completed successfully');
  }
}

/**
 * Log authentication events
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'register' | 'token_refresh' | 'auth_failure',
  data: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    reason?: string;
    requestId?: string;
  }
) {
  const maskedData = maskPII(data);

  if (event === 'auth_failure') {
    logger.warn({ ...maskedData, event }, 'Authentication failed');
  } else {
    logger.info({ ...maskedData, event }, `Authentication event: ${event}`);
  }
}

/**
 * Log billing events
 */
export function logBillingEvent(
  event: 'payment_success' | 'payment_failure' | 'subscription_created' | 'webhook_received',
  data: {
    companyId?: string;
    amount?: number;
    currency?: string;
    provider?: string;
    eventId?: string;
    reason?: string;
    requestId?: string;
  }
) {
  const maskedData = maskPII(data);

  if (event === 'payment_failure') {
    logger.error({ ...maskedData, event }, 'Payment failed');
  } else {
    logger.info({ ...maskedData, event }, `Billing event: ${event}`);
  }
}

/**
 * Log tenant actions for audit trail
 */
export function logTenantAction(
  action: string,
  data: {
    userId?: string;
    tenantId?: string;
    resourceType?: string;
    resourceId?: string;
    changes?: Record<string, any>;
    requestId?: string;
  }
) {
  const maskedData = maskPII(data);
  logger.info({ ...maskedData, action }, `Tenant action: ${action}`);
}

/**
 * Log performance metrics
 */
export function logPerformanceMetric(
  metric: string,
  value: number,
  unit: string,
  context?: Record<string, any>
) {
  const maskedContext = context ? maskPII(context) : {};
  logger.info({ metric, value, unit, ...maskedContext }, `Performance metric: ${metric}`);
}

/**
 * Log security events
 */
export function logSecurityEvent(
  event: 'rate_limit_exceeded' | 'invalid_token' | 'unauthorized_access' | 'suspicious_activity',
  data: {
    ip?: string;
    userAgent?: string;
    userId?: string;
    path?: string;
    reason?: string;
    requestId?: string;
  }
) {
  const maskedData = maskPII(data);
  logger.warn({ ...maskedData, event }, `Security event: ${event}`);
}

export default logger;
