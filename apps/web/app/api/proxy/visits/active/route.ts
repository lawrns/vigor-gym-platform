import { NextRequest, NextResponse } from 'next/server';
const API_ORIGIN = process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies or headers
    const authHeader =
      request.headers.get('authorization') ||
      request.headers.get('cookie')?.match(/auth-token=([^;]+)/)?.[1];

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader.startsWith('Bearer ')) {
      headers['Authorization'] = authHeader;
    } else {
      headers['Authorization'] = `Bearer ${authHeader}`;
    }

    // Build query for active visits (no checkout time)
    const params = new URLSearchParams({
      active: 'true', // Only visits without checkout
      limit: '100', // Reasonable limit for active visits
    });

    const response = await fetch(`${API_ORIGIN}/v1/visits?${params}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();

    // Transform the data for the frontend
    const activeVisits = data.visits?.filter((visit: any) => !visit.checkOut) || [];

    return NextResponse.json({
      count: activeVisits.length,
      visits: activeVisits.map((visit: any) => ({
        id: visit.id,
        memberName:
          `${visit.membership?.member?.firstName || ''} ${visit.membership?.member?.lastName || ''}`.trim(),
        gymName: visit.gym?.name || '',
        checkInTime: visit.checkIn,
        duration: visit.checkOut
          ? Math.floor(
              (new Date(visit.checkOut).getTime() - new Date(visit.checkIn).getTime()) / (1000 * 60)
            )
          : Math.floor((new Date().getTime() - new Date(visit.checkIn).getTime()) / (1000 * 60)),
      })),
    });
  } catch (error) {
    console.error('Active visits proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
