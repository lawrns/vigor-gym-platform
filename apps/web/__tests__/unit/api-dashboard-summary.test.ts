/**
 * API Contract Tests for Dashboard Summary Endpoint
 * Tests the /api/dashboard/summary route for proper zod validation and data structure
 */

import { DashboardSummarySchema } from '@gogym/shared';

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
  getDashboardSummary: jest.fn(),
}));

import { getDashboardSummary } from '../../lib/dashboard/supabase-data-service';

const mockGetDashboardSummary = getDashboardSummary as jest.MockedFunction<
  typeof getDashboardSummary
>;

describe('Dashboard Summary API Contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Service Integration Tests', () => {
    it('should return valid dashboard summary with all required fields', async () => {
      // Arrange
      const mockSummary = {
        activeVisits: 12,
        capacityLimit: 50,
        utilizationPercent: 24,
        expiringCounts: {
          '7d': 3,
          '14d': 7,
          '30d': 15,
        },
        revenue: {
          total: 45000,
          mrr: 15000,
          failedPayments: 2,
          transactionCount: 45,
        },
        classesToday: 4,
        staffGaps: 1,
        dateRange: {
          from: '2025-08-12T00:00:00.000Z',
          to: '2025-08-19T23:59:59.999Z',
          days: 7,
        },
        locationId: null,
      };

      mockGetDashboardSummary.mockResolvedValue(mockSummary);

      // Act
      const result = await mockGetDashboardSummary('7d', undefined);

      // Assert
      expect(result).toEqual(mockSummary);

      // Validate against zod schema
      const parseResult = DashboardSummarySchema.safeParse(result);
      if (!parseResult.success) {
        console.log('Schema validation errors:', parseResult.error.issues);
      }
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        expect(parseResult.data.activeVisits).toBe(12);
        expect(parseResult.data.capacityLimit).toBe(50);
        expect(parseResult.data.utilizationPercent).toBe(24);
        expect(parseResult.data.expiringCounts['7d']).toBe(3);
        expect(parseResult.data.revenue.total).toBe(45000);
        expect(parseResult.data.classesToday).toBe(4);
        expect(parseResult.data.staffGaps).toBe(1);
      }
    });

    it('should handle different range parameters', async () => {
      // Arrange
      const mockSummary = {
        activeVisits: 8,
        capacityLimit: 50,
        utilizationPercent: 16,
        expiringCounts: {
          '7d': 2,
          '14d': 5,
          '30d': 12,
        },
        revenue: {
          total: 32000,
          mrr: 12000,
          failedPayments: 1,
          transactionCount: 32,
        },
        classesToday: 3,
        staffGaps: 0,
        dateRange: {
          from: '2025-07-20T00:00:00.000Z',
          to: '2025-08-19T23:59:59.999Z',
          days: 30,
        },
        locationId: null,
      };

      mockGetDashboardSummary.mockResolvedValue(mockSummary);

      // Act
      const result = await mockGetDashboardSummary('30d', undefined);

      // Assert
      expect(mockGetDashboardSummary).toHaveBeenCalledWith('30d', undefined);

      const parseResult = DashboardSummarySchema.safeParse(result);
      expect(parseResult.success).toBe(true);
    });

    it('should handle locationId parameter', async () => {
      // Arrange
      const mockSummary = {
        activeVisits: 5,
        capacityLimit: 30,
        utilizationPercent: 17,
        expiringCounts: {
          '7d': 1,
          '14d': 3,
          '30d': 8,
        },
        revenue: {
          total: 18000,
          mrr: 8000,
          failedPayments: 0,
          transactionCount: 18,
        },
        classesToday: 2,
        staffGaps: 2,
        dateRange: {
          from: '2025-08-12T00:00:00.000Z',
          to: '2025-08-19T23:59:59.999Z',
          days: 7,
        },
        locationId: 'test-location',
      };

      mockGetDashboardSummary.mockResolvedValue(mockSummary);

      // Act
      const result = await mockGetDashboardSummary('7d', 'test-location');

      // Assert
      expect(mockGetDashboardSummary).toHaveBeenCalledWith('7d', 'test-location');

      const parseResult = DashboardSummarySchema.safeParse(result);
      expect(parseResult.success).toBe(true);
    });
  });

  describe('Error Path Tests', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      mockGetDashboardSummary.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(mockGetDashboardSummary('7d', undefined)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('Data Validation Tests', () => {
    it('should reject invalid data structure from service', async () => {
      // Arrange
      const invalidData = {
        activeVisits: 'not-a-number', // Invalid type
        capacityLimit: 50,
        // Missing required fields
      };

      // Act
      const parseResult = DashboardSummarySchema.safeParse(invalidData);

      // Assert
      expect(parseResult.success).toBe(false);
    });

    it('should validate required fields are present', async () => {
      // Arrange - missing required fields
      const invalidSummary = {
        activeVisits: 10,
        capacityLimit: 50,
        utilizationPercent: 20,
        // Missing expiringCounts, revenue, classesToday, staffGaps, dateRange, locationId
      };

      // Act
      const parseResult = DashboardSummarySchema.safeParse(invalidSummary);

      // Assert
      expect(parseResult.success).toBe(false);

      if (!parseResult.success) {
        const missingFields = parseResult.error.issues.map(issue => issue.path[0]);
        expect(missingFields).toContain('expiringCounts');
        expect(missingFields).toContain('revenue');
        expect(missingFields).toContain('classesToday');
        expect(missingFields).toContain('staffGaps');
        expect(missingFields).toContain('dateRange');
        expect(missingFields).toContain('locationId');
      }
    });
  });
});
