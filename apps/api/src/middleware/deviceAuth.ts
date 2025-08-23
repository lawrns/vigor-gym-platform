import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { PrismaClient } from '../generated/prisma/index.js';
import { logDeviceLogin } from '../utils/auditLogger.js';

const prisma = new PrismaClient();

export interface DeviceJWTPayload {
  deviceId: string;
  companyId: string;
  jti: string; // JWT ID for session tracking
  iat: number;
  exp: number;
  kid?: string; // Key ID for key rotation support
}

export interface DeviceAuthenticatedRequest extends Request {
  device?: {
    id: string;
    companyId: string;
    name: string;
  };
}

/**
 * Generate device JWT token with session tracking and enhanced security
 */
export async function generateDeviceToken(device: {
  id: string;
  companyId: string;
}): Promise<string> {
  const deviceJwtSecret = process.env.DEVICE_JWT_SECRET;
  if (!deviceJwtSecret) {
    throw new Error('DEVICE_JWT_SECRET environment variable is required');
  }

  const jwtId = randomUUID();
  const ttlMinutes = parseInt(process.env.DEVICE_TOKEN_TTL_MIN || '1440'); // Default 24 hours
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  // Create device session record
  await prisma.deviceSession.create({
    data: {
      deviceId: device.id,
      jwtId,
      expiresAt,
    },
  });

  const payload: Omit<DeviceJWTPayload, 'iat' | 'exp'> = {
    deviceId: device.id,
    companyId: device.companyId,
    jti: jwtId,
    kid: 'device-key-1', // Support for key rotation
  };

  const algorithm = process.env.DEVICE_JWT_ALGORITHM === 'RS256' ? 'RS256' : 'HS256';

  return jwt.sign(payload, deviceJwtSecret, {
    expiresIn: `${ttlMinutes}m`,
    algorithm,
    issuer: 'gogym-api',
    audience: 'gogym-devices',
  });
}

/**
 * Verify device JWT token and check session validity with enhanced security
 */
export async function verifyDeviceToken(
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<DeviceJWTPayload> {
  const deviceJwtSecret = process.env.DEVICE_JWT_SECRET;
  if (!deviceJwtSecret) {
    throw new Error('DEVICE_JWT_SECRET environment variable is required');
  }

  try {
    const algorithm = process.env.DEVICE_JWT_ALGORITHM === 'RS256' ? 'RS256' : 'HS256';

    const payload = jwt.verify(token, deviceJwtSecret, {
      algorithms: [algorithm],
      issuer: 'vigor-api',
      audience: 'vigor-devices',
      clockTolerance: 300, // 5 minutes clock skew tolerance
    }) as DeviceJWTPayload;

    // Check if session exists and is not expired
    const session = await prisma.deviceSession.findUnique({
      where: { jwtId: payload.jti },
      include: { device: true },
    });

    if (!session) {
      await logDeviceLogin(
        payload.deviceId,
        payload.companyId,
        false,
        ipAddress,
        userAgent,
        'SESSION_NOT_FOUND',
        'Device session not found'
      );
      throw new Error('Device session not found or expired');
    }

    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await prisma.deviceSession.delete({
        where: { jwtId: payload.jti },
      });
      await logDeviceLogin(
        payload.deviceId,
        payload.companyId,
        false,
        ipAddress,
        userAgent,
        'SESSION_EXPIRED',
        'Device session expired'
      );
      throw new Error('Device session expired');
    }

    // Update device last seen
    await prisma.device.update({
      where: { id: payload.deviceId },
      data: { lastSeenAt: new Date() },
    });

    return payload;
  } catch (e) {
    const error = e as Error;
    if (error instanceof jwt.JsonWebTokenError) {
      await logDeviceLogin(
        'unknown',
        'unknown',
        false,
        ipAddress,
        userAgent,
        'INVALID_TOKEN',
        error.message
      );
    }
    throw new Error('Invalid or expired device token');
  }
}

/**
 * Device authentication middleware with enhanced security and audit logging
 * Validates device JWT and attaches device info to request
 */
export function deviceAuthRequired() {
  return async (req: DeviceAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          message: 'Device authentication required',
          code: 'MISSING_AUTH_HEADER',
        });
      }

      const token = authHeader.substring(7);
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const payload = await verifyDeviceToken(token, ipAddress, userAgent);

      // Get device details
      const device = await prisma.device.findUnique({
        where: { id: payload.deviceId },
        select: {
          id: true,
          companyId: true,
          name: true,
        },
      });

      if (!device) {
        await logDeviceLogin(
          payload.deviceId,
          payload.companyId,
          false,
          ipAddress,
          userAgent,
          'DEVICE_NOT_FOUND',
          'Device not found'
        );
        return res.status(401).json({
          message: 'Device not found',
          code: 'DEVICE_NOT_FOUND',
        });
      }

      // Attach device to request
      req.device = device;

      next();
    } catch (e) {
      const error = e as Error;
      console.error('Device auth middleware error:', error);
      return res.status(401).json({
        message: 'Invalid device authentication',
        code: 'INVALID_AUTH',
      });
    }
  };
}

/**
 * Revoke device session (logout)
 */
export async function revokeDeviceSession(jwtId: string): Promise<void> {
  await prisma.deviceSession.delete({
    where: { jwtId },
  });
}

/**
 * Clean up expired device sessions
 */
export async function cleanupExpiredDeviceSessions(): Promise<number> {
  const result = await prisma.deviceSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}
