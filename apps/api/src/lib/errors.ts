/**
 * Standard Error Handling for Vigor API
 * 
 * Provides consistent error types and formatting across all endpoints
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, AppError);
  }
}

/**
 * Common error factory functions
 */

export function badRequest(message: string, code: string = 'BAD_REQUEST', details?: any): AppError {
  return new AppError(code, message, 400, details);
}

export function unauthorized(message: string = 'Authentication required', code: string = 'UNAUTHORIZED'): AppError {
  return new AppError(code, message, 401);
}

export function forbidden(message: string = 'Access denied', code: string = 'FORBIDDEN'): AppError {
  return new AppError(code, message, 403);
}

export function notFound(message: string = 'Resource not found', code: string = 'NOT_FOUND'): AppError {
  return new AppError(code, message, 404);
}

export function conflict(message: string, code: string = 'CONFLICT', details?: any): AppError {
  return new AppError(code, message, 409, details);
}

export function unprocessableEntity(message: string, code: string = 'VALIDATION_ERROR', details?: any): AppError {
  return new AppError(code, message, 422, details);
}

export function invalidRange(message: string = 'Invalid date range', details?: any): AppError {
  return new AppError('INVALID_RANGE', message, 422, details);
}

export function invalidOrgId(message: string = 'Invalid organization ID'): AppError {
  return new AppError('INVALID_ORG_ID', message, 422);
}

export function invalidLocationId(message: string = 'Invalid location ID'): AppError {
  return new AppError('INVALID_LOCATION_ID', message, 422);
}

export function serverError(message: string = 'Internal server error', code: string = 'INTERNAL_ERROR', details?: any): AppError {
  return new AppError(code, message, 500, details, false);
}

export function databaseError(message: string = 'Database operation failed', details?: any): AppError {
  return new AppError('DATABASE_ERROR', message, 500, details, false);
}

export function externalServiceError(service: string, message?: string): AppError {
  return new AppError(
    'EXTERNAL_SERVICE_ERROR',
    message || `External service ${service} is unavailable`,
    502,
    { service }
  );
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp?: string;
  path?: string;
  requestId?: string;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(
  error: AppError | Error,
  path?: string,
  requestId?: string
): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
      timestamp: new Date().toISOString(),
      ...(path && { path }),
      ...(requestId && { requestId }),
    };
  }

  // Handle unknown errors
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    timestamp: new Date().toISOString(),
    ...(path && { path }),
    ...(requestId && { requestId }),
  };
}

/**
 * Check if error is operational (expected) vs programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Common validation error patterns
 */
export const ValidationErrors = {
  REQUIRED_FIELD: (field: string) => badRequest(`${field} is required`, 'REQUIRED_FIELD', { field }),
  INVALID_FORMAT: (field: string, format: string) => badRequest(`${field} must be a valid ${format}`, 'INVALID_FORMAT', { field, format }),
  OUT_OF_RANGE: (field: string, min?: number, max?: number) => badRequest(
    `${field} is out of range${min !== undefined ? ` (min: ${min})` : ''}${max !== undefined ? ` (max: ${max})` : ''}`,
    'OUT_OF_RANGE',
    { field, min, max }
  ),
  INVALID_ENUM: (field: string, allowedValues: string[]) => badRequest(
    `${field} must be one of: ${allowedValues.join(', ')}`,
    'INVALID_ENUM',
    { field, allowedValues }
  ),
} as const;

/**
 * Database error patterns
 */
export const DatabaseErrors = {
  UNIQUE_CONSTRAINT: (field: string) => conflict(`${field} already exists`, 'DUPLICATE_ENTRY', { field }),
  FOREIGN_KEY_CONSTRAINT: (field: string) => badRequest(`Referenced ${field} does not exist`, 'INVALID_REFERENCE', { field }),
  NOT_NULL_CONSTRAINT: (field: string) => badRequest(`${field} cannot be null`, 'REQUIRED_FIELD', { field }),
} as const;

/**
 * Authentication and authorization errors
 */
export const AuthErrors = {
  INVALID_TOKEN: () => unauthorized('Invalid or expired token', 'INVALID_TOKEN'),
  MISSING_TOKEN: () => unauthorized('Authentication token required', 'MISSING_TOKEN'),
  INSUFFICIENT_PERMISSIONS: (required: string[]) => forbidden(
    `Insufficient permissions. Required: ${required.join(', ')}`,
    'INSUFFICIENT_PERMISSIONS',
    { required }
  ),
  TENANT_MISMATCH: () => forbidden('Access denied for this organization', 'TENANT_MISMATCH'),
} as const;
