/**
 * Staff Coverage Proxy Route
 *
 * Proxies staff coverage requests to Railway API with proper JWT authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_ORIGIN = process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_URL || 'https://vigor-gym-platform-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies (prefer accessToken) or headers
    const authHeader = request.headers.get('authorization');
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    // Soft fallback for legacy cookie name during transition
    const legacyToken = !accessToken ? cookieStore.get('auth-token')?.value : '';
    const token = accessToken || legacyToken;

    if (!authHeader && !token) {
      console.debug('[STAFF-COVERAGE-PROXY] No auth token found - returning 401');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const locationId = searchParams.get('locationId');

    // Build upstream URL with query parameters
    const upstreamParams = new URLSearchParams();
    if (date) upstreamParams.set('date', date);
    if (locationId) upstreamParams.set('locationId', locationId);
    const queryString = upstreamParams.toString();

    const upstreamUrl = `${API_ORIGIN}/v1/staff-coverage/coverage${queryString ? `?${queryString}` : ''}`;

    console.debug('[STAFF-COVERAGE-PROXY] Proxying to:', upstreamUrl);

    // Prepare headers for Railway API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make request to Railway API
    const response = await fetch(upstreamUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.warn('[STAFF-COVERAGE-PROXY] Railway API returned:', response.status);
      const errorData = await response.json().catch(() => ({ error: 'Staff coverage failed' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.debug('[STAFF-COVERAGE-PROXY] Staff coverage fetched successfully');

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Staff-Coverage-Proxy': 'true',
      },
    });
  } catch (error) {
    console.error('[STAFF-COVERAGE-PROXY] Failed to fetch staff coverage:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch staff coverage data',
      },
      { status: 500 }
    );
  }
}
