import express, { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authRequired } from '../middleware/auth.js';
import { tenantRequired, TenantRequest } from '../middleware/tenant.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /v1/metrics/auth
// Authentication metrics for observability
router.get('/auth', authRequired(['owner', 'manager']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const { companyId } = req.tenant!;
    const { hours = '24' } = req.query;
    
    const hoursNum = parseInt(hours as string, 10);
    const since = new Date(Date.now() - hoursNum * 60 * 60 * 1000);

    // Get user login activity for the company
    const users = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        lastLoginAt: true,
        failedLoginCount: true,
        isActive: true,
      },
    });

    const activeUsers = users.filter(u => u.isActive).length;
    const recentLogins = users.filter(u => u.lastLoginAt && u.lastLoginAt > since).length;
    const lockedUsers = users.filter(u => u.failedLoginCount >= 5).length;

    res.json({
      totalUsers: users.length,
      activeUsers,
      recentLogins,
      lockedUsers,
      timeframe: `${hoursNum}h`,
    });
  } catch (error) {
    console.error('Auth metrics error:', error);
    res.status(500).json({ message: 'Failed to fetch auth metrics' });
  }
});

// GET /v1/metrics/billing
// Billing metrics for observability
router.get('/billing', authRequired(['owner', 'manager']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const { companyId } = req.tenant!;
    const { days = '30' } = req.query;
    
    const daysNum = parseInt(days as string, 10);
    const since = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    // Get subscription metrics
    const subscriptions = await prisma.subscription.findMany({
      where: { companyId },
      include: {
        plan: {
          select: {
            priceMxnCents: true,
          },
        },
      },
    });

    // Get payment methods
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { companyId },
    });

    // Get recent invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: {
        companyId,
        issuedAt: {
          gte: since,
        },
      },
      include: {
        payments: true,
      },
    });

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const totalRevenue = recentInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.totalMxnCents || 0), 0);
    
    const successfulPayments = recentInvoices
      .flatMap(i => i.payments)
      .filter(p => p.status === 'succeeded').length;
    
    const failedPayments = recentInvoices
      .flatMap(i => i.payments)
      .filter(p => p.status === 'failed').length;

    res.json({
      activeSubscriptions,
      totalPaymentMethods: paymentMethods.length,
      recentRevenue: totalRevenue,
      successfulPayments,
      failedPayments,
      paymentSuccessRate: successfulPayments + failedPayments > 0 
        ? (successfulPayments / (successfulPayments + failedPayments) * 100).toFixed(1)
        : '100.0',
      timeframe: `${daysNum}d`,
    });
  } catch (error) {
    console.error('Billing metrics error:', error);
    res.status(500).json({ message: 'Failed to fetch billing metrics' });
  }
});

// GET /v1/metrics/api
// API performance metrics
router.get('/api', authRequired(['owner', 'manager']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const { companyId } = req.tenant!;
    const { hours = '24' } = req.query;
    
    const hoursNum = parseInt(hours as string, 10);
    const since = new Date(Date.now() - hoursNum * 60 * 60 * 1000);

    // Get webhook events
    const webhookEvents = await prisma.webhookEvent.findMany({
      where: {
        createdAt: {
          gte: since,
        },
      },
    });

    const totalWebhooks = webhookEvents.length;
    const processedWebhooks = webhookEvents.filter(w => w.processed).length;
    const failedWebhooks = totalWebhooks - processedWebhooks;

    // Mock API response times (in a real implementation, you'd store these metrics)
    const mockResponseTimes = {
      p50: 120,
      p95: 450,
      p99: 800,
    };

    res.json({
      webhooks: {
        total: totalWebhooks,
        processed: processedWebhooks,
        failed: failedWebhooks,
        successRate: totalWebhooks > 0 ? (processedWebhooks / totalWebhooks * 100).toFixed(1) : '100.0',
      },
      responseTime: mockResponseTimes,
      timeframe: `${hoursNum}h`,
    });
  } catch (error) {
    console.error('API metrics error:', error);
    res.status(500).json({ message: 'Failed to fetch API metrics' });
  }
});

// GET /v1/metrics/health
// System health check
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      status: 'healthy',
      uptime: Math.floor(uptime),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
