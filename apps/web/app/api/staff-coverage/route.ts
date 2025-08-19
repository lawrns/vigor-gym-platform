/**
 * Staff Coverage Direct Route
 *
 * Direct connection to Supabase for staff coverage data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../lib/auth/session';
import { getStaffCoverage, getSampleCompanyId } from '../../../lib/dashboard/supabase-data-service';

export async function GET(request: NextRequest) {
  try {
    // Skip authentication for development - TODO: Re-enable for production
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    // }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const locationId = searchParams.get('locationId') || undefined;

    console.debug('[STAFF-COVERAGE-DIRECT] Fetching staff coverage:', { date, locationId });

    // Get company ID (for development, use sample company)
    const companyId = await getSampleCompanyId();

    // Fetch staff coverage directly from Supabase
    const shifts = await getStaffCoverage(companyId, date, locationId);

    console.debug('[STAFF-COVERAGE-DIRECT] Staff coverage fetched successfully:', shifts.length);

    return NextResponse.json({
      shifts,
      gaps: [], // TODO: Implement gap detection
      summary: {
        totalShifts: shifts.length,
        coveredHours: shifts.length * 8, // Simplified
        gapHours: 0,
      },
      date: date || new Date().toISOString().split('T')[0],
      locationId: locationId || null,
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Staff-Coverage-Direct': 'true',
      },
    });
  } catch (error) {
    console.error('[STAFF-COVERAGE-DIRECT] Error:', error);

    return NextResponse.json(
      {
        error: 'DIRECT_ERROR',
        message: 'Failed to fetch staff coverage data',
      },
      { status: 500 }
    );
  }
}
