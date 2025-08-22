/**
 * Revenue Trends Direct Route
 *
 * Direct connection to Supabase for revenue analytics data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithDevBypass, createSessionHeaders } from '../../../../lib/auth/session.server';
import { getRevenueAnalytics } from '../../../../lib/dashboard/supabase-data-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get session with development bypass support
    const sessionContext = await getSessionWithDevBypass();
    if (!sessionContext) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const locationId = searchParams.get('locationId') || undefined;

    console.debug('[REVENUE-DIRECT] Fetching revenue analytics:', {
      period,
      locationId,
      companyId: sessionContext.tenant.companyId,
    });

    // Use company ID from session context
    const companyId = sessionContext.tenant.companyId;

    // Fetch revenue analytics directly from Supabase
    const analytics = await getRevenueAnalytics(companyId, period, locationId);

    console.debug('[REVENUE-DIRECT] Revenue analytics fetched successfully');

    const sessionHeaders = createSessionHeaders(sessionContext);
    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Revenue-Direct': 'true',
        ...sessionHeaders,
      },
    });
  } catch (error) {
    console.error('[REVENUE-DIRECT] Error:', error);

    return NextResponse.json(
      {
        error: 'DIRECT_ERROR',
        message: 'Failed to fetch revenue trends data',
      },
      { status: 500 }
    );
  }
}
