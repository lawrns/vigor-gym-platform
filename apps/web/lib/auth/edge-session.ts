/**
 * Edge Runtime compatible session verification
 *
 * This module contains ONLY Edge Runtime compatible code for use in middleware.
 * DO NOT import Node.js specific modules here (like 'jsonwebtoken', 'next/headers', etc.)
 *
 * For server-side session verification, use lib/auth/session.ts instead.
 */

import { AUTH_ROUTES, PROTECTED_PREFIXES, PUBLIC_ROUTES } from './types';

/**
 * Supabase JWT token validation for Edge Runtime
 * Validates Supabase access tokens (format and expiration)
 */
export function isValidSupabaseToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode payload to check expiration and Supabase-specific fields
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);

    // Check if token is expired
    if (payload.exp && payload.exp < now) {
      return false;
    }

    // Verify it's a Supabase token by checking for expected fields
    if (!payload.iss || !payload.iss.includes('supabase')) {
      return false;
    }

    // Check for user ID (Supabase tokens should have 'sub' field)
    if (!payload.sub) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if user has valid Supabase session based on cookies
 * Edge Runtime compatible version
 */
export function hasValidSession(accessToken?: string, refreshToken?: string): boolean {
  // For Supabase, we primarily rely on the access token
  if (accessToken && isValidSupabaseToken(accessToken)) {
    return true;
  }

  // Fallback to refresh token if access token is invalid/expired
  if (refreshToken && isValidSupabaseToken(refreshToken)) {
    return true;
  }

  return false;
}

/**
 * Route classification helpers (re-exported for middleware use)
 */
export function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.includes(path);
}

export function isProtected(path: string): boolean {
  return PROTECTED_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'));
}

export function isPublic(path: string): boolean {
  return PUBLIC_ROUTES.includes(path);
}

/**
 * Determine redirect action for middleware
 */
export function getRedirectAction(
  pathname: string,
  hasSession: boolean
): { shouldRedirect: boolean; destination?: string } {
  // If protected and no session → login
  if (isProtected(pathname) && !hasSession) {
    const loginUrl = new URL('/login', 'http://localhost:3000');
    loginUrl.searchParams.set('next', pathname);
    return { shouldRedirect: true, destination: loginUrl.pathname + loginUrl.search };
  }

  // If auth route and has session → dashboard
  if (isAuthRoute(pathname) && hasSession) {
    return { shouldRedirect: true, destination: '/dashboard' };
  }

  return { shouldRedirect: false };
}
