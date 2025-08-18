/**
 * SSE Events Proxy Route
 * 
 * Proxies SSE requests to the API server with proper cookie forwarding
 */

import { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4003';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const locationId = searchParams.get('locationId');

    if (!orgId) {
      return new Response(
        JSON.stringify({ error: 'MISSING_ORG_ID', message: 'orgId query parameter is required' }),
        { 
          status: 422,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Build API URL
    const apiUrl = new URL('/v1/events', API_BASE_URL);
    apiUrl.searchParams.set('orgId', orgId);
    if (locationId) {
      apiUrl.searchParams.set('locationId', locationId);
    }

    // Forward cookies from the request
    const cookies = request.headers.get('cookie') || '';

    // Create SSE request to API
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SSE Proxy] API error:', response.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'API_ERROR', 
          message: 'Failed to connect to event stream',
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Return SSE stream with proper headers
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error) {
    console.error('[SSE Proxy] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'PROXY_ERROR', 
        message: 'Failed to proxy event stream' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
