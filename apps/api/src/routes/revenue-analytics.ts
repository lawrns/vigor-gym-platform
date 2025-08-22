/**
 * Revenue Analytics API Routes
 *
 * Handles revenue trends, MRR calculations, and financial analytics
 */

import { Router, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authRequired } from '../middleware/auth.js';
import { tenantRequired, TenantRequest } from '../middleware/tenant.js';
import { logger } from '../utils/auditLogger.js';
import { validateDashboardQuery, DashboardValidationError } from '../lib/validation/dashboard.js';

const router = Router();
const prisma = new PrismaClient();

interface DailyRevenue {
  date: string;
  amount: number;
  paymentsCount: number;
  failedCount: number;
}

interface RevenueSummary {
  totalRevenue: number;
  averageDaily: number;
  mrr: number;
  failedPayments: number;
  refunds: number;
  growthPercent: number;
  successRate: number;
}

interface RevenueAnalytics {
  dailyRevenue: DailyRevenue[];
  summary: RevenueSummary;
  sparklineData: number[];
  period: string;
  dateRange: {
    from: string;
    to: string;
  };
}

/**
 * GET /v1/revenue/trends - Get revenue analytics and trends
 *
 * Query Parameters:
 * - period: '7d' | '14d' | '30d' (defaults to 7d)
 * - locationId: Optional UUID of specific gym location
 *
 * Returns revenue trends with:
 * - Daily revenue breakdown
 * - MRR calculations
 * - Growth trends and success rates
 * - Sparkline data for visualization
 */
router.get(
  '/trends',
  authRequired(['owner', 'manager']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { companyId } = req.tenant!;
      const { period = '7d', locationId } = req.query;

      // Validate locationId if provided
      if (locationId) {
        try {
          validateDashboardQuery({
            orgId: companyId,
            locationId: locationId as string,
          });
        } catch (error) {
          if (error instanceof DashboardValidationError) {
            return res.status(422).json({
              error: error.code,
              message: error.message,
              field: error.field,
            });
          }
          throw error;
        }
      }

      // Validate period
      if (!['7d', '14d', '30d'].includes(period as string)) {
        return res.status(422).json({
          error: 'INVALID_PERIOD',
          message: 'period must be one of: 7d, 14d, 30d',
          field: 'period',
        });
      }

      // Calculate date ranges
      const days = parseInt((period as string).replace('d', ''));
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days + 1);
      startDate.setHours(0, 0, 0, 0);

      // For growth calculation, get previous period
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - days);

      const prevEndDate = new Date(startDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      prevEndDate.setHours(23, 59, 59, 999);

      // Generate revenue analytics (using mock data for demo)
      const analytics = await generateRevenueAnalytics(
        companyId,
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
        locationId as string | undefined,
        period as string
      );

      res.json({
        ...analytics,
        period: period as string,
        dateRange: {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        },
      });
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          companyId: req.tenant?.companyId,
          locationId: req.query.locationId,
          period: req.query.period,
        },
        'Revenue analytics error'
      );

      res.status(500).json({
        message: 'Failed to fetch revenue analytics',
      });
    }
  }
);

/**
 * Generate revenue analytics with mock data for demo
 */
async function generateRevenueAnalytics(
  companyId: string,
  startDate: Date,
  endDate: Date,
  _prevStartDate: Date,
  _prevEndDate: Date,
  _locationId?: string,
  period: string = '7d'
): Promise<RevenueAnalytics> {
  // For demo purposes, generate realistic mock data
  // In production, this would query actual payment and membership data

  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const dailyRevenue: DailyRevenue[] = [];

  // Generate daily revenue data with realistic patterns
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Simulate revenue patterns (higher on weekends, lower on Mondays)
    const dayOfWeek = date.getDay();
    const baseAmount = 15000; // $150 MXN base

    let multiplier = 1;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend
      multiplier = 1.4;
    } else if (dayOfWeek === 1) {
      // Monday
      multiplier = 0.7;
    } else if (dayOfWeek === 5) {
      // Friday
      multiplier = 1.2;
    }

    // Add some randomness
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    const amount = Math.round(baseAmount * multiplier * randomFactor);

    // Simulate payment counts
    const paymentsCount = Math.round(amount / 1500); // ~$15 per payment
    const failedCount = Math.round(paymentsCount * 0.05); // 5% failure rate

    dailyRevenue.push({
      date: date.toISOString().split('T')[0],
      amount,
      paymentsCount,
      failedCount,
    });
  }

  // Calculate summary statistics
  const totalRevenue = dailyRevenue.reduce((sum, day) => sum + day.amount, 0);
  const averageDaily = Math.round(totalRevenue / days);
  const totalPayments = dailyRevenue.reduce((sum, day) => sum + day.paymentsCount, 0);
  const totalFailed = dailyRevenue.reduce((sum, day) => sum + day.failedCount, 0);

  // Mock MRR calculation (Monthly Recurring Revenue)
  const mrr = 45000000; // $450,000 MXN monthly

  // Mock previous period for growth calculation
  const prevRevenue = totalRevenue * (0.9 + Math.random() * 0.2); // -10% to +10%
  const growthPercent = Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);

  // Calculate success rate
  const successRate =
    totalPayments > 0 ? Math.round(((totalPayments - totalFailed) / totalPayments) * 100) : 100;

  // Mock refunds (2% of total revenue)
  const refunds = Math.round(totalRevenue * 0.02);

  const summary: RevenueSummary = {
    totalRevenue,
    averageDaily,
    mrr,
    failedPayments: totalFailed,
    refunds,
    growthPercent,
    successRate,
  };

  // Generate sparkline data (simplified for visualization)
  const sparklineData = dailyRevenue.map(day => day.amount);

  return {
    dailyRevenue,
    summary,
    sparklineData,
    period,
    dateRange: {
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0],
    },
  };
}

/**
 * GET /v1/revenue/mrr - Get Monthly Recurring Revenue details
 */
router.get(
  '/mrr',
  authRequired(['owner', 'manager']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { companyId } = req.tenant!;

      // Mock MRR breakdown for demo
      const mrrBreakdown = {
        current: 45000000, // $450,000 MXN
        previous: 42000000, // $420,000 MXN
        growth: 7.14, // 7.14% growth
        breakdown: {
          newMrr: 5000000, // $50,000 from new customers
          expansionMrr: 2000000, // $20,000 from upgrades
          contractionMrr: -1000000, // -$10,000 from downgrades
          churnMrr: -3000000, // -$30,000 from cancellations
        },
        byPlan: [
          { planName: 'TP ON', mrr: 15000000, customers: 500 },
          { planName: 'TP PRO', mrr: 25000000, customers: 250 },
          { planName: 'TP+', mrr: 5000000, customers: 17 },
        ],
      };

      res.json(mrrBreakdown);
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          companyId: req.tenant?.companyId,
        },
        'MRR analytics error'
      );

      res.status(500).json({
        message: 'Failed to fetch MRR analytics',
      });
    }
  }
);

export default router;
