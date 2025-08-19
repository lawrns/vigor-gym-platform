/**
 * Supabase Dashboard Data Service
 * 
 * Direct connection to Supabase for real-time dashboard data.
 * Bypasses the API server for immediate data access.
 */

import { supabaseAdmin } from '../supabase/admin';

export interface DashboardSummary {
  activeVisits: number;
  capacityLimit: number;
  utilizationPercent: number;
  expiringCounts: {
    '7d': number;
    '14d': number;
    '30d': number;
  };
  revenue: {
    total: number;
    mrr: number;
    failedPayments: number;
    transactionCount: number;
  };
  classesToday: number;
  staffGaps: number;
  dateRange: {
    from: string;
    to: string;
    days: number;
  };
  locationId: string | null;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  currency: string;
  period: {
    start: string;
    end: string;
  };
  dataPoints: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
  growth?: {
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface ClassToday {
  id: string;
  title: string;
  starts_at: string;
  capacity: number;
  booked: number;
  instructor?: string;
  gym_name?: string;
}

export interface StaffShift {
  id: string;
  staff_id: string;
  staff_name: string;
  role: string;
  start_time: string;
  end_time: string;
  gym_name?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'visit' | 'member_update' | 'revenue_update' | 'system';
  data: Record<string, unknown>;
  timestamp: string;
  member_name?: string;
  action?: string;
}

/**
 * Get dashboard summary with real-time metrics
 */
export async function getDashboardSummary(
  companyId: string,
  locationId?: string,
  range: string = '7d'
): Promise<DashboardSummary> {
  // If using mock company ID, return mock data
  if (companyId === 'mock-company-id-dev') {
    return getMockDashboardSummary(range, locationId);
  }

  const days = range === '7d' ? 7 : range === '14d' ? 14 : 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  try {
    // Get active visits (checked in but not checked out)
    const { data: activeVisitsData } = await supabaseAdmin
      .from('visits')
      .select(`
        id,
        membership:memberships!inner(
          company_id
        )
      `)
      .eq('membership.company_id', companyId)
      .not('check_in', 'is', null)
      .is('check_out', null);

    const activeVisits = activeVisitsData?.length || 0;

    // Get gym capacity (assuming 50 per gym for now)
    const { data: gymsData } = await supabaseAdmin
      .from('gyms')
      .select('id');
    
    const totalCapacity = (gymsData?.length || 1) * 50;
    const utilizationPercent = Math.round((activeVisits / totalCapacity) * 100);

    // Get expiring memberships
    const today = new Date();
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in14Days = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data: expiring7d } = await supabaseAdmin
      .from('memberships')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'ACTIVE')
      .lte('ends_at', in7Days.toISOString());

    const { data: expiring14d } = await supabaseAdmin
      .from('memberships')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'ACTIVE')
      .lte('ends_at', in14Days.toISOString());

    const { data: expiring30d } = await supabaseAdmin
      .from('memberships')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'ACTIVE')
      .lte('ends_at', in30Days.toISOString());

    // Get revenue data (using payments table)
    const { data: revenueData } = await supabaseAdmin
      .from('payments')
      .select('paid_mxn_cents, created_at')
      .eq('status', 'COMPLETED')
      .gte('created_at', fromDate.toISOString());

    const totalRevenue = revenueData?.reduce((sum, payment) => sum + (payment.paid_mxn_cents || 0), 0) || 0;
    const transactionCount = revenueData?.length || 0;

    // Calculate MRR (simplified)
    const mrr = Math.round(totalRevenue / days * 30);

    // Get today's classes
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data: classesData } = await supabaseAdmin
      .from('classes')
      .select('id')
      .gte('starts_at', todayStart.toISOString())
      .lte('starts_at', todayEnd.toISOString());

    const classesToday = classesData?.length || 0;

    return {
      activeVisits,
      capacityLimit: totalCapacity,
      utilizationPercent,
      expiringCounts: {
        '7d': expiring7d?.length || 0,
        '14d': expiring14d?.length || 0,
        '30d': expiring30d?.length || 0,
      },
      revenue: {
        total: Math.round(totalRevenue / 100), // Convert cents to pesos
        mrr,
        failedPayments: 0, // TODO: Implement failed payments tracking
        transactionCount,
      },
      classesToday,
      staffGaps: 0, // TODO: Implement staff gap detection
      dateRange: {
        from: fromDate.toISOString(),
        to: new Date().toISOString(),
        days,
      },
      locationId: locationId || null,
    };
  } catch (error) {
    console.error('Dashboard summary error:', error);
    throw new Error('Failed to fetch dashboard summary');
  }
}

/**
 * Get revenue analytics with time series data
 */
export async function getRevenueAnalytics(
  companyId: string,
  period: string = '7d',
  locationId?: string
): Promise<RevenueAnalytics> {
  // If using mock company ID, return mock data
  if (companyId === 'mock-company-id-dev') {
    return getMockRevenueAnalytics(period);
  }

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  try {
    // Get daily revenue data
    const { data: paymentsData } = await supabaseAdmin
      .from('payments')
      .select('paid_mxn_cents, created_at')
      .eq('status', 'COMPLETED')
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: true });

    // Group by date
    const dailyRevenue = new Map<string, { revenue: number; transactions: number }>();
    
    paymentsData?.forEach(payment => {
      const date = payment.created_at.split('T')[0];
      const existing = dailyRevenue.get(date) || { revenue: 0, transactions: 0 };
      dailyRevenue.set(date, {
        revenue: existing.revenue + (payment.paid_mxn_cents || 0),
        transactions: existing.transactions + 1,
      });
    });

    const dataPoints = Array.from(dailyRevenue.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue / 100), // Convert cents to pesos
      transactions: data.transactions,
    }));

    const totalRevenue = dataPoints.reduce((sum, point) => sum + point.revenue, 0);

    // Calculate growth (simplified)
    const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
    const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));
    
    const firstHalfTotal = firstHalf.reduce((sum, point) => sum + point.revenue, 0);
    const secondHalfTotal = secondHalf.reduce((sum, point) => sum + point.revenue, 0);
    
    const growthPercentage = firstHalfTotal > 0 
      ? Math.round(((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100)
      : 0;

    return {
      totalRevenue,
      currency: 'MXN',
      period: {
        start: fromDate.toISOString(),
        end: new Date().toISOString(),
      },
      dataPoints,
      growth: {
        percentage: growthPercentage,
        trend: growthPercentage > 5 ? 'up' : growthPercentage < -5 ? 'down' : 'stable',
      },
    };
  } catch (error) {
    console.error('Revenue analytics error:', error);
    throw new Error('Failed to fetch revenue analytics');
  }
}

/**
 * Get today's class schedule
 */
export async function getClassesToday(
  companyId: string,
  locationId?: string
): Promise<ClassToday[]> {
  // If using mock company ID, return mock data
  if (companyId === 'mock-company-id-dev') {
    return getMockClassesToday();
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  try {
    const { data: classesData } = await supabaseAdmin
      .from('classes')
      .select(`
        id,
        title,
        starts_at,
        capacity,
        gym:gyms(name),
        bookings:bookings(id, status)
      `)
      .gte('starts_at', todayStart.toISOString())
      .lte('starts_at', todayEnd.toISOString())
      .order('starts_at', { ascending: true });

    return classesData?.map(cls => ({
      id: cls.id,
      title: cls.title,
      starts_at: cls.starts_at,
      capacity: cls.capacity,
      booked: cls.bookings?.filter(b => b.status === 'CONFIRMED').length || 0,
      instructor: 'TBD', // TODO: Add instructor relationship
      gym_name: cls.gym?.name || 'Unknown',
    })) || [];
  } catch (error) {
    console.error('Classes today error:', error);
    throw new Error('Failed to fetch today\'s classes');
  }
}

/**
 * Get staff coverage for a specific date
 */
export async function getStaffCoverage(
  companyId: string,
  date?: string,
  locationId?: string
): Promise<StaffShift[]> {
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const { data: shiftsData } = await supabaseAdmin
      .from('staff_shifts')
      .select(`
        id,
        staff_id,
        start_time,
        end_time,
        staff:staff(
          first_name,
          last_name,
          role,
          company_id
        ),
        gym:gyms(name)
      `)
      .eq('staff.company_id', companyId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .order('start_time', { ascending: true });

    return shiftsData?.map(shift => ({
      id: shift.id,
      staff_id: shift.staff_id,
      staff_name: `${shift.staff?.first_name || ''} ${shift.staff?.last_name || ''}`.trim(),
      role: shift.staff?.role || 'staff',
      start_time: shift.start_time,
      end_time: shift.end_time,
      gym_name: shift.gym?.name || 'Unknown',
    })) || [];
  } catch (error) {
    console.error('Staff coverage error:', error);
    throw new Error('Failed to fetch staff coverage');
  }
}

/**
 * Get recent activity events
 */
export async function getActivityEvents(
  companyId: string,
  since?: string,
  limit: number = 50,
  locationId?: string
): Promise<ActivityEvent[]> {
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    // Get recent visits (check-ins and check-outs)
    const { data: visitsData } = await supabaseAdmin
      .from('visits')
      .select(`
        id,
        check_in,
        check_out,
        membership:memberships!inner(
          company_id,
          member:members(
            first_name,
            last_name
          )
        ),
        gym:gyms(name)
      `)
      .eq('membership.company_id', companyId)
      .or(`check_in.gte.${sinceDate.toISOString()},check_out.gte.${sinceDate.toISOString()}`)
      .order('check_in', { ascending: false })
      .limit(limit);

    const events: ActivityEvent[] = [];

    visitsData?.forEach(visit => {
      const memberName = `${visit.membership?.member?.first_name || ''} ${visit.membership?.member?.last_name || ''}`.trim();

      if (visit.check_in && new Date(visit.check_in) >= sinceDate) {
        events.push({
          id: `${visit.id}-checkin`,
          type: 'visit',
          data: {
            action: 'check_in',
            gym_name: visit.gym?.name,
            member_name: memberName,
          },
          timestamp: visit.check_in,
          member_name: memberName,
          action: 'checked in',
        });
      }

      if (visit.check_out && new Date(visit.check_out) >= sinceDate) {
        events.push({
          id: `${visit.id}-checkout`,
          type: 'visit',
          data: {
            action: 'check_out',
            gym_name: visit.gym?.name,
            member_name: memberName,
          },
          timestamp: visit.check_out,
          member_name: memberName,
          action: 'checked out',
        });
      }
    });

    // Sort by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return events.slice(0, limit);
  } catch (error) {
    console.error('Activity events error:', error);
    throw new Error('Failed to fetch activity events');
  }
}

/**
 * Get a sample company ID for development
 */
export async function getSampleCompanyId(): Promise<string> {
  try {
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id')
      .limit(1);

    if (!companies || companies.length === 0) {
      // For development, return a mock company ID
      // In production, this should create a sample company or handle the case appropriately
      console.warn('No companies found in database, using mock company ID for development');
      return 'mock-company-id-dev';
    }

    return companies[0].id;
  } catch (error) {
    console.error('Get sample company error:', error);
    // Fallback to mock ID for development
    console.warn('Database error, using mock company ID for development');
    return 'mock-company-id-dev';
  }
}

/**
 * Get mock dashboard summary for development
 */
function getMockDashboardSummary(range: string = '7d', locationId?: string): DashboardSummary {
  const days = range === '7d' ? 7 : range === '14d' ? 14 : 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  return {
    activeVisits: 12,
    capacityLimit: 50,
    utilizationPercent: 24,
    expiringCounts: {
      '7d': 3,
      '14d': 8,
      '30d': 15,
    },
    revenue: {
      total: 45000, // 45,000 MXN
      mrr: 180000, // 180,000 MXN monthly recurring revenue
      failedPayments: 2,
      transactionCount: 23,
    },
    classesToday: 6,
    staffGaps: 1,
    dateRange: {
      from: fromDate.toISOString(),
      to: new Date().toISOString(),
      days,
    },
    locationId: locationId || null,
  };
}

/**
 * Get mock revenue analytics for development
 */
function getMockRevenueAnalytics(period: string = '7d'): RevenueAnalytics {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  // Generate mock daily data
  const dataPoints = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(fromDate);
    date.setDate(fromDate.getDate() + i);

    // Generate realistic revenue data with some variation
    const baseRevenue = 1500 + Math.random() * 1000; // 1500-2500 MXN per day
    const transactions = Math.floor(3 + Math.random() * 5); // 3-8 transactions per day

    dataPoints.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.round(baseRevenue),
      transactions,
    });
  }

  const totalRevenue = dataPoints.reduce((sum, point) => sum + point.revenue, 0);

  return {
    totalRevenue,
    currency: 'MXN',
    period: {
      start: fromDate.toISOString(),
      end: new Date().toISOString(),
    },
    dataPoints,
    growth: {
      percentage: 12, // Mock 12% growth
      trend: 'up',
    },
  };
}

/**
 * Get mock classes for today for development
 */
function getMockClassesToday(): ClassToday[] {
  const today = new Date();

  return [
    {
      id: 'mock-class-1',
      title: 'Morning Yoga',
      starts_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0).toISOString(),
      capacity: 20,
      booked: 15,
      instructor: 'Maria González',
      gym_name: 'Vigor Gym Centro',
    },
    {
      id: 'mock-class-2',
      title: 'HIIT Training',
      starts_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(),
      capacity: 15,
      booked: 12,
      instructor: 'Carlos Ruiz',
      gym_name: 'Vigor Gym Centro',
    },
    {
      id: 'mock-class-3',
      title: 'Spinning',
      starts_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0).toISOString(),
      capacity: 25,
      booked: 20,
      instructor: 'Ana López',
      gym_name: 'Vigor Gym Centro',
    },
    {
      id: 'mock-class-4',
      title: 'Pilates',
      starts_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 30).toISOString(),
      capacity: 12,
      booked: 8,
      instructor: 'Sofia Martínez',
      gym_name: 'Vigor Gym Centro',
    },
  ];
}
