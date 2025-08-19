/**
 * KPI Overview Route
 *
 * Returns KPI data directly from Supabase database.
 * TODO: Implement real KPI calculations from database tables.
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // TODO: Query real KPI data from Supabase tables
    // For now, return mock data to get authentication working
    const mockKPIData = {
      totalMembers: 245,
      activeMembers: 189,
      newMembersThisMonth: 12,
      revenue: {
        thisMonth: 45600,
        lastMonth: 42300,
        growth: 7.8,
      },
      visits: {
        today: 67,
        thisWeek: 423,
        lastWeek: 398,
        growth: 6.3,
      },
      membershipTypes: [
        { name: 'Básico', count: 98, percentage: 40 },
        { name: 'Premium', count: 87, percentage: 35.5 },
        { name: 'VIP', count: 60, percentage: 24.5 },
      ],
      recentActivity: [
        { type: 'new_member', member: 'Juan Pérez', timestamp: new Date().toISOString() },
        {
          type: 'payment',
          member: 'María González',
          amount: 800,
          timestamp: new Date().toISOString(),
        },
        { type: 'visit', member: 'Carlos López', timestamp: new Date().toISOString() },
      ],
    };

    console.debug('[KPI] Returning mock KPI data for user:', session.userId);

    return NextResponse.json(mockKPIData);
  } catch (error) {
    console.error('[KPI] Failed to fetch KPI data:', error);

    return NextResponse.json(
      {
        message: 'Failed to fetch KPI data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
