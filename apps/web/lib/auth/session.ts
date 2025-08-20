import { cookies } from 'next/headers';
import { SessionUser, SessionPayload } from './types';
import { verifyToken } from './supabase-auth';
import jwt from 'jsonwebtoken';

// Re-export types for convenience
export type { SessionUser, SessionPayload } from './types';

/**
 * Get session from cookies (server-side only) using Supabase tokens or dev tokens
 */
export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return null;
    }

    // In development, try to verify as a regular JWT first (for dev login)
    if (process.env.NODE_ENV === 'development') {
      try {
        const jwtSecret = process.env.JWT_SECRET || 'dev-shared-secret';
        const payload = jwt.verify(accessToken, jwtSecret, {
          algorithms: ['HS256'],
          issuer: process.env.JWT_ISSUER || 'gogym-web',
          audience: process.env.JWT_AUDIENCE || 'gogym-api',
        }) as any;

        if (payload.userId && payload.email && payload.companyId) {
          return {
            userId: payload.userId,
            email: payload.email,
            role: payload.role as SessionUser['role'],
            companyId: payload.companyId,
          };
        }
      } catch (error) {
        console.warn('[Session] Dev JWT verification failed:', error);
        // Not a dev JWT, try Supabase verification
      }
    }

    // Try access token with Supabase verification
    try {
      const user = await verifyToken(accessToken);
      if (user) {
        return {
          userId: user.id,
          email: user.email,
          role: user.role as SessionUser['role'],
          companyId: null, // Supabase doesn't have companyId in the token
        };
      }
    } catch (error) {
      // Token verification failed
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
export function hasMinimumRole(
  userRole: SessionUser['role'],
  minimumRole: SessionUser['role']
): boolean {
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
