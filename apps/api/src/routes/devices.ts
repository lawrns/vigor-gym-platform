import express, { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaClient } from '../generated/prisma/index.js';
import { authRequired, AuthenticatedRequest } from '../middleware/auth.js';
import { tenantRequired, TenantRequest, logTenantAction } from '../middleware/tenant.js';
import { generateDeviceToken, deviceAuthRequired, DeviceAuthenticatedRequest } from '../middleware/deviceAuth.js';
import { logDeviceRegistration, logDeviceLogin, logRateLimitHit } from '../utils/auditLogger.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiting for device authentication (disabled in test mode)
const isTestMode = process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMITING === 'true';

const deviceAuthRateLimit = isTestMode ? (req: any, res: any, next: any) => next() : rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute per IP
  message: { message: 'Too many device authentication attempts, please try again later', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req: Request, res: Response) => {
    await logRateLimitHit('device.auth', req.ip, req.ip, req.get('User-Agent'));
    res.status(429).json({ message: 'Too many device authentication attempts, please try again later', code: 'RATE_LIMITED' });
  },
});

// Validation schemas
const registerDeviceSchema = z.object({
  name: z.string().min(1).max(100),
  locationId: z.string().uuid().optional(),
});

const authenticateDeviceSchema = z.object({
  deviceId: z.string().uuid(),
  deviceSecret: z.string().min(1),
});

/**
 * POST /v1/devices/register
 * Register a new device (requires user authentication with owner/manager role)
 */
router.post('/register', 
  authRequired(['owner', 'manager']), 
  tenantRequired(), 
  async (req: TenantRequest, res: Response) => {
    try {
      const validatedData = registerDeviceSchema.parse(req.body);
      const { companyId } = req.tenant!;

      // Generate device secret (32 random bytes as hex)
      const deviceSecret = randomBytes(32).toString('hex');
      const deviceSecretHash = await bcrypt.hash(deviceSecret, 12);

      // Create device
      const device = await prisma.device.create({
        data: {
          companyId,
          name: validatedData.name,
          deviceSecretHash,
          locationId: validatedData.locationId,
        },
        select: {
          id: true,
          name: true,
          locationId: true,
          createdAt: true,
        },
      });

      // Log the action
      await logTenantAction(req, 'device.registered', {
        deviceId: device.id,
        deviceName: validatedData.name,
      });

      // Audit log
      await logDeviceRegistration(
        req.user!.id,
        companyId,
        device.id,
        validatedData.name,
        req.ip,
        req.get('User-Agent')
      );

      res.status(201).json({
        device: {
          id: device.id,
          name: device.name,
          locationId: device.locationId,
          createdAt: device.createdAt,
        },
        deviceSecret, // Return secret only once during registration
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Device registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * POST /v1/devices/auth
 * Authenticate device and get JWT token
 */
router.post('/auth', 
  deviceAuthRateLimit,
  async (req: Request, res: Response) => {
    try {
      const validatedData = authenticateDeviceSchema.parse(req.body);

      // Find device
      const device = await prisma.device.findUnique({
        where: { id: validatedData.deviceId },
        select: {
          id: true,
          companyId: true,
          name: true,
          deviceSecretHash: true,
        },
      });

      if (!device) {
        await logDeviceLogin('unknown', 'unknown', false, req.ip, req.get('User-Agent'), 'DEVICE_NOT_FOUND', 'Device not found');
        return res.status(401).json({ message: 'Invalid device credentials', code: 'INVALID_CREDENTIALS' });
      }

      // Verify device secret
      const isValidSecret = await bcrypt.compare(validatedData.deviceSecret, device.deviceSecretHash);
      if (!isValidSecret) {
        await logDeviceLogin(device.id, device.companyId, false, req.ip, req.get('User-Agent'), 'INVALID_SECRET', 'Invalid device secret');
        return res.status(401).json({ message: 'Invalid device credentials', code: 'INVALID_CREDENTIALS' });
      }

      // Generate device token
      const deviceToken = await generateDeviceToken({
        id: device.id,
        companyId: device.companyId,
      });

      // Update last seen
      await prisma.device.update({
        where: { id: device.id },
        data: { lastSeenAt: new Date() },
      });

      // Log successful authentication
      await logDeviceLogin(device.id, device.companyId, true, req.ip, req.get('User-Agent'));

      res.json({
        deviceToken,
        device: {
          id: device.id,
          name: device.name,
          companyId: device.companyId,
        },
        expiresIn: parseInt(process.env.DEVICE_TOKEN_TTL_MIN || '1440') * 60, // seconds
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Device authentication error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * GET /v1/devices/me
 * Get current device information (requires device authentication)
 */
router.get('/me', 
  deviceAuthRequired(),
  async (req: DeviceAuthenticatedRequest, res: Response) => {
    try {
      const device = await prisma.device.findUnique({
        where: { id: req.device!.id },
        select: {
          id: true,
          name: true,
          companyId: true,
          locationId: true,
          lastSeenAt: true,
          createdAt: true,
        },
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      res.json({ device });
    } catch (error) {
      console.error('Get device info error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * GET /v1/devices
 * List devices for company (requires user authentication)
 */
router.get('/', 
  authRequired(['owner', 'manager', 'staff']), 
  tenantRequired(), 
  async (req: TenantRequest, res: Response) => {
    try {
      const { companyId } = req.tenant!;

      const devices = await prisma.device.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          locationId: true,
          lastSeenAt: true,
          createdAt: true,
          _count: {
            select: {
              visits: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ devices });
    } catch (error) {
      console.error('List devices error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;
