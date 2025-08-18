/**
 * Global Error Handler Middleware
 * 
 * Standardizes error responses across all API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse, isOperationalError } from '../lib/errors.js';
import { logger } from '../utils/auditLogger.js';

/**
 * Global error handling middleware
 * Must be registered after all routes
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Extract request context for logging
  const requestContext = {
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id,
    tenantId: (req as any).tenant?.companyId,
    requestId: (req as any).requestId,
  };

  // Determine if this is an operational error or a programming error
  const isOperational = isOperationalError(error);
  
  // Log the error appropriately
  if (isOperational) {
    // Operational errors are expected and logged at info/warn level
    logger.warn({
      ...requestContext,
      error: {
        name: error.name,
        message: error.message,
        code: error instanceof AppError ? error.code : 'UNKNOWN',
        statusCode: error instanceof AppError ? error.statusCode : 500,
      },
    }, 'Operational error occurred');
  } else {
    // Programming errors are unexpected and logged at error level with stack trace
    logger.error({
      ...requestContext,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error instanceof AppError ? error.code : 'INTERNAL_ERROR',
      },
    }, 'Programming error occurred');
  }

  // Determine status code
  let statusCode = 500;
  if (error instanceof AppError) {
    statusCode = error.statusCode;
  } else if (error.name === 'ValidationError') {
    statusCode = 422;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
  }

  // Format error response
  const errorResponse = formatErrorResponse(
    error,
    req.path,
    (req as any).requestId
  );

  // In production, don't expose internal error details
  if (process.env.NODE_ENV === 'production' && !isOperational) {
    errorResponse.error.message = 'An unexpected error occurred';
    delete errorResponse.error.details;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse = formatErrorResponse(
    new AppError('NOT_FOUND', `Route ${req.method} ${req.path} not found`, 404),
    req.path,
    (req as any).requestId
  );

  logger.warn({
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  }, 'Route not found');

  res.status(404).json(errorResponse);
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error handler
 */
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error handler for common validation libraries
 */
export function handleValidationError(error: any): AppError {
  if (error.name === 'ValidationError') {
    // Mongoose validation error
    const errors = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
    }));
    
    return new AppError(
      'VALIDATION_ERROR',
      'Validation failed',
      422,
      { errors }
    );
  }

  if (error.code === 'P2002') {
    // Prisma unique constraint error
    const field = error.meta?.target?.[0] || 'field';
    return new AppError(
      'DUPLICATE_ENTRY',
      `${field} already exists`,
      409,
      { field }
    );
  }

  if (error.code === 'P2025') {
    // Prisma record not found
    return new AppError(
      'NOT_FOUND',
      'Record not found',
      404
    );
  }

  if (error.code === 'P2003') {
    // Prisma foreign key constraint
    const field = error.meta?.field_name || 'reference';
    return new AppError(
      'INVALID_REFERENCE',
      `Referenced ${field} does not exist`,
      400,
      { field }
    );
  }

  // Return original error if not recognized
  return error;
}

/**
 * Rate limiting error handler
 */
export function handleRateLimitError(req: Request, res: Response): void {
  const errorResponse = formatErrorResponse(
    new AppError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429),
    req.path,
    (req as any).requestId
  );

  logger.warn({
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  }, 'Rate limit exceeded');

  res.status(429).json(errorResponse);
}
