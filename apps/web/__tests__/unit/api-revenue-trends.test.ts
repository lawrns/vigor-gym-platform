/**
 * API Contract Tests for Revenue Trends Endpoint
 * Tests the /api/revenue/trends route for proper zod validation and data structure
 */

import { NextRequest } from 'next/server';
import { GET } from '../../app/api/revenue/trends/route';
import { RevenueAnalyticsSchema } from '@vigor/shared';

// Mock the session module
jest.mock('../../lib/auth/session.server', () => ({
  getSessionContext: jest.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
    tenant: {
      companyId: 'test-company-id',
      companyName: 'Test Company',
      permissions: ['admin'],
    },
  })),
}));

// Mock the Supabase data service
jest.mock('../../lib/dashboard/supabase-data-service', () => ({
  getRevenueAnalytics: jest.fn(),
}));

import { getRevenueAnalytics } from '../../lib/dashboard/supabase-data-service';

const mockGetRevenueAnalytics = getRevenueAnalytics as jest.MockedFunction<
  typeof getRevenueAnalytics
>;

describe('/api/revenue/trends', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path Tests', () => {
    it('should return valid revenue analytics with all required fields', async () => {
      // Arrange
      const mockAnalytics = {
        totalRevenue: 125000,
        currency: 'MXN' as const,
        period: {
          start: '2025-08-12T00:00:00.000Z',
          end: '2025-08-19T23:59:59.999Z',
        },
        dataPoints: [
          { date: '2025-08-12', amount: 15000 },
          { date: '2025-08-13', amount: 18000 },
          { date: '2025-08-14', amount: 22000 },
          { date: '2025-08-15', amount: 19000 },
          { date: '2025-08-16', amount: 21000 },
          { date: '2025-08-17', amount: 16000 },
          { date: '2025-08-18', amount: 14000 },
        ],
        growth: {
          percentage: 12.5,
          trend: 'up' as const,
        },
      };

      mockGetRevenueAnalytics.mockResolvedValue(mockAnalytics);

      const request = new NextRequest('http://localhost:7777/api/revenue/trends?period=7d');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockAnalytics);

      // Validate against zod schema
      const parseResult = RevenueAnalyticsSchema.safeParse(data);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        expect(parseResult.data.totalRevenue).toBe(125000);
        expect(parseResult.data.currency).toBe('MXN');
        expect(parseResult.data.dataPoints).toHaveLength(7);
        expect(parseResult.data.growth.trend).toBe('up');
      }
    });

    it('should handle different period parameters', async () => {
      // Arrange
      const mockAnalytics = {
        totalRevenue: 450000,
        currency: 'MXN' as const,
        period: {
          start: '2025-07-19T00:00:00.000Z',
          end: '2025-08-19T23:59:59.999Z',
        },
        dataPoints: Array.from({ length: 30 }, (_, i) => ({
          date: `2025-08-${String(i + 1).padStart(2, '0')}`,
          amount: Math.floor(Math.random() * 20000) + 10000,
        })),
        growth: {
          percentage: -3.2,
          trend: 'down' as const,
        },
      };

      mockGetRevenueAnalytics.mockResolvedValue(mockAnalytics);

      const request = new NextRequest('http://localhost:7777/api/revenue/trends?period=30d');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockGetRevenueAnalytics).toHaveBeenCalledWith('30d', undefined);

      const parseResult = RevenueAnalyticsSchema.safeParse(data);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        expect(parseResult.data.dataPoints).toHaveLength(30);
        expect(parseResult.data.growth.trend).toBe('down');
      }
    });

    it('should handle empty data points', async () => {
      // Arrange
      const mockAnalytics = {
        totalRevenue: 0,
        currency: 'MXN' as const,
        period: {
          start: '2025-08-12T00:00:00.000Z',
          end: '2025-08-19T23:59:59.999Z',
        },
        dataPoints: [],
        growth: {
          percentage: 0,
          trend: 'stable' as const,
        },
      };

      mockGetRevenueAnalytics.mockResolvedValue(mockAnalytics);

      const request = new NextRequest('http://localhost:7777/api/revenue/trends?period=7d');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);

      const parseResult = RevenueAnalyticsSchema.safeParse(data);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        expect(parseResult.data.dataPoints).toHaveLength(0);
        expect(parseResult.data.totalRevenue).toBe(0);
        expect(parseResult.data.growth.trend).toBe('stable');
      }
    });
  });

  describe('Error Path Tests', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      mockGetRevenueAnalytics.mockRejectedValue(new Error('Database query failed'));

      const request = new NextRequest('http://localhost:7777/api/revenue/trends?period=7d');

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Failed to fetch revenue analytics');
    });

    it('should handle invalid period parameter', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:7777/api/revenue/trends?period=invalid');

      // Act
      const response = await GET(request);

      // Assert - should still work with default period
      expect(response.status).toBe(200);
      expect(mockGetRevenueAnalytics).toHaveBeenCalledWith('invalid', undefined);
    });
  });

  describe('Data Validation Tests', () => {
    it('should reject invalid growth trend values', async () => {
      // Arrange
      const invalidData = {
        totalRevenue: 100000,
        currency: 'MXN',
        period: {
          start: '2025-08-12T00:00:00.000Z',
          end: '2025-08-19T23:59:59.999Z',
        },
        dataPoints: [],
        growth: {
          percentage: 5.5,
          trend: 'invalid-trend', // Invalid trend value
        },
      };

      mockGetRevenueAnalytics.mockResolvedValue(invalidData as any);

      const request = new NextRequest('http://localhost:7777/api/revenue/trends?period=7d');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      const parseResult = RevenueAnalyticsSchema.safeParse(data);
      expect(parseResult.success).toBe(false);

      if (!parseResult.success) {
        expect(parseResult.error.issues.some(issue => issue.path.includes('trend'))).toBe(true);
      }
    });

    it('should validate data points structure', async () => {
      // Arrange
      const invalidData = {
        totalRevenue: 100000,
        currency: 'MXN',
        period: {
          start: '2025-08-12T00:00:00.000Z',
          end: '2025-08-19T23:59:59.999Z',
        },
        dataPoints: [
          { date: '2025-08-12' }, // Missing amount
          { amount: 15000 }, // Missing date
        ],
        growth: {
          percentage: 5.5,
          trend: 'up',
        },
      };

      mockGetRevenueAnalytics.mockResolvedValue(invalidData as any);

      const request = new NextRequest('http://localhost:7777/api/revenue/trends?period=7d');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      const parseResult = RevenueAnalyticsSchema.safeParse(data);
      expect(parseResult.success).toBe(false);
    });
  });
});
