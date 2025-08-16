import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface TimedRequest extends Request {
  startTime?: number;
  requestId?: string;
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

  // Log request start
  console.log(`[${req.requestId}] ${req.method} ${req.path} - Started`);

  // Override res.end to capture timing
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = req.startTime ? Date.now() - req.startTime : 0;

    // Log request completion
    console.log(`[${req.requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);

    // Call original end with proper return
    return originalEnd(chunk, encoding, cb);
  };

  next();
}
