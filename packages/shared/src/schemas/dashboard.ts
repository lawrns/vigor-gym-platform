import { z } from 'zod';
import type { RevenueAnalytics as DomainRevenueAnalytics } from '../types/domain.js';

/**
 * Dashboard Summary Schema
 * Represents the main dashboard metrics and KPIs
 */
export const DashboardSummarySchema = z.object({
  // Active visits and capacity
  activeVisits: z.number().int().min(0),
  capacityLimit: z.number().int().min(1),
  utilizationPercent: z.number().min(0).max(100),

  // Expiring memberships by time period
  expiringCounts: z.object({
    '7d': z.number().int().min(0),
    '14d': z.number().int().min(0),
    '30d': z.number().int().min(0),
  }),

  // Revenue metrics
  revenue: z.object({
    total: z.number().min(0), // Total revenue in MXN
    mrr: z.number().min(0), // Monthly recurring revenue
    failedPayments: z.number().int().min(0),
    transactionCount: z.number().int().min(0),
  }),

  // Operational metrics
  classesToday: z.number().int().min(0),
  staffGaps: z.number().int().min(0),

  // Metadata
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
    days: z.number().int().min(1),
  }),
  locationId: z.string().nullable(),
});

/**
 * Revenue Analytics Schema
 * Uses the existing domain RevenueAnalytics interface with zod validation
 */
export const RevenueAnalyticsSchema = z.object({
  totalRevenue: z.number().min(0),
  currency: z.string().default('MXN'),

  period: z.object({
    start: z.union([z.string().datetime(), z.date()]),
    end: z.union([z.string().datetime(), z.date()]),
  }),

  dataPoints: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
      amount: z.number().min(0), // Using 'amount' to match domain interface
      currency: z.string(),
    })
  ),

  growth: z
    .object({
      percentage: z.number(),
      trend: z.enum(['up', 'down', 'stable']),
    })
    .optional(),
});

/**
 * Class Today Schema
 * Represents a single class scheduled for today
 */
export const ClassTodaySchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  starts_at: z.string().datetime(),
  capacity: z.number().int().min(1),
  booked: z.number().int().min(0),
  instructor: z.string().min(1),
  gym_name: z.string().min(1),
});

/**
 * Classes Today Schema
 * Array of classes scheduled for today
 */
export const ClassesTodaySchema = z.array(ClassTodaySchema);

/**
 * Staff Coverage Schema
 * Represents staff coverage information for a given period
 */
export const StaffCoverageSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  totalShifts: z.number().int().min(0),
  coveredShifts: z.number().int().min(0),
  uncoveredShifts: z.number().int().min(0),
  coveragePercent: z.number().min(0).max(100),
  gaps: z.array(
    z.object({
      timeSlot: z.string(), // e.g., "09:00-12:00"
      position: z.string(), // e.g., "Front Desk", "Trainer"
      priority: z.enum(['low', 'medium', 'high', 'critical']),
    })
  ),
  locationId: z.string().nullable(),
});

// Export inferred TypeScript types
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
export type RevenueAnalytics = DomainRevenueAnalytics; // Use existing domain type
export type ClassToday = z.infer<typeof ClassTodaySchema>;
export type ClassesToday = z.infer<typeof ClassesTodaySchema>;
export type StaffCoverage = z.infer<typeof StaffCoverageSchema>;

// Validation helpers
export const validateDashboardSummary = (data: unknown): DashboardSummary => {
  return DashboardSummarySchema.parse(data);
};

export const validateRevenueAnalytics = (data: unknown): RevenueAnalytics => {
  return RevenueAnalyticsSchema.parse(data);
};

export const validateClassesToday = (data: unknown): ClassesToday => {
  return ClassesTodaySchema.parse(data);
};

export const validateStaffCoverage = (data: unknown): StaffCoverage => {
  return StaffCoverageSchema.parse(data);
};

// Safe parsing helpers (returns success/error instead of throwing)
export const safeParseDashboardSummary = (data: unknown) => {
  return DashboardSummarySchema.safeParse(data);
};

export const safeParseRevenueAnalytics = (data: unknown) => {
  return RevenueAnalyticsSchema.safeParse(data);
};

export const safeParseClassesToday = (data: unknown) => {
  return ClassesTodaySchema.safeParse(data);
};

export const safeParseStaffCoverage = (data: unknown) => {
  return StaffCoverageSchema.safeParse(data);
};
