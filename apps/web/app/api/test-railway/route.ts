import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/test-railway
 *
 * Test Railway API connectivity and debug authentication issues
 */
export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vigor-gym-platform-production.up.railway.app';
    
    console.log('[test-railway] Testing Railway API at:', apiUrl);
    
    // Test health endpoint
    const healthResponse = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const healthData = await healthResponse.json();
    console.log('[test-railway] Health check result:', healthData);
    
    // Test auth login with test credentials
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@testgym.mx',
        password: 'TestPassword123!'
      }),
    });

    const loginText = await loginResponse.text();
    console.log('[test-railway] Login response status:', loginResponse.status);
    console.log('[test-railway] Login response body:', loginText);
    console.log('[test-railway] Login response headers:', Object.fromEntries(loginResponse.headers.entries()));

    let loginData;
    try {
      loginData = JSON.parse(loginText);
    } catch (e) {
      loginData = { error: 'Invalid JSON response', body: loginText };
    }

    // Test if we can access any other endpoints
    const companiesResponse = await fetch(`${apiUrl}/v1/companies`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const companiesText = await companiesResponse.text();
    let companiesData;
    try {
      companiesData = JSON.parse(companiesText);
    } catch (e) {
      companiesData = { error: 'Invalid JSON response', body: companiesText };
    }
    
    return NextResponse.json({
      apiUrl,
      health: {
        status: healthResponse.status,
        data: healthData
      },
      login: {
        status: loginResponse.status,
        data: loginData,
        headers: Object.fromEntries(loginResponse.headers.entries())
      },
      companies: {
        status: companiesResponse.status,
        data: companiesData
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
      },
      suggestions: loginResponse.status === 500 ? [
        'Database may not be seeded with test user',
        'Try calling /api/seed-railway to create test data',
        'Check Railway database connection',
        'Verify environment variables in Railway'
      ] : []
    });
    
  } catch (error) {
    console.error('[test-railway] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
