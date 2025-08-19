/**
 * Revenue Trends Direct Route
 *
 * Direct connection to Supabase for revenue analytics data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth/session';
import { getRevenueAnalytics, getSampleCompanyId } from '../../../../lib/dashboard/supabase-data-service';

export async function GET(request: NextRequest) {
  try {
    // Skip authentication for development - TODO: Re-enable for production
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    // }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const locationId = searchParams.get('locationId') || undefined;

    console.debug('[REVENUE-DIRECT] Fetching revenue analytics:', { period, locationId });

    // Get company ID (for development, use sample company)
    const companyId = await getSampleCompanyId();

    // Fetch revenue analytics directly from Supabase
    const analytics = await getRevenueAnalytics(companyId, period, locationId);

    console.debug('[REVENUE-DIRECT] Revenue analytics fetched successfully');

    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Revenue-Direct': 'true',
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
