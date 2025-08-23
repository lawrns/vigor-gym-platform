import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, PrismaClient } from '../generated/prisma/index.js';

// We'll inject the prisma instance from the main app
let prisma: PrismaClient;

export function setPrismaInstance(prismaInstance: PrismaClient) {
  prisma = prismaInstance;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    companyId: string | null;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  iat?: number;
  exp?: number;
}

export function generateTokens(user: {
  id: string;
  email: string;
  role: UserRole;
  companyId: string | null;
}) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  };

  // JWT signing options with issuer and audience claims
  const jwtOptions = {
    issuer: process.env.JWT_ISSUER || 'gogym-web',
    audience: process.env.JWT_AUDIENCE || 'gogym-api',
    algorithm: 'HS256' as const,
  };

  // Short-lived access token (15 minutes)
  const accessToken = jwt.sign(payload, jwtSecret, {
    ...jwtOptions,
    expiresIn: '15m'
  });

  // Long-lived refresh token (7 days)
  const refreshToken = jwt.sign(payload, jwtSecret, {
    ...jwtOptions,
    expiresIn: '7d'
  });

  return { accessToken, refreshToken };
}

export function verifyToken(token: string): JWTPayload {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  try {
    const payload = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER || 'gogym-web',
      audience: process.env.JWT_AUDIENCE || 'gogym-api',
    }) as any;

    // Map flexible claim names for dev compatibility
    const userId = payload.userId || payload.sub;
    const companyId = payload.companyId || payload.company?.id;

    if (!userId || !companyId) {
      throw new Error(`Invalid claims: userId=${!!userId}, companyId=${!!companyId}`);
    }

    // Return normalized payload
    return {
      userId,
      email: payload.email,
      role: payload.role,
      companyId,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (e) {
    const error = e as Error;
    // Structured debug for verification failures (no secrets)
    try {
      const parts = token.split('.');
      const raw = parts[1] ? Buffer.from(parts[1], 'base64').toString('utf8') : '{}';
      const decoded = JSON.parse(raw || '{}');
      const now = Math.floor(Date.now() / 1000);
      console.warn('[AUTH][verifyToken] failed', {
        name: error.name,
        message: error.message,
        issuer: process.env.JWT_ISSUER || 'gogym-web',
        audience: process.env.JWT_AUDIENCE || 'gogym-api',
        iat: decoded?.iat,
        exp: decoded?.exp,
        now,
        sub: decoded?.sub || decoded?.userId,
        hasCompanyId: !!(decoded?.companyId || decoded?.company?.id),
      });
    } catch {
      // ignore decode errors
    }

    // In test mode, be more lenient with token validation
    if (process.env.DISABLE_REFRESH_IN_TEST === 'true') {
      try {
        // Try to decode without verification for test tokens
        const decoded = jwt.decode(token) as any;
        const userId = decoded?.userId || decoded?.sub;
        const companyId = decoded?.companyId || decoded?.company?.id;

        if (decoded && userId && companyId) {
          return {
            userId,
            email: decoded.email,
            role: decoded.role,
            companyId,
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // Extend by 24 hours
          };
        }
      } catch (decodeError) {
        // Fall through to original error
      }
    }

    throw new Error('Invalid or expired token');
  }
}

export function authRequired(allowedRoles?: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Try to get token from Authorization header or cookies
      let token: string | undefined;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
      }

      if (!token) {
        console.warn('[AUTH] 401: missing token');
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Verify and decode token
      let payload: JWTPayload;
      try {
        payload = verifyToken(token);
      } catch (error: any) {
        console.warn('[AUTH] 401: verify failed:', error.message);
        return res.status(401).json({ message: 'Invalid authentication token' });
      }

      // In development, skip DB lookup for speed (optional)
      if (process.env.NODE_ENV === 'development') {
        console.debug('[AUTH] OK (dev mode):', {
          userId: payload.userId,
          companyId: payload.companyId,
        });
        req.user = {
          id: payload.userId,
          email: payload.email,
          role: payload.role,
          companyId: payload.companyId,
        };
        return next();
      }

      // Get fresh user data from database (production)
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { company: true },
      });

      if (!user || !user.isActive) {
        console.warn('[AUTH] 401: user not found or inactive:', payload.userId);
        return res.status(401).json({ message: 'User not found or inactive' });
      }

      // Check if user is locked due to failed login attempts
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return res.status(423).json({
          message: 'Account temporarily locked due to failed login attempts',
          lockedUntil: user.lockedUntil,
        });
      }

      // Check role permissions
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          message: 'Insufficient permissions',
          required: allowedRoles,
          current: user.role,
        });
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      };

      next();
    } catch (error) {
      console.error('[AUTH] 401: middleware error:', error);
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
  };
}

// Helper function to check if user has permission for a specific action
export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

// Role hierarchy for permission checking
export const roleHierarchy: Record<UserRole, number> = {
  member: 1,
  staff: 2,
  manager: 3,
  owner: 4,
  partner_admin: 2, // Same level as staff but for different domain
};

export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

// Middleware to ensure user belongs to the same company (for multi-tenant operations)
export function requireSameCompany() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { companyId } = req.params;
    const userCompanyId = req.user?.companyId;

    if (!userCompanyId) {
      return res.status(403).json({ message: 'User must belong to a company' });
    }

    if (companyId && companyId !== userCompanyId) {
      return res.status(403).json({ message: 'Access denied to this company data' });
    }

    next();
  };
}
