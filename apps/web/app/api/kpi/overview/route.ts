/**
 * KPI Overview Proxy Route
 * 
 * Proxies KPI requests to the API with proper cookie forwarding and tenant context.
 * This ensures browser requests include authentication and tenant information.
 */

import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth/session';
import { MAX_DAYS } from '../../../../lib/constants/kpi';

const API_ORIGIN = process.env.API_ORIGIN || 'http://localhost:4001';

export async function GET(request: NextRequest) {
  try {
    // Check authentication server-side
    const session = await getServerSession();

    if (!session) {
      console.debug('[KPI-PROXY] No session found - returning 401');
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Build upstream URL with query parameters
    const url = new URL(request.url);

    // Validate date parameters
    const searchParams = url.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const compareFrom = searchParams.get('compareFrom');
    const compareTo = searchParams.get('compareTo');

    // Validate date format and range
    if (from || to) {
      try {
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;

        // Check for invalid dates
        if ((fromDate && isNaN(fromDate.getTime())) || (toDate && isNaN(toDate.getTime()))) {
          return NextResponse.json(
            { error: 'Invalid date format', code: 'INVALID_DATE_FORMAT' },
            { status: 422 }
          );
        }

        // Check if from > to
        if (fromDate && toDate && fromDate > toDate) {
          return NextResponse.json(
            { error: 'From date cannot be after to date', code: 'INVALID_RANGE' },
            { status: 422 }
          );
        }

        // Check if date range exceeds maximum allowed days
        if (fromDate && toDate) {
          const rangeDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
          if (rangeDays > MAX_DAYS) {
            return NextResponse.json(
              {
                error: `Date range cannot exceed ${MAX_DAYS} days`,
                code: 'INVALID_RANGE',
                maxDays: MAX_DAYS
              },
              { status: 422 }
            );
          }
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid date parameters', code: 'INVALID_DATE_FORMAT' },
          { status: 422 }
        );
      }
    }

    const upstreamUrl = `${API_ORIGIN}/v1/kpi/overview${url.search}`;

    // Get cookies from the request
    const cookieHeader = cookies().toString();

    // Prepare headers for upstream request
    const upstreamHeaders = new Headers();
    upstreamHeaders.set('Content-Type', 'application/json');

    // Forward cookies for authentication (only when authenticated)
    if (cookieHeader) {
      upstreamHeaders.set('Cookie', cookieHeader);
    }
    
    // Forward tenant ID if present (set by middleware/session)
    const tenantId = headers().get('x-tenant-id');
    if (tenantId) {
      upstreamHeaders.set('x-tenant-id', tenantId);
    }
    
    // Forward request ID for tracing
    const requestId = headers().get('x-request-id');
    if (requestId) {
      upstreamHeaders.set('x-request-id', requestId);
    }
    
    // Forward user agent
    const userAgent = headers().get('user-agent');
    if (userAgent) {
      upstreamHeaders.set('User-Agent', userAgent);
    }

    console.debug('[KPI-PROXY] Forwarding request to:', upstreamUrl);
    console.debug('[KPI-PROXY] Headers:', {
      hasCookies: !!cookieHeader,
      cookieLength: cookieHeader?.length || 0,
      tenantId: tenantId || 'none',
      requestId: requestId || 'none',
    });

    // Make request to upstream API
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: upstreamHeaders,
      cache: 'no-store', // Don't cache KPI data
    });

    // Get response body
    const responseBody = await upstreamResponse.text();

    // Prepare response headers
    const responseHeaders = new Headers();

    // Forward content type
    const contentType = upstreamResponse.headers.get('content-type');
    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    } else {
      responseHeaders.set('Content-Type', 'application/json');
    }

    // Add CORS headers if needed
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Forward request ID for tracing
    if (requestId) {
      responseHeaders.set('x-request-id', requestId);
    }

    console.debug('[KPI-PROXY] Response status:', upstreamResponse.status);

    // Log 401 responses for debugging (but don't treat as error)
    if (upstreamResponse.status === 401) {
      console.debug('[KPI-PROXY] Upstream returned 401 - auth issue or guest user');
      console.debug('[KPI-PROXY] Response body:', responseBody.substring(0, 200));
    }

    // Return response with same status and headers
    return new NextResponse(responseBody, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('[KPI-PROXY] Failed to proxy KPI request:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to fetch KPI data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
