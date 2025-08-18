/**
 * Staff Coverage Proxy Route
 * 
 * Proxies staff coverage requests to the API server
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4003';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build API URL with query parameters
    const apiUrl = new URL('/v1/staff-coverage/coverage', API_BASE_URL);
    
    // Forward all query parameters
    for (const [key, value] of searchParams.entries()) {
      apiUrl.searchParams.set(key, value);
    }

    // Forward cookies from the request
    const cookies = request.headers.get('cookie') || '';

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Staff Coverage Proxy] API error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          error: 'API_ERROR', 
          message: 'Failed to fetch staff coverage data',
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('[Staff Coverage Proxy] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'PROXY_ERROR', 
        message: 'Failed to proxy staff coverage request' 
      },
      { status: 500 }
    );
  }
}
