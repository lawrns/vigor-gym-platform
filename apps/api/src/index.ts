import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';

// Ensure .env.local takes precedence over .env
const localEnv = path.join(process.cwd(), '.env.local');
if (fs.existsSync(localEnv)) {
  require('dotenv').config({ path: localEnv });
}
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import { PrismaClient } from './generated/prisma/index.js';
import { authRequired, AuthenticatedRequest, setPrismaInstance as setAuthPrismaInstance } from './middleware/auth.js';
import { tenantRequired, withTenantFilter, TenantRequest, logTenantAction } from './middleware/tenant.js';
import authRoutes, { setPrismaInstance } from './routes/auth.js';
import companiesRoutes, { setPrismaInstance as setCompaniesPrismaInstance } from './routes/companies.js';
import plansRoutes, { setPrismaInstance as setPlansPrismaInstance } from './routes/plans.js';
import membershipsRoutes, { setPrismaInstance as setMembershipsPrismaInstance } from './routes/memberships.js';

const app = express();
const prisma = new PrismaClient();

app.use(helmet());
const origins = (process.env.CORS_ORIGINS || 'http://localhost:7777').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (origins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true // Allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// Set prisma instance for auth routes and middleware
setPrismaInstance(prisma);
setAuthPrismaInstance(prisma);
setCompaniesPrismaInstance(prisma);
setPlansPrismaInstance(prisma);
setMembershipsPrismaInstance(prisma);

// Validation schemas
const createMemberSchema = z.object({
  companyId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  status: z.enum(['active', 'invited', 'paused', 'cancelled']).optional()
});

const updateMemberSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  status: z.enum(['active', 'invited', 'paused', 'cancelled']).optional()
});

const createMembershipSchema = z.object({
  memberId: z.string().uuid(),
  planId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional()
});

// Auth routes
app.use('/auth', authRoutes);

// Companies routes
app.use('/v1/companies', companiesRoutes);

// Plans routes
app.use('/v1/plans', plansRoutes);

// Memberships routes
app.use('/v1/memberships', membershipsRoutes);

// Healthcheck
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Members endpoints
app.get('/v1/members', authRequired(['owner', 'manager', 'staff']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const { limit = '50', offset = '0' } = req.query;

    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    // Use tenant filtering instead of manual companyId check
    const whereClause = withTenantFilter(req);

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where: whereClause,
        include: {
          company: true,
          memberships: {
            include: {
              plan: true
            }
          }
        },
        take: limitNum,
        skip: offsetNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.member.count({ where: whereClause })
    ]);

    res.json({
      data: members,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/v1/members', authRequired(['owner', 'manager', 'staff']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const validatedData = createMemberSchema.parse(req.body);

    const member = await prisma.member.create({
      data: {
        ...validatedData,
        companyId: req.tenant!.companyId, // Automatically set from tenant context
        status: validatedData.status || 'active'
      },
      include: {
        company: true,
        memberships: {
          include: {
            plan: true
          }
        }
      }
    });

    res.status(201).json(member);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.patch('/v1/members/:id', authRequired(['owner', 'manager', 'staff']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateMemberSchema.parse(req.body);

    // Use tenant-aware update with companyId filter
    const member = await prisma.member.update({
      where: withTenantFilter(req, { id }),
      data: validatedData,
      include: {
        company: true,
        memberships: {
          include: {
            plan: true
          }
        }
      }
    });

    res.json(member);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error updating member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Memberships endpoint
app.post('/v1/memberships', authRequired(['owner', 'manager', 'staff']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const validatedData = createMembershipSchema.parse(req.body);

    // Validate that the member belongs to the current tenant
    const member = await prisma.member.findUnique({
      where: withTenantFilter(req, { id: validatedData.memberId }),
      select: { id: true, companyId: true }
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found or access denied' });
    }

    const membership = await prisma.membership.create({
      data: {
        ...validatedData,
        startsAt: new Date(validatedData.startsAt),
        endsAt: validatedData.endsAt ? new Date(validatedData.endsAt) : null
      },
      include: {
        member: {
          include: {
            company: true
          }
        },
        plan: true
      }
    });

    res.status(201).json(membership);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating membership:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// KPI Overview endpoint
app.get('/v1/kpi/overview', authRequired(['owner', 'manager', 'staff']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const tenantFilter = withTenantFilter(req);

    const [activeMembers, gyms, wellnessProviders, recentVisits] = await Promise.all([
      prisma.member.count({ where: { ...tenantFilter, status: 'active' } }),
      prisma.gym.count(), // Gyms are not tenant-scoped in current schema
      1, // Current company count (always 1 for the current tenant)
      prisma.visit.findMany({
        where: {
          membership: {
            member: { companyId: req.tenant!.companyId }
          },
          checkIn: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        select: {
          checkIn: true,
          checkOut: true
        }
      })
    ]);

    // Calculate average activation hours (time between check-in and check-out)
    const activationTimes = recentVisits
      .filter(visit => visit.checkOut)
      .map(visit => {
        const checkIn = new Date(visit.checkIn);
        const checkOut = new Date(visit.checkOut!);
        return (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60); // Hours
      });

    const avgActivationHours = activationTimes.length > 0
      ? activationTimes.reduce((sum, hours) => sum + hours, 0) / activationTimes.length
      : 0;

    res.json({
      activeMembers,
      gyms,
      wellnessProviders,
      avgActivationHours: Math.round(avgActivationHours * 100) / 100 // Round to 2 decimal places
    });
  } catch (error) {
    console.error('Error fetching KPI overview:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err?.status || 500;
  res.status(status).json({ message: err?.message || 'Internal Server Error' });
});

const initialPort = process.env.PORT ? Number(process.env.PORT) : 4001;

function startServer(port: number) {
  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 API listening on http://localhost:${port}`);
    // eslint-disable-next-line no-console
    console.log(`📊 Health check: http://localhost:${port}/health`);
  });
  server.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      // eslint-disable-next-line no-console
      console.warn(`Port ${port} in use, retrying on ${nextPort}...`);
      startServer(nextPort);
    } else {
      // eslint-disable-next-line no-console
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

if (process.env.NODE_ENV === 'development') {
  const server = app.listen(initialPort, () => {
    console.log(`🚀 API listening on http://localhost:${initialPort}`);
    console.log(`📊 Health check: http://localhost:${initialPort}/health`);
  });
  server.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE') {
      console.error(`[DEV] Port ${initialPort} busy. Stop the other process or update NEXT_PUBLIC_API_URL.`);
      process.exit(1);
    }
    throw err;
  });
} else {
  startServer(initialPort);
}


