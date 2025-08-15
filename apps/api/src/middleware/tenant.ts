import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';

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
          message: 'User has no company associated. Please complete onboarding.' 
        });
      }

      // Check for X-Org-Id header (for future multi-org support)
      const headerOrgId = req.headers['x-org-id'] as string;

      // If X-Org-Id header is provided, validate it matches user's company
      if (headerOrgId && headerOrgId !== userCompanyId) {
        return res.status(403).json({
          message: 'Access denied to specified organization'
        });
      }

      // Set tenant context
      req.tenant = {
        companyId: userCompanyId,
        role: req.user.role,
      };

      next();
    } catch (error) {
      console.error('Tenant middleware error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

/**
 * Helper function to add tenant filtering to Prisma queries
 * Automatically adds companyId filter to prevent cross-tenant data access
 */
export function withTenantFilter(req: TenantRequest, baseWhere: any = {}) {
  if (!req.tenant?.companyId) {
    throw new Error('Tenant context not available. Ensure tenantRequired middleware is applied.');
  }

  return {
    ...baseWhere,
    companyId: req.tenant.companyId,
  };
}

/**
 * Validates that a resource belongs to the current tenant
 * Used for checking access to specific resources by ID
 */
export async function validateTenantAccess(
  prisma: any,
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
        resource = await prisma.gym.findUnique({
          where: { id: resourceId },
          select: { companyId: true },
        });
        break;
        
      case 'class':
        resource = await prisma.class.findUnique({
          where: { id: resourceId },
          include: { gym: { select: { companyId: true } } },
        });
        return resource?.gym?.companyId === req.tenant.companyId;
        
      case 'booking':
        resource = await prisma.booking.findUnique({
          where: { id: resourceId },
          include: { 
            member: { select: { companyId: true } },
            class: { include: { gym: { select: { companyId: true } } } }
          },
        });
        // Booking is valid if both member and gym belong to tenant
        return resource?.member?.companyId === req.tenant.companyId &&
               resource?.class?.gym?.companyId === req.tenant.companyId;
        
      default:
        console.warn(`Unknown resource type for tenant validation: ${resourceType}`);
        return false;
    }

    return resource?.companyId === req.tenant.companyId;
  } catch (error) {
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
      tenantRequired()(req, res, (err) => {
        if (err) return next(err);
        
        // Additional validation for partner_admin role
        if (req.user?.role === 'partner_admin') {
          // Partner admins have limited scope - they can only access their assigned gyms
          // This will be enforced in individual route handlers
          req.tenant!.role = 'partner_admin';
        }
        
        next();
      });
    } catch (error) {
      console.error('Partner tenant middleware error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

/**
 * Helper to get partner admin's accessible gym IDs
 * Partner admins can only access gyms they are assigned to
 */
export async function getPartnerGymIds(prisma: any, userId: string): Promise<string[]> {
  try {
    const partnerAssignments = await prisma.partnerAssignment.findMany({
      where: { userId },
      select: { gymId: true },
    });
    
    return partnerAssignments.map((assignment: any) => assignment.gymId);
  } catch (error) {
    console.error('Error getting partner gym IDs:', error);
    return [];
  }
}

/**
 * Audit logging helper that includes tenant context
 */
export async function logTenantAction(
  prisma: any,
  req: TenantRequest,
  action: string,
  target: string,
  entityId?: string,
  before?: any,
  after?: any,
  meta?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: req.user!.id,
        action,
        target,
        before,
        after,
        meta: {
          ...meta,
          companyId: req.tenant?.companyId,
          entityId,
        },
      },
    });
  } catch (error) {
    console.error('Error logging tenant action:', error);
    // Don't throw - audit logging shouldn't break the main flow
  }
}
