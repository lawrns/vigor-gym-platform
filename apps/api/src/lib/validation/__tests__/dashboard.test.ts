/**
 * Dashboard Validation Tests
 *
 * Unit tests for dashboard data validation functions
 */

import { describe, it, expect } from 'vitest';
import {
  validateDashboardQuery,
  validateSSEQuery,
  validateActivityQuery,
  validateTenantAccess,
  validateDateRange,
  DashboardValidationError,
} from '../dashboard';

describe('Dashboard Validation', () => {
  const validUuid = '489ff883-138b-44a1-88db-83927b596e35';
  const invalidUuid = 'not-a-uuid';

  describe('validateDashboardQuery', () => {
    it('should validate valid dashboard query', () => {
      const result = validateDashboardQuery({
        orgId: validUuid,
        locationId: validUuid,
        range: '7d',
      });

      expect(result).toEqual({
        orgId: validUuid,
        locationId: validUuid,
        range: '7d',
      });
    });

    it('should validate query with null locationId', () => {
      const result = validateDashboardQuery({
        orgId: validUuid,
        locationId: null,
        range: '14d',
      });

      expect(result).toEqual({
        orgId: validUuid,
        locationId: null,
        range: '14d',
      });
    });

    it('should default range to 7d', () => {
      const result = validateDashboardQuery({
        orgId: validUuid,
      });

      expect(result.range).toBe('7d');
    });

    it('should throw INVALID_ORG_ID for missing orgId', () => {
      expect(() => validateDashboardQuery({})).toThrow(DashboardValidationError);

      try {
        validateDashboardQuery({});
      } catch (error) {
        expect(error).toBeInstanceOf(DashboardValidationError);
        expect((error as DashboardValidationError).code).toBe('INVALID_ORG_ID');
      }
    });

    it('should throw INVALID_ORG_ID for invalid UUID format', () => {
      expect(() =>
        validateDashboardQuery({
          orgId: invalidUuid,
        })
      ).toThrow(DashboardValidationError);

      try {
        validateDashboardQuery({ orgId: invalidUuid });
      } catch (error) {
        expect(error).toBeInstanceOf(DashboardValidationError);
        expect((error as DashboardValidationError).code).toBe('INVALID_ORG_ID');
      }
    });

    it('should throw INVALID_LOCATION_ID for invalid locationId', () => {
      expect(() =>
        validateDashboardQuery({
          orgId: validUuid,
          locationId: invalidUuid,
        })
      ).toThrow(DashboardValidationError);

      try {
        validateDashboardQuery({
          orgId: validUuid,
          locationId: invalidUuid,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(DashboardValidationError);
        expect((error as DashboardValidationError).code).toBe('INVALID_LOCATION_ID');
      }
    });

    it('should throw INVALID_RANGE for invalid range', () => {
      expect(() =>
        validateDashboardQuery({
          orgId: validUuid,
          range: 'invalid',
        })
      ).toThrow(DashboardValidationError);
    });
  });

  describe('validateSSEQuery', () => {
    it('should validate valid SSE query', () => {
      const result = validateSSEQuery({
        orgId: validUuid,
        locationId: validUuid,
      });

      expect(result).toEqual({
        orgId: validUuid,
        locationId: validUuid,
      });
    });

    it('should validate query with null locationId', () => {
      const result = validateSSEQuery({
        orgId: validUuid,
        locationId: null,
      });

      expect(result).toEqual({
        orgId: validUuid,
        locationId: null,
      });
    });

    it('should throw INVALID_ORG_ID for missing orgId', () => {
      expect(() => validateSSEQuery({})).toThrow(DashboardValidationError);
    });

    it('should throw INVALID_LOCATION_ID for invalid locationId', () => {
      expect(() =>
        validateSSEQuery({
          orgId: validUuid,
          locationId: invalidUuid,
        })
      ).toThrow(DashboardValidationError);
    });
  });

  describe('validateActivityQuery', () => {
    it('should validate valid activity query', () => {
      const result = validateActivityQuery({
        orgId: validUuid,
        locationId: validUuid,
        since: '2025-08-17T00:00:00.000Z',
        limit: '50',
      });

      expect(result).toEqual({
        orgId: validUuid,
        locationId: validUuid,
        since: '2025-08-17T00:00:00.000Z',
        limit: '50',
      });
    });

    it('should default limit to 25', () => {
      const result = validateActivityQuery({
        orgId: validUuid,
      });

      expect(result.limit).toBe('25');
    });

    it('should throw INVALID_LIMIT for limit > 100', () => {
      expect(() =>
        validateActivityQuery({
          orgId: validUuid,
          limit: '150',
        })
      ).toThrow(DashboardValidationError);

      try {
        validateActivityQuery({
          orgId: validUuid,
          limit: '150',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(DashboardValidationError);
        expect((error as DashboardValidationError).code).toBe('INVALID_LIMIT');
      }
    });

    it('should throw INVALID_LIMIT for limit < 1', () => {
      expect(() =>
        validateActivityQuery({
          orgId: validUuid,
          limit: '0',
        })
      ).toThrow(DashboardValidationError);
    });

    it('should throw INVALID_SINCE for invalid date format', () => {
      expect(() =>
        validateActivityQuery({
          orgId: validUuid,
          since: 'invalid-date',
        })
      ).toThrow(DashboardValidationError);

      try {
        validateActivityQuery({
          orgId: validUuid,
          since: 'invalid-date',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(DashboardValidationError);
        expect((error as DashboardValidationError).code).toBe('INVALID_SINCE');
      }
    });
  });

  describe('validateTenantAccess', () => {
    it('should pass for matching company IDs', () => {
      expect(() => validateTenantAccess(validUuid, validUuid)).not.toThrow();
    });

    it('should throw FORBIDDEN for mismatched company IDs', () => {
      const otherUuid = '123e4567-e89b-12d3-a456-426614174000';

      expect(() => validateTenantAccess(validUuid, otherUuid)).toThrow(DashboardValidationError);

      try {
        validateTenantAccess(validUuid, otherUuid);
      } catch (error) {
        expect(error).toBeInstanceOf(DashboardValidationError);
        expect((error as DashboardValidationError).code).toBe('FORBIDDEN');
      }
    });
  });

  describe('validateDateRange', () => {
    it('should generate date range from range parameter', () => {
      const result = validateDateRange(undefined, undefined, '7d');

      expect(result.from).toBeInstanceOf(Date);
      expect(result.to).toBeInstanceOf(Date);
      expect(result.from.getTime()).toBeLessThan(result.to.getTime());

      const diffDays = Math.ceil(
        (result.to.getTime() - result.from.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(7);
    });

    it('should use explicit dates when provided', () => {
      const from = '2025-08-10T00:00:00.000Z';
      const to = '2025-08-17T00:00:00.000Z';

      const result = validateDateRange(from, to);

      expect(result.from.toISOString()).toBe(from);
      expect(result.to.toISOString()).toBe(to);
    });

    it('should throw INVALID_RANGE for from > to', () => {
      const from = '2025-08-17T00:00:00.000Z';
      const to = '2025-08-10T00:00:00.000Z';

      expect(() => validateDateRange(from, to)).toThrow(DashboardValidationError);

      try {
        validateDateRange(from, to);
      } catch (error) {
        expect(error).toBeInstanceOf(DashboardValidationError);
        expect((error as DashboardValidationError).code).toBe('INVALID_RANGE');
        expect((error as DashboardValidationError).message).toContain('from date must be before');
      }
    });

    it('should throw INVALID_RANGE for range > 366 days', () => {
      const from = '2024-01-01T00:00:00.000Z';
      const to = '2025-01-02T00:00:00.000Z'; // 367 days

      expect(() => validateDateRange(from, to)).toThrow(DashboardValidationError);

      try {
        validateDateRange(from, to);
      } catch (error) {
        expect(error).toBeInstanceOf(DashboardValidationError);
        expect((error as DashboardValidationError).code).toBe('INVALID_RANGE');
        expect((error as DashboardValidationError).message).toContain('cannot exceed 366 days');
      }
    });

    it('should throw INVALID_RANGE for invalid date format', () => {
      expect(() => validateDateRange('invalid-date', '2025-08-17T00:00:00.000Z')).toThrow(
        DashboardValidationError
      );
    });
  });
});
