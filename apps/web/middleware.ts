import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasValidSession, getRedirectAction } from './lib/auth/edge-session';

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  // Get auth tokens from cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // Check if user is authenticated using Edge-safe verification
  const hasSession = hasValidSession(accessToken, refreshToken);

  // Debug logging (uncomment for debugging)
  // console.log('[MW]', pathname, {
  //   hasSession,
  //   hasAccessToken: !!accessToken,
  //   hasRefreshToken: !!refreshToken
  // });

  // Determine if redirect is needed using Edge-safe logic
  const redirectAction = getRedirectAction(pathname, hasSession, request);

  const duration = Date.now() - startTime;

  // Log performance metrics (in production, this would go to a monitoring service)
  if (process.env.NODE_ENV === 'development' && duration > 50) {
    console.warn(`[MW] Slow middleware: ${duration}ms for ${pathname}`);
  }

  if (redirectAction.shouldRedirect) {
    return NextResponse.redirect(new URL(redirectAction.destination!, request.url));
  }

  // Public and everything else → pass through
  const response = NextResponse.next();

  // Add CORS headers for API routes - only for cross-origin requests
  if (pathname.startsWith('/api/')) {
    const reqOrigin = request.headers.get('origin');
    const selfOrigin = request.nextUrl.origin;

    // Only add CORS headers for actual cross-origin requests
    if (reqOrigin && reqOrigin !== selfOrigin) {
      response.headers.set('Access-Control-Allow-Origin', reqOrigin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      );
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Org-Id');
      response.headers.append('Vary', 'Origin');
    }
  }

  // Add comprehensive security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy (basic - should be customized for your needs)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';"
    );

    // HSTS header for production
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public assets)
     * - icons/ (public icons)
     * - any path that looks like a file (has an extension)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|icons/|.*\\..*).*)',
  ],
};
