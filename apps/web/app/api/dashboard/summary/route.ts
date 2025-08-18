/**
 * Dashboard Summary Proxy Route
 * 
 * Proxies dashboard summary requests to the API with proper cookie forwarding and tenant context.
 * This ensures browser requests include authentication and tenant information.
 */

import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth/session';

const API_ORIGIN = process.env.API_ORIGIN || 'http://localhost:4003';

export async function GET(request: NextRequest) {
  try {
    // Check authentication server-side
    const session = await getServerSession();

    if (!session) {
      console.debug('[DASHBOARD-PROXY] No session found - returning 401');
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Build upstream URL with query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const locationId = searchParams.get('locationId');
    const range = searchParams.get('range');

    // Build query string for upstream API
    const upstreamParams = new URLSearchParams();
    if (locationId) upstreamParams.set('locationId', locationId);
    if (range) upstreamParams.set('range', range);

    const upstreamUrl = `${API_ORIGIN}/v1/dashboard/summary${
      upstreamParams.toString() ? `?${upstreamParams.toString()}` : ''
    }`;

    console.debug('[DASHBOARD-PROXY] Proxying to:', upstreamUrl);

    // Get cookies to forward
    const cookieStore = cookies();
    const cookieHeader = cookieStore.toString();

    // Get headers to forward
    const headersList = headers();
    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': headersList.get('user-agent') || 'Dashboard-Proxy/1.0',
    };

    // Forward authentication cookies
    if (cookieHeader) {
      forwardHeaders['Cookie'] = cookieHeader;
    }

    // Forward tenant context if available
    const orgId = headersList.get('x-org-id');
    if (orgId) {
      forwardHeaders['X-Org-Id'] = orgId;
    }

    console.debug('[DASHBOARD-PROXY] Request headers:', {
      hasCookies: !!cookieHeader,
      hasOrgId: !!orgId,
      userAgent: forwardHeaders['User-Agent'],
    });

    // Make request to upstream API
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: forwardHeaders,
      // Don't cache dashboard data - it should be real-time
      cache: 'no-store',
    });

    // Get response body
    const responseBody = await upstreamResponse.text();

    // Forward response headers (excluding problematic ones)
    const responseHeaders = new Headers();
    upstreamResponse.headers.forEach((value, key) => {
      // Skip headers that might cause issues in browser
      if (!['connection', 'transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Add cache control for dashboard data
    responseHeaders.set('Cache-Control', 'no-store, must-revalidate');
    responseHeaders.set('X-Dashboard-Proxy', 'true');

    console.debug('[DASHBOARD-PROXY] Response status:', upstreamResponse.status);

    // Log 401 responses for debugging (but don't treat as error)
    if (upstreamResponse.status === 401) {
      console.debug('[DASHBOARD-PROXY] Upstream returned 401 - auth issue');
      console.debug('[DASHBOARD-PROXY] Response body:', responseBody.substring(0, 200));
    }

    // Return response with same status and headers
    return new NextResponse(responseBody, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('[DASHBOARD-PROXY] Failed to proxy dashboard request:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to fetch dashboard data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
