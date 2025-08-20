/**
 * Dashboard Summary Direct Route
 *
 * Direct connection to Supabase for real-time dashboard data.
 * Bypasses the API server for immediate access.
 * Updated to use direct Supabase connection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithDevBypass, createSessionHeaders } from '../../../../lib/auth/session.server';
import {
  getDashboardSummary,
  getSampleCompanyId,
} from '../../../../lib/dashboard/supabase-data-service';

export async function GET(request: NextRequest) {
  try {
    // Get session with development bypass support
    const sessionContext = await getSessionWithDevBypass();
    if (!sessionContext) {
      console.debug('[DASHBOARD-DIRECT] No session found - returning 401');
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const locationId = searchParams.get('locationId') || undefined;
    const range = searchParams.get('range') || '7d';

    console.debug('[DASHBOARD-DIRECT] Fetching dashboard summary:', {
      locationId,
      range,
      companyId: sessionContext.tenant.companyId,
      userId: sessionContext.user.id,
    });

    // Use company ID from session context
    const companyId = sessionContext.tenant.companyId;

    // Fetch dashboard summary directly from Supabase
    const summary = await getDashboardSummary(companyId, locationId, range);

    console.debug('[DASHBOARD-DIRECT] Dashboard summary fetched successfully');

    // Return the summary with cache control and session headers
    const sessionHeaders = createSessionHeaders(sessionContext);
    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Dashboard-Direct': 'true',
        ...sessionHeaders,
      },
    });
  } catch (error) {
    console.error('[DASHBOARD-DIRECT] Failed to fetch dashboard summary:', error);

    return NextResponse.json(
      {
        message: 'Failed to fetch dashboard data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
