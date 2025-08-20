/**
 * Classes Today Direct Route
 *
 * Direct connection to Supabase for today's class data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithDevBypass, createSessionHeaders } from '../../../../lib/auth/session.server';
import { getClassesToday } from '../../../../lib/dashboard/supabase-data-service';

export async function GET(request: NextRequest) {
  try {
    // Get session with development bypass support
    const sessionContext = await getSessionWithDevBypass();
    if (!sessionContext) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId') || undefined;

    console.debug("[CLASSES-DIRECT] Fetching today's classes:", {
      locationId,
      companyId: sessionContext.tenant.companyId,
    });

    // Use company ID from session context
    const companyId = sessionContext.tenant.companyId;

    // Fetch classes directly from Supabase
    const classes = await getClassesToday(companyId, locationId);

    console.debug('[CLASSES-DIRECT] Classes fetched successfully:', classes.length);

    const sessionHeaders = createSessionHeaders(sessionContext);
    return NextResponse.json(classes, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Classes-Direct': 'true',
        ...sessionHeaders,
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
