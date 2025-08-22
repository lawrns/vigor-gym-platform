import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/seed-railway
 *
 * Seed the Railway database with test data
 */
export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vigor-gym-platform-production.up.railway.app';
    
    console.log('[seed-railway] Seeding Railway database at:', apiUrl);
    
    // Try to register a test company and user
    const registerResponse = await fetch(`${apiUrl}/auth/register-company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Company info
        companyName: 'Vigor Demo Gym',
        rfc: 'DEMO010101XXX',
        billingEmail: 'admin@testgym.mx',
        timezone: 'America/Mexico_City',
        industry: 'Fitness & Wellness',
        
        // Owner user info
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@testgym.mx',
        password: 'TestPassword123!'
      }),
    });
    
    const registerText = await registerResponse.text();
    console.log('[seed-railway] Register response status:', registerResponse.status);
    console.log('[seed-railway] Register response body:', registerText);
    
    let registerData;
    try {
      registerData = JSON.parse(registerText);
    } catch (e) {
      registerData = { error: 'Invalid JSON response', body: registerText };
    }
    
    // Now try to login with the created user
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
    console.log('[seed-railway] Login response status:', loginResponse.status);
    console.log('[seed-railway] Login response body:', loginText);
    
    let loginData;
    try {
      loginData = JSON.parse(loginText);
    } catch (e) {
      loginData = { error: 'Invalid JSON response', body: loginText };
    }
    
    return NextResponse.json({
      apiUrl,
      register: {
        status: registerResponse.status,
        data: registerData
      },
      login: {
        status: loginResponse.status,
        data: loginData
      },
      message: registerResponse.status === 201 || registerResponse.status === 409 
        ? 'Database seeded successfully' 
        : 'Database seeding may have failed'
    });
    
  } catch (error) {
    console.error('[seed-railway] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
