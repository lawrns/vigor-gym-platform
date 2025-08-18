/**
 * Dashboard Data Validation
 * 
 * Implements strict validation for orgId, locationId, and date ranges
 * with proper error handling as per plan requirements
 */

import { z } from 'zod';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Custom UUID validator
const uuidSchema = z.string().regex(UUID_REGEX, 'Must be a valid UUID');

// Date range validation schema
const dateRangeSchema = z.object({
  from: z.string().datetime('Invalid from date format'),
  to: z.string().datetime('Invalid to date format'),
}).refine((data) => {
  const fromDate = new Date(data.from);
  const toDate = new Date(data.to);
  return fromDate <= toDate;
}, {
  message: 'from date must be before or equal to to date',
  path: ['from'],
});

// Dashboard query parameters schema
export const dashboardQuerySchema = z.object({
  orgId: uuidSchema,
  locationId: uuidSchema.optional().nullable(),
  from: z.string().datetime('Invalid from date format').optional(),
  to: z.string().datetime('Invalid to date format').optional(),
  range: z.enum(['7d', '14d', '30d']).optional().default('7d'),
}).refine((data) => {
  // If both from and to are provided, validate the range
  if (data.from && data.to) {
    const fromDate = new Date(data.from);
    const toDate = new Date(data.to);
    const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Maximum range is 366 days (1 year + leap day)
    if (diffDays > 366) {
      return false;
    }
    
    // from must be before or equal to to
    if (fromDate > toDate) {
      return false;
    }
  }
  
  return true;
}, {
  message: 'Invalid date range: from must be <= to and range must be <= 366 days',
  path: ['from'],
});

// SSE subscription parameters schema
export const sseQuerySchema = z.object({
  orgId: uuidSchema,
  locationId: uuidSchema.optional().nullable(),
});

// Activity query parameters schema
export const activityQuerySchema = z.object({
  orgId: uuidSchema,
  locationId: uuidSchema.optional().nullable(),
  since: z.string().datetime('Invalid since date format').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('25'),
}).refine((data) => {
  const limit = parseInt(data.limit, 10);
  return limit >= 1 && limit <= 100;
}, {
  message: 'Limit must be between 1 and 100',
  path: ['limit'],
});

// Validation error types
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export class DashboardValidationError extends Error {
  public readonly code: string;
  public readonly field?: string;
  public readonly details?: any;

  constructor(code: string, message: string, field?: string, details?: any) {
    super(message);
    this.name = 'DashboardValidationError';
    this.code = code;
    this.field = field;
    this.details = details;
  }
}

/**
 * Validate dashboard query parameters
 */
export function validateDashboardQuery(query: any): {
  orgId: string;
  locationId?: string | null;
  from?: string;
  to?: string;
  range: '7d' | '14d' | '30d';
} {
  try {
    return dashboardQuerySchema.parse(query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      
      // Map specific error codes
      if (firstError.path.includes('orgId')) {
        throw new DashboardValidationError(
          'INVALID_ORG_ID',
          'orgId must be a valid UUID',
          'orgId',
          firstError
        );
      }
      
      if (firstError.path.includes('locationId')) {
        throw new DashboardValidationError(
          'INVALID_LOCATION_ID',
          'locationId must be a valid UUID',
          'locationId',
          firstError
        );
      }
      
      if (firstError.path.includes('from') || firstError.path.includes('to')) {
        throw new DashboardValidationError(
          'INVALID_RANGE',
          firstError.message,
          'dateRange',
          firstError
        );
      }
      
      throw new DashboardValidationError(
        'VALIDATION_ERROR',
        firstError.message,
        firstError.path.join('.'),
        firstError
      );
    }
    
    throw error;
  }
}

/**
 * Validate SSE subscription parameters
 */
export function validateSSEQuery(query: any): {
  orgId: string;
  locationId?: string | null;
} {
  try {
    return sseQuerySchema.parse(query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      
      if (firstError.path.includes('orgId')) {
        throw new DashboardValidationError(
          'INVALID_ORG_ID',
          'orgId must be a valid UUID',
          'orgId',
          firstError
        );
      }
      
      if (firstError.path.includes('locationId')) {
        throw new DashboardValidationError(
          'INVALID_LOCATION_ID',
          'locationId must be a valid UUID',
          'locationId',
          firstError
        );
      }
      
      throw new DashboardValidationError(
        'VALIDATION_ERROR',
        firstError.message,
        firstError.path.join('.'),
        firstError
      );
    }
    
    throw error;
  }
}

/**
 * Validate activity query parameters
 */
export function validateActivityQuery(query: any): {
  orgId: string;
  locationId?: string | null;
  since?: string;
  limit: string;
} {
  try {
    return activityQuerySchema.parse(query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      
      if (firstError.path.includes('orgId')) {
        throw new DashboardValidationError(
          'INVALID_ORG_ID',
          'orgId must be a valid UUID',
          'orgId',
          firstError
        );
      }
      
      if (firstError.path.includes('locationId')) {
        throw new DashboardValidationError(
          'INVALID_LOCATION_ID',
          'locationId must be a valid UUID',
          'locationId',
          firstError
        );
      }
      
      if (firstError.path.includes('since')) {
        throw new DashboardValidationError(
          'INVALID_SINCE',
          'since must be a valid ISO datetime',
          'since',
          firstError
        );
      }
      
      if (firstError.path.includes('limit')) {
        throw new DashboardValidationError(
          'INVALID_LIMIT',
          'limit must be a number between 1 and 100',
          'limit',
          firstError
        );
      }
      
      throw new DashboardValidationError(
        'VALIDATION_ERROR',
        firstError.message,
        firstError.path.join('.'),
        firstError
      );
    }
    
    throw error;
  }
}

/**
 * Validate tenant access to organization
 */
export function validateTenantAccess(userCompanyId: string, requestedOrgId: string): void {
  if (userCompanyId !== requestedOrgId) {
    throw new DashboardValidationError(
      'FORBIDDEN',
      'Access denied to organization data',
      'orgId'
    );
  }
}

/**
 * Generate date range from range parameter
 */
export function generateDateRange(range: '7d' | '14d' | '30d'): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  
  const days = parseInt(range.replace('d', ''), 10);
  from.setDate(from.getDate() - days);
  
  return { from, to };
}

/**
 * Validate and parse date range
 */
export function validateDateRange(from?: string, to?: string, range?: string): { from: Date; to: Date } {
  if (from && to) {
    // Use explicit dates
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new DashboardValidationError(
        'INVALID_RANGE',
        'Invalid date format',
        'dateRange'
      );
    }
    
    if (fromDate > toDate) {
      throw new DashboardValidationError(
        'INVALID_RANGE',
        'from date must be before or equal to to date',
        'dateRange'
      );
    }
    
    const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 366) {
      throw new DashboardValidationError(
        'INVALID_RANGE',
        'Date range cannot exceed 366 days',
        'dateRange'
      );
    }
    
    return { from: fromDate, to: toDate };
  }
  
  // Use range parameter
  const rangeValue = (range as '7d' | '14d' | '30d') || '7d';
  return generateDateRange(rangeValue);
}
