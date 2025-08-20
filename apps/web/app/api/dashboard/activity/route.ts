/**
 * Dashboard Activity Direct Route
 *
 * Direct connection to Supabase for activity feed data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth/session';
import {
  getActivityEvents,
  getSampleCompanyId,
} from '../../../../lib/dashboard/supabase-data-service';

export async function GET(request: NextRequest) {
  try {
    // Skip authentication for development - TODO: Re-enable for production
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    // }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const locationId = searchParams.get('locationId') || undefined;

    console.debug('[ACTIVITY-DIRECT] Fetching activity events:', { since, limit, locationId });

    // Get company ID (for development, use sample company)
    const companyId = await getSampleCompanyId();

    // Fetch activity events directly from Supabase
    const events = await getActivityEvents(companyId, since, limit, locationId);

    console.debug('[ACTIVITY-DIRECT] Activity events fetched successfully:', events.length);

    return NextResponse.json(events, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Activity-Direct': 'true',
      },
    });
  } catch (error) {
    console.error('[ACTIVITY-DIRECT] Error:', error);

    return NextResponse.json(
      {
        error: 'DIRECT_ERROR',
        message: 'Failed to fetch activity events',
      },
      { status: 500 }
    );
  }
}
