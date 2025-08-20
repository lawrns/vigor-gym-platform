import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logRequestMetrics, createChildLogger } from '../utils/logger.js';

export interface TimedRequest extends Request {
  startTime?: number;
  requestId?: string;
  logger?: Record<string, unknown>; // Pino logger instance
}

/**
 * Middleware to track request timing and add correlation IDs
 */
export function requestTiming(req: TimedRequest, res: Response, next: NextFunction): void {
  // Add correlation ID
  req.requestId = randomUUID();
  res.setHeader('X-Request-ID', req.requestId);

  // Track start time
  req.startTime = Date.now();

  // Create child logger with request context
  req.logger = createChildLogger({
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
  });

  // Log request start
  req.logger.debug('Request started');

  // Override res.end to capture timing
  const originalEnd = res.end.bind(res);
  res.end = function (chunk?: unknown, encoding?: unknown, cb?: unknown) {
    const duration = req.startTime ? Date.now() - req.startTime : 0;

    // Extract user context if available
    const extendedReq = req as TimedRequest & {
      user?: { id: string };
      tenant?: { companyId: string };
    };
    const userId = extendedReq.user?.id;
    const tenantId = extendedReq.tenant?.companyId;

    // Log structured request metrics
    logRequestMetrics({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: duration,
      userId,
      tenantId,
      requestId: req.requestId,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
    });

    // Call original end with proper return
    return originalEnd(chunk, encoding, cb);
  };

  next();
}
