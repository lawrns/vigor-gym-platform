import { Router, Request, Response } from 'express';
import argon2 from 'argon2';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { generateTokens, verifyToken, authRequired, AuthenticatedRequest } from '../middleware/auth.js';
import { logAuthEvent, logSecurityEvent } from '../utils/logger.js';

const router = Router();

/**
 * Get the real client IP address for rate limiting
 */
function getClientIp(req: Request): string {
  // If trust proxy is enabled, use X-Forwarded-For
  if (req.app.get('trust proxy')) {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  // If trust proxy is disabled, use direct connection IP
  return req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
}

// We'll inject the prisma instance from the main app
let prisma: any;

export function setPrismaInstance(prismaInstance: any) {
  prisma = prismaInstance;
}

// Rate limiting for auth endpoints (disabled in test mode)
const isTestMode = process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMITING === 'true';

const loginLimiter = isTestMode ? (req: any, res: any, next: any) => next() : rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute
  keyGenerator: (req: Request) => `login:${getClientIp(req)}`,
  message: { message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = isTestMode ? (req: any, res: any, next: any) => next() : rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 registrations per minute
  keyGenerator: (req: Request) => `register:${getClientIp(req)}`,
  message: { message: 'Too many registration attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const registerCompanySchema = z.object({
  // Company info
  companyName: z.string().min(1, 'Company name is required'),
  rfc: z.string().regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'Invalid RFC format'),
  billingEmail: z.string().email('Invalid billing email format'),
  timezone: z.string().default('America/Mexico_City'),
  industry: z.string().optional(),
  
  // Owner user info
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Helper function to handle failed login attempts
async function handleFailedLogin(email: string) {
  // Skip failed login tracking in test mode
  if (isTestMode) return;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const failedCount = user.failedLoginCount + 1;
  const lockDuration = failedCount >= 5 ? 30 * 60 * 1000 : 0; // 30 minutes after 5 failures

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: failedCount,
      lockedUntil: lockDuration > 0 ? new Date(Date.now() + lockDuration) : null,
    },
  });
}

// Helper function to reset failed login attempts
async function resetFailedLogin(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
}

// POST /auth/login
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { company: true }
    });

    if (!user) {
      await handleFailedLogin(email);
      return res.status(401).json({ message: 'Email o contraseña inválidos' });
    }

    // Check if account is locked (skip in test mode)
    if (!isTestMode && user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({
        message: 'Account temporarily locked due to failed login attempts',
        lockedUntil: user.lockedUntil
      });
    }

    // Check if user is active
    if (!user.isActive) {
      logAuthEvent('auth_failure', {
        userId: user.id,
        email: user.email,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        reason: 'Account deactivated',
        requestId: (req as any).requestId,
      });
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.passwordHash, password);
    if (!isValidPassword) {
      await handleFailedLogin(email);
      logAuthEvent('auth_failure', {
        email,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        reason: 'Invalid password',
        requestId: (req as any).requestId,
      });
      return res.status(401).json({ message: 'Email o contraseña inválidos' });
    }

    // Reset failed login attempts
    await resetFailedLogin(user.id);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });

    // Set secure cookies
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Log successful login
    logAuthEvent('login', {
      userId: user.id,
      email: user.email,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      requestId: (req as any).requestId,
    });

    // Return user info (no sensitive data)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company ? {
          id: user.company.id,
          name: user.company.name,
          rfc: user.company.rfc,
        } : null,
      },
      accessToken, // Also return in response for client-side storage if needed
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }

    // Log with structured fields (no PII)
    console.error('[AUTH]', {
      route: 'login',
      code: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /auth/register-company
router.post('/register-company', registerLimiter, async (req: Request, res: Response) => {
  try {
    const data = registerCompanySchema.parse(req.body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Check if RFC already exists
    const existingCompany = await prisma.company.findUnique({
      where: { rfc: data.rfc.toUpperCase() }
    });

    if (existingCompany) {
      return res.status(409).json({ message: 'RFC already registered' });
    }

    // Hash password
    const passwordHash = await argon2.hash(data.password);

    // Create company and owner user in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          rfc: data.rfc.toUpperCase(),
          billingEmail: data.billingEmail.toLowerCase(),
          timezone: data.timezone,
          industry: data.industry,
        },
      });

      // Create owner user
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'owner',
          companyId: company.id,
        },
      });

      return { company, user };
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      companyId: result.user.companyId,
    });

    // Set secure cookies
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        company: {
          id: result.company.id,
          name: result.company.name,
          rfc: result.company.rfc,
        },
      },
      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }

    // Log with structured fields (no PII)
    console.error('[AUTH]', {
      route: 'register-company',
      code: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    let refreshToken: string;

    // Get refresh token from body or cookies
    if (req.body.refreshToken) {
      refreshToken = req.body.refreshToken;
    } else if (req.cookies?.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    } else {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const payload = verifyToken(refreshToken);

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { company: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });

    // Set new cookies
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company ? {
          id: user.company.id,
          name: user.company.name,
          rfc: user.company.rfc,
        } : null,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// POST /auth/logout
router.post('/logout', authRequired(), async (req: AuthenticatedRequest, res: Response) => {
  // Clear cookies with the same options used when setting them
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/'
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/'
  });

  res.json({ message: 'Logged out successfully' });
});

// GET /auth/me
router.get('/me', authRequired(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company ? {
          id: user.company.id,
          name: user.company.name,
          rfc: user.company.rfc,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
