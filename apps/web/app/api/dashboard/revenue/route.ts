/**
 * Dashboard Revenue Analytics Proxy Route
 *
 * Proxies revenue analytics requests to the API with proper cookie forwarding and tenant context.
 */

import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth/session';
const API_ORIGIN = process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4003';

export async function GET(request: NextRequest) {
  try {
    // Check authentication server-side
    const session = await getServerSession();

    if (!session) {
      console.debug('[REVENUE-PROXY] No session found - returning 401');
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Build upstream URL with query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const range = searchParams.get('range');

    // Build query string for upstream API
    const upstreamParams = new URLSearchParams();
    if (range) upstreamParams.set('range', range);

    const upstreamUrl = `${API_ORIGIN}/v1/dashboard/analytics/revenue${
      upstreamParams.toString() ? `?${upstreamParams.toString()}` : ''
    }`;

    console.debug('[REVENUE-PROXY] Proxying to:', upstreamUrl);

    // Get cookies to forward
    const cookieStore = cookies();
    const cookieHeader = cookieStore.toString();

    // Get headers to forward
    const headersList = headers();
    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': headersList.get('user-agent') || 'Revenue-Proxy/1.0',
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

    // Make request to upstream API
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: forwardHeaders,
      cache: 'no-store',
    });

    // Get response body
    const responseBody = await upstreamResponse.text();

    // Forward response headers (excluding problematic ones)
    const responseHeaders = new Headers();
    upstreamResponse.headers.forEach((value, key) => {
      if (!['connection', 'transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Add cache control for revenue data
    responseHeaders.set('Cache-Control', 'no-store, must-revalidate');
    responseHeaders.set('X-Revenue-Proxy', 'true');

    console.debug('[REVENUE-PROXY] Response status:', upstreamResponse.status);

    return new NextResponse(responseBody, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[REVENUE-PROXY] Failed to proxy revenue request:', error);

    return NextResponse.json(
      {
        message: 'Failed to fetch revenue data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
