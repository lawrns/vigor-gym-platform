import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    // Build query parameters
    const params = new URLSearchParams({
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
      limit: '10', // Last 10 visits
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
    const visits =
      data.visits?.map((visit: any) => ({
        id: visit.id,
        memberName:
          `${visit.membership?.member?.firstName || ''} ${visit.membership?.member?.lastName || ''}`.trim(),
        gymName: visit.gym?.name || '',
        timestamp: visit.checkIn,
        type: 'checkin',
        durationMinutes: visit.checkOut
          ? Math.floor(
              (new Date(visit.checkOut).getTime() - new Date(visit.checkIn).getTime()) / (1000 * 60)
            )
          : null,
      })) || [];

    return NextResponse.json({
      count: data.total || visits.length,
      visits,
    });
  } catch (error) {
    console.error('Today visits proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
