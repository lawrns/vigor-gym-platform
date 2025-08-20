import type {
  DashboardSummary,
  RevenueAnalytics,
  ClassesToday,
  StaffCoverage,
} from '../schemas/dashboard.js';

/**
 * Supabase Database Row Types
 * These represent the raw shapes from Supabase queries
 */

// Raw company/gym data from Supabase
export interface SupabaseCompany {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Raw visit data from Supabase
export interface SupabaseVisit {
  id: string;
  member_id: string;
  gym_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  created_at: string;
}

// Raw membership data from Supabase
export interface SupabaseMembership {
  id: string;
  member_id: string;
  plan_id: string;
  status: string;
  starts_at: string;
  expires_at: string;
  created_at: string;
}

// Raw payment data from Supabase
export interface SupabasePayment {
  id: string;
  membership_id: string;
  amount: number;
  currency: string;
  status: string;
  processed_at: string;
  created_at: string;
}

// Raw class data from Supabase
export interface SupabaseClass {
  id: string;
  title: string;
  instructor_name: string;
  starts_at: string;
  capacity: number;
  gym_id: string;
  gym_name: string;
  created_at: string;
}

// Raw class booking data from Supabase
export interface SupabaseClassBooking {
  id: string;
  class_id: string;
  member_id: string;
  status: string;
  created_at: string;
}

// Raw staff shift data from Supabase
export interface SupabaseStaffShift {
  id: string;
  staff_id: string;
  gym_id: string;
  position: string;
  starts_at: string;
  ends_at: string;
  status: string;
  created_at: string;
}

/**
 * Adapter Functions
 * Convert Supabase raw data to typed DTOs
 */

export function adaptDashboardSummary(
  visits: SupabaseVisit[],
  memberships: SupabaseMembership[],
  payments: SupabasePayment[],
  classes: SupabaseClass[],
  staffShifts: SupabaseStaffShift[],
  options: {
    capacityLimit: number;
    dateRange: { from: string; to: string; days: number };
    locationId?: string;
  }
): DashboardSummary {
  // Calculate active visits (checked in but not checked out)
  const activeVisits = visits.filter(visit => !visit.checked_out_at).length;

  // Calculate utilization
  const utilizationPercent = Math.round((activeVisits / options.capacityLimit) * 100);

  // Calculate expiring memberships
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringCounts = {
    '7d': memberships.filter(m => {
      const expiresAt = new Date(m.expires_at);
      return expiresAt <= in7Days && expiresAt > now;
    }).length,
    '14d': memberships.filter(m => {
      const expiresAt = new Date(m.expires_at);
      return expiresAt <= in14Days && expiresAt > now;
    }).length,
    '30d': memberships.filter(m => {
      const expiresAt = new Date(m.expires_at);
      return expiresAt <= in30Days && expiresAt > now;
    }).length,
  };

  // Calculate revenue metrics
  const successfulPayments = payments.filter(p => p.status === 'completed');
  const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
  const failedPayments = payments.filter(p => p.status === 'failed').length;
  const transactionCount = payments.length;

  // Estimate MRR (simplified calculation)
  const mrr = totalRevenue * (30 / options.dateRange.days);

  // Calculate classes today
  const today = new Date().toISOString().split('T')[0];
  const classesToday = classes.filter(c => c.starts_at.startsWith(today)).length;

  // Calculate staff gaps (simplified)
  const uncoveredShifts = staffShifts.filter(s => s.status === 'uncovered').length;

  return {
    activeVisits,
    capacityLimit: options.capacityLimit,
    utilizationPercent,
    expiringCounts,
    revenue: {
      total: totalRevenue,
      mrr: Math.round(mrr),
      failedPayments,
      transactionCount,
    },
    classesToday,
    staffGaps: uncoveredShifts,
    dateRange: options.dateRange,
    locationId: options.locationId || null,
  };
}

export function adaptRevenueAnalytics(
  payments: SupabasePayment[],
  options: {
    period: { start: string; end: string };
    days: number;
  }
): RevenueAnalytics {
  // Group payments by date
  const paymentsByDate = new Map<string, { revenue: number; transactions: number }>();

  // Initialize all dates in range with zero values
  const startDate = new Date(options.period.start);
  for (let i = 0; i < options.days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    paymentsByDate.set(dateStr, { revenue: 0, transactions: 0 });
  }

  // Aggregate successful payments by date
  const successfulPayments = payments.filter(p => p.status === 'completed');
  successfulPayments.forEach(payment => {
    const date = payment.processed_at.split('T')[0];
    const existing = paymentsByDate.get(date);
    if (existing) {
      existing.revenue += payment.amount;
      existing.transactions += 1;
    }
  });

  // Convert to data points array (matching domain RevenuePoint interface)
  const dataPoints = Array.from(paymentsByDate.entries()).map(([date, data]) => ({
    date,
    amount: data.revenue, // Using 'amount' to match domain interface
    currency: 'MXN',
  }));

  // Calculate total revenue
  const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

  // Calculate growth (simplified - compare first half vs second half)
  const midPoint = Math.floor(dataPoints.length / 2);
  const firstHalf = dataPoints.slice(0, midPoint);
  const secondHalf = dataPoints.slice(midPoint);

  const firstHalfRevenue = firstHalf.reduce((sum, p) => sum + p.amount, 0);
  const secondHalfRevenue = secondHalf.reduce((sum, p) => sum + p.amount, 0);

  let growthPercentage = 0;
  let trend: 'up' | 'down' | 'stable' = 'stable';

  if (firstHalfRevenue > 0) {
    growthPercentage = ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100;
    if (growthPercentage > 5) trend = 'up';
    else if (growthPercentage < -5) trend = 'down';
  }

  return {
    totalRevenue,
    currency: 'MXN',
    period: options.period,
    dataPoints,
    growth: {
      percentage: Math.round(growthPercentage),
      trend,
    },
  };
}

export function adaptClassesToday(
  classes: SupabaseClass[],
  bookings: SupabaseClassBooking[]
): ClassesToday {
  const today = new Date().toISOString().split('T')[0];
  const todaysClasses = classes.filter(c => c.starts_at.startsWith(today));

  return todaysClasses.map(classItem => {
    const classBookings = bookings.filter(
      b => b.class_id === classItem.id && b.status === 'confirmed'
    );

    return {
      id: classItem.id,
      title: classItem.title,
      starts_at: classItem.starts_at,
      capacity: classItem.capacity,
      booked: classBookings.length,
      instructor: classItem.instructor_name,
      gym_name: classItem.gym_name,
    };
  });
}

export function adaptStaffCoverage(
  shifts: SupabaseStaffShift[],
  options: {
    date: string;
    locationId?: string;
  }
): StaffCoverage {
  const dateShifts = shifts.filter(s => s.starts_at.startsWith(options.date));

  const totalShifts = dateShifts.length;
  const coveredShifts = dateShifts.filter(s => s.status === 'covered').length;
  const uncoveredShifts = totalShifts - coveredShifts;
  const coveragePercent = totalShifts > 0 ? Math.round((coveredShifts / totalShifts) * 100) : 100;

  // Create gaps from uncovered shifts
  const gaps = dateShifts
    .filter(s => s.status === 'uncovered')
    .map(shift => {
      const startTime = new Date(shift.starts_at).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const endTime = new Date(shift.ends_at).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      return {
        timeSlot: `${startTime}-${endTime}`,
        position: shift.position,
        priority: 'medium' as const, // Could be calculated based on position/time
      };
    });

  return {
    date: options.date,
    totalShifts,
    coveredShifts,
    uncoveredShifts,
    coveragePercent,
    gaps,
    locationId: options.locationId || null,
  };
}
