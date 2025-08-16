import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { SessionUser, SessionPayload } from './types';

// Re-export types for convenience
export type { SessionUser, SessionPayload } from './types';

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): SessionPayload {
  const jwtSecret = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  try {
    return jwt.verify(token, jwtSecret) as SessionPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get session from cookies (server-side only)
 */
export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;

    // Try access token first
    if (accessToken) {
      try {
        const payload = verifyToken(accessToken);
        return {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          companyId: payload.companyId,
        };
      } catch (error) {
        // Access token invalid, try refresh token
      }
    }

    // Try refresh token if access token failed
    if (refreshToken) {
      try {
        const payload = verifyToken(refreshToken);
        return {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          companyId: payload.companyId,
        };
      } catch (error) {
        // Both tokens invalid
      }
    }

    return null;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

/**
 * Require authentication for server components
 * Throws redirect if not authenticated
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await getServerSession();
  if (!session) {
    const { redirect } = await import('next/navigation');
    redirect('/login');
    // TypeScript doesn't know that redirect() never returns
    throw new Error('Redirecting to login');
  }
  return session;
}

/**
 * Require specific role for server components
 * Throws redirect if not authenticated or insufficient role
 */
export async function requireRole(allowedRoles: SessionUser['role'][]): Promise<SessionUser> {
  const session = await requireSession();

  if (!allowedRoles.includes(session.role)) {
    const { redirect } = await import('next/navigation');
    redirect('/no-acceso?reason=role');
  }

  return session;
}

/**
 * Require company/tenant association for server components
 * Throws redirect if not authenticated or no company
 */
export async function requireCompany(): Promise<SessionUser> {
  const session = await requireSession();

  if (!session.companyId) {
    const { redirect } = await import('next/navigation');
    redirect('/no-acceso?reason=tenant');
  }

  return session;
}

/**
 * Check if user has minimum role level
 */
export function hasMinimumRole(userRole: SessionUser['role'], minimumRole: SessionUser['role']): boolean {
  const roleHierarchy: Record<SessionUser['role'], number> = {
    member: 1,
    trainer: 2,
    staff: 2,
    manager: 3,
    owner: 4,
    partner_admin: 2, // Same level as staff but for different domain
  };

  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}


