/**
 * Classes Today Direct Route
 *
 * Direct connection to Supabase for today's class data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth/session';
import { getClassesToday, getSampleCompanyId } from '../../../../lib/dashboard/supabase-data-service';

export async function GET(request: NextRequest) {
  try {
    // Skip authentication for development - TODO: Re-enable for production
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    // }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId') || undefined;

    console.debug('[CLASSES-DIRECT] Fetching today\'s classes:', { locationId });

    // Get company ID (for development, use sample company)
    const companyId = await getSampleCompanyId();

    // Fetch classes directly from Supabase
    const classes = await getClassesToday(companyId, locationId);

    console.debug('[CLASSES-DIRECT] Classes fetched successfully:', classes.length);

    return NextResponse.json(classes, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Classes-Direct': 'true',
      },
    });
  } catch (error) {
    console.error('[CLASSES-DIRECT] Error:', error);

    return NextResponse.json(
      {
        error: 'DIRECT_ERROR',
        message: 'Failed to fetch classes data',
      },
      { status: 500 }
    );
  }
}
