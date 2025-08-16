/**
 * KPI Overview Proxy Route
 * 
 * Proxies KPI requests to the API with proper cookie forwarding and tenant context.
 * This ensures browser requests include authentication and tenant information.
 */

import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_ORIGIN = process.env.API_ORIGIN || 'http://localhost:4001';

export async function GET(request: NextRequest) {
  try {
    // Build upstream URL with query parameters
    const url = new URL(request.url);
    const upstreamUrl = `${API_ORIGIN}/v1/kpi/overview${url.search}`;
    
    // Get cookies from the request
    const cookieHeader = cookies().toString();
    
    // Prepare headers for upstream request
    const upstreamHeaders = new Headers();
    upstreamHeaders.set('Content-Type', 'application/json');
    
    // Forward cookies for authentication
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
