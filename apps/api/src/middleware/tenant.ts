import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { PrismaClient } from '../generated/prisma/index.js';

// Extended request interface with tenant context
export interface TenantRequest extends AuthenticatedRequest {
  tenant?: {
    companyId: string;
    role: string;
  };
}

/**
 * Tenant middleware that resolves and validates company context
 * Ensures users can only access data from their own company
 */
export function tenantRequired() {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated first
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get company ID from authenticated user
      const userCompanyId = req.user.companyId;

      if (!userCompanyId) {
        return res.status(403).json({
          message: 'User has no company associated. Please complete onboarding.',
        });
      }

      // Check for X-Org-Id header (for future multi-org support)
      const headerOrgId = req.headers['x-org-id'] as string;

      // If X-Org-Id header is provided, validate it matches user's company
      if (headerOrgId && headerOrgId !== userCompanyId) {
        return res.status(403).json({
          message: 'Access denied to specified organization',
        });
      }

      // Set tenant context
      req.tenant = {
        companyId: userCompanyId,
        role: req.user.role,
      };

      next();
    } catch (e) {
      const error = e as Error;
      console.error('Tenant middleware error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

/**
 * Helper function to add tenant filtering to Prisma queries
 * Automatically adds companyId filter to prevent cross-tenant data access
 */
export function withTenantFilter(req: TenantRequest, baseWhere: Record<string, unknown> = {}) {
  if (!req.tenant?.companyId) {
    throw new Error('Tenant context not available. Ensure tenantRequired middleware is applied.');
  }

  return {
    ...baseWhere,
    companyId: req.tenant.companyId,
  };
}

/**
 * Helper function for unique queries that validates tenant access after fetch
 * Use this for findUnique, update, delete operations that require unique inputs
 */
export function validateTenantAccess<T extends { companyId?: string }>(
  req: TenantRequest,
  resource: T | null
): T {
  if (!req.tenant?.companyId) {
    throw new Error('Tenant context not available. Ensure tenantRequired middleware is applied.');
  }

  if (!resource) {
    throw new Error('Resource not found');
  }

  if (resource.companyId !== req.tenant.companyId) {
    throw new Error('Access denied: Resource does not belong to your organization');
  }

  return resource;
}

/**
 * Validates that a resource belongs to the current tenant
 * Used for checking access to specific resources by ID
 */
export async function validateTenantResourceAccess(
  prisma: PrismaClient,
  req: TenantRequest,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  if (!req.tenant?.companyId) {
    return false;
  }

  try {
    let resource;

    switch (resourceType) {
      case 'member':
        resource = await prisma.member.findUnique({
          where: { id: resourceId },
          select: { companyId: true },
        });
        break;

      case 'membership':
        resource = await prisma.membership.findUnique({
          where: { id: resourceId },
          include: { member: { select: { companyId: true } } },
        });
        return resource?.member?.companyId === req.tenant.companyId;

      case 'gym':
        // Gyms are shared across companies, so always allow access if gym exists
        resource = await prisma.gym.findUnique({
          where: { id: resourceId },
          select: { id: true },
        });
        return !!resource;

      case 'class':
        // Classes are tied to gyms, which are shared across companies
        resource = await prisma.class.findUnique({
          where: { id: resourceId },
          select: { id: true },
        });
        return !!resource;

      case 'booking':
        resource = await prisma.booking.findUnique({
          where: { id: resourceId },
          include: {
            membership: { select: { companyId: true } },
          },
        });
        // Booking is valid if the membership belongs to tenant
        return resource?.membership?.companyId === req.tenant.companyId;

      default:
        console.warn(`Unknown resource type for tenant validation: ${resourceType}`);
        return false;
    }

    return resource?.companyId === req.tenant.companyId;
  } catch (e) {
    const error = e as Error;
    console.error(`Error validating tenant access for ${resourceType}:${resourceId}`, error);
    return false;
  }
}

/**
 * Middleware for partner admin role validation
 * Ensures partner_admin users can only access their assigned gyms
 */
export function partnerTenantRequired() {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      // First apply standard tenant validation
      tenantRequired()(req, res, err => {
        if (err) return next(err);

        // Additional validation for partner_admin role
        if (req.user?.role === 'partner_admin') {
          // Partner admins have limited scope - they can only access their assigned gyms
          // This will be enforced in individual route handlers
          req.tenant!.role = 'partner_admin';
        }

        next();
      });
    } catch (e) {
      const error = e as Error;
      console.error('Partner tenant middleware error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

/**
 * Helper to get partner admin's accessible gym IDs
 * Partner admins can only access gyms they are assigned to
 */
export async function getPartnerGymIds(prisma: PrismaClient, userId: string): Promise<string[]> {
  try {
    // TODO: Implement partner assignment logic when the table is added to schema
    // For now, return empty array as partner assignments are not implemented
    return [];
  } catch (e) {
    const error = e as Error;
    console.error('Error getting partner gym IDs:', error);
    return [];
  }
}

/**
 * Audit logging helper that includes tenant context
 */
export async function logTenantAction(
  prisma: PrismaClient,
  req: TenantRequest,
  action: string,
  target: string,
  entityId?: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>,
  meta?: Record<string, unknown>
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: req.user!.id,
        action,
        target,
        meta: {
          ...meta,
          companyId: req.tenant?.companyId,
          entityId,
          before: before ? JSON.parse(JSON.stringify(before)) : null,
          after: after ? JSON.parse(JSON.stringify(after)) : null,
        },
      },
    });
  } catch (e) {
    const error = e as Error;
    console.error('Error logging tenant action:', error);
    // Don't throw - audit logging shouldn't break the main flow
  }
}
