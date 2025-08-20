/**
 * API Contract Tests for Classes Today Endpoint
 * Tests the /api/classes/today route for proper zod validation and data structure
 */

import { NextRequest } from 'next/server';
import { GET } from '../../app/api/classes/today/route';
import { ClassesTodaySchema } from '@vigor/shared';

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
  getClassesToday: jest.fn(),
}));

import { getClassesToday } from '../../lib/dashboard/supabase-data-service';

const mockGetClassesToday = getClassesToday as jest.MockedFunction<typeof getClassesToday>;

describe('/api/classes/today', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path Tests', () => {
    it('should return valid classes today with all required fields', async () => {
      // Arrange
      const mockClasses = {
        classes: [
          {
            id: 'class-1',
            name: 'Morning Yoga',
            instructor: 'Maria Rodriguez',
            startTime: '08:00',
            endTime: '09:00',
            capacity: 20,
            booked: 15,
            status: 'scheduled' as const,
          },
          {
            id: 'class-2',
            name: 'HIIT Training',
            instructor: 'Carlos Mendez',
            startTime: '18:00',
            endTime: '19:00',
            capacity: 15,
            booked: 12,
            status: 'in_progress' as const,
          },
          {
            id: 'class-3',
            name: 'Evening Pilates',
            instructor: 'Ana Garcia',
            startTime: '19:30',
            endTime: '20:30',
            capacity: 18,
            booked: 8,
            status: 'scheduled' as const,
          },
        ],
        totalClasses: 3,
        totalCapacity: 53,
        totalBooked: 35,
        utilizationPercent: 66,
      };

      mockGetClassesToday.mockResolvedValue(mockClasses);

      const request = new NextRequest('http://localhost:7777/api/classes/today');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockClasses);

      // Validate against zod schema
      const parseResult = ClassesTodaySchema.safeParse(data);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        expect(parseResult.data.classes).toHaveLength(3);
        expect(parseResult.data.totalClasses).toBe(3);
        expect(parseResult.data.totalCapacity).toBe(53);
        expect(parseResult.data.totalBooked).toBe(35);
        expect(parseResult.data.utilizationPercent).toBe(66);
      }
    });

    it('should handle empty classes list', async () => {
      // Arrange
      const mockClasses = {
        classes: [],
        totalClasses: 0,
        totalCapacity: 0,
        totalBooked: 0,
        utilizationPercent: 0,
      };

      mockGetClassesToday.mockResolvedValue(mockClasses);

      const request = new NextRequest('http://localhost:7777/api/classes/today');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);

      const parseResult = ClassesTodaySchema.safeParse(data);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        expect(parseResult.data.classes).toHaveLength(0);
        expect(parseResult.data.totalClasses).toBe(0);
        expect(parseResult.data.utilizationPercent).toBe(0);
      }
    });

    it('should handle locationId parameter', async () => {
      // Arrange
      const mockClasses = {
        classes: [
          {
            id: 'class-1',
            name: 'Zumba',
            instructor: 'Sofia Lopez',
            startTime: '10:00',
            endTime: '11:00',
            capacity: 25,
            booked: 20,
            status: 'scheduled' as const,
          },
        ],
        totalClasses: 1,
        totalCapacity: 25,
        totalBooked: 20,
        utilizationPercent: 80,
      };

      mockGetClassesToday.mockResolvedValue(mockClasses);

      const request = new NextRequest(
        'http://localhost:7777/api/classes/today?locationId=gym-downtown'
      );

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      expect(mockGetClassesToday).toHaveBeenCalledWith('gym-downtown');
    });
  });

  describe('Error Path Tests', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      mockGetClassesToday.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:7777/api/classes/today');

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Failed to fetch classes');
    });

    it('should handle missing session context', async () => {
      // Arrange
      const { getSessionContext } = require('../../lib/auth/session.server');
      getSessionContext.mockImplementation(() => {
        throw new Error('No session found');
      });

      const request = new NextRequest('http://localhost:7777/api/classes/today');

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(500);
    });
  });

  describe('Data Validation Tests', () => {
    it('should reject invalid class status values', async () => {
      // Arrange
      const invalidData = {
        classes: [
          {
            id: 'class-1',
            name: 'Test Class',
            instructor: 'Test Instructor',
            startTime: '10:00',
            endTime: '11:00',
            capacity: 20,
            booked: 15,
            status: 'invalid-status', // Invalid status
          },
        ],
        totalClasses: 1,
        totalCapacity: 20,
        totalBooked: 15,
        utilizationPercent: 75,
      };

      mockGetClassesToday.mockResolvedValue(invalidData as any);

      const request = new NextRequest('http://localhost:7777/api/classes/today');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      const parseResult = ClassesTodaySchema.safeParse(data);
      expect(parseResult.success).toBe(false);

      if (!parseResult.success) {
        expect(parseResult.error.issues.some(issue => issue.path.includes('status'))).toBe(true);
      }
    });

    it('should reject negative capacity or booked values', async () => {
      // Arrange
      const invalidData = {
        classes: [
          {
            id: 'class-1',
            name: 'Test Class',
            instructor: 'Test Instructor',
            startTime: '10:00',
            endTime: '11:00',
            capacity: -5, // Invalid negative capacity
            booked: 15,
            status: 'scheduled',
          },
        ],
        totalClasses: 1,
        totalCapacity: -5,
        totalBooked: 15,
        utilizationPercent: 75,
      };

      mockGetClassesToday.mockResolvedValue(invalidData as any);

      const request = new NextRequest('http://localhost:7777/api/classes/today');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      const parseResult = ClassesTodaySchema.safeParse(data);
      expect(parseResult.success).toBe(false);
    });

    it('should validate time format', async () => {
      // Arrange
      const invalidData = {
        classes: [
          {
            id: 'class-1',
            name: 'Test Class',
            instructor: 'Test Instructor',
            startTime: '25:00', // Invalid time format
            endTime: '11:00',
            capacity: 20,
            booked: 15,
            status: 'scheduled',
          },
        ],
        totalClasses: 1,
        totalCapacity: 20,
        totalBooked: 15,
        utilizationPercent: 75,
      };

      mockGetClassesToday.mockResolvedValue(invalidData as any);

      const request = new NextRequest('http://localhost:7777/api/classes/today');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      const parseResult = ClassesTodaySchema.safeParse(data);
      expect(parseResult.success).toBe(false);
    });
  });
});
