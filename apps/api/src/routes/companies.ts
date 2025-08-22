import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authRequired, AuthenticatedRequest } from '../middleware/auth.js';
import { tenantRequired, TenantRequest, logTenantAction } from '../middleware/tenant.js';

const router = Router();

// We'll inject the prisma instance from the main app
let prisma: any;

export function setPrismaInstance(prismaInstance: any) {
  prisma = prismaInstance;
}

// Validation schemas
const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  rfc: z.string().regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'Invalid RFC format'),
  billingEmail: z.string().email('Invalid billing email format'),
  timezone: z.string().default('America/Mexico_City'),
  industry: z.string().optional(),
});

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  billingEmail: z.string().email().optional(),
  timezone: z.string().optional(),
  industry: z.string().optional(),
});

// POST /v1/companies - Create a new company
router.post('/', authRequired(['owner']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createCompanySchema.parse(req.body);

    // Check if RFC already exists
    const existingCompany = await prisma.company.findUnique({
      where: { rfc: validatedData.rfc.toUpperCase() },
    });

    if (existingCompany) {
      return res.status(409).json({ message: 'RFC already registered' });
    }

    // Create company in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: validatedData.name,
          rfc: validatedData.rfc.toUpperCase(),
          billingEmail: validatedData.billingEmail.toLowerCase(),
          timezone: validatedData.timezone,
          industry: validatedData.industry,
        },
      });

      // Update current user to link to this company
      await tx.user.update({
        where: { id: req.user!.id },
        data: { companyId: company.id },
      });

      return company;
    });

    // Log audit trail
    await logTenantAction(
      prisma,
      req as TenantRequest,
      'company.created',
      'company',
      result.id,
      undefined,
      {
        name: result.name,
        rfc: result.rfc,
        billingEmail: result.billingEmail,
      },
      {
        companyName: result.name,
        rfc: result.rfc,
      }
    );

    res.status(201).json({
      company: {
        id: result.id,
        name: result.name,
        rfc: result.rfc,
        billingEmail: result.billingEmail,
        timezone: result.timezone,
        industry: result.industry,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Create company error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /v1/companies/me - Get current user's company
router.get('/me', authRequired(), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    if (!req.tenant!.companyId) {
      return res.status(404).json({ message: 'User has no company associated' });
    }

    const company = await prisma.company.findUnique({
      where: { id: req.tenant!.companyId },
      include: {
        _count: {
          select: {
            users: true,
            members: true,
          },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({
      company: {
        id: company.id,
        name: company.name,
        rfc: company.rfc,
        billingEmail: company.billingEmail,
        timezone: company.timezone,
        industry: company.industry,
        createdAt: company.createdAt,
        stats: {
          users: company._count.users,
          members: company._count.members,
        },
      },
    });
  } catch (error) {
    console.error('Get current company error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /v1/companies/:id - Get company details
router.get('/:id', authRequired(), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user has access to this company (tenant middleware already validates this)
    if (req.tenant!.companyId !== id) {
      return res.status(403).json({ message: 'Access denied to this company' });
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            members: true,
          },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({
      company: {
        id: company.id,
        name: company.name,
        rfc: company.rfc,
        billingEmail: company.billingEmail,
        timezone: company.timezone,
        industry: company.industry,
        createdAt: company.createdAt,
        stats: {
          users: company._count.users,
          members: company._count.members,
        },
      },
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /v1/companies/:id - Update company details
router.patch(
  '/:id',
  authRequired(['owner', 'manager']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateCompanySchema.parse(req.body);

      // Check if user has access to this company (tenant middleware already validates this)
      if (req.tenant!.companyId !== id) {
        return res.status(403).json({ message: 'Access denied to this company' });
      }

      // Get current company data for audit log
      const currentCompany = await prisma.company.findUnique({
        where: { id },
      });

      if (!currentCompany) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Update company
      const updatedCompany = await prisma.company.update({
        where: { id },
        data: validatedData,
      });

      // Log audit trail
      await logTenantAction(
        prisma,
        req,
        'company.updated',
        'company',
        id,
        {
          name: currentCompany.name,
          billingEmail: currentCompany.billingEmail,
          timezone: currentCompany.timezone,
          industry: currentCompany.industry,
        },
        validatedData
      );

      res.json({
        company: {
          id: updatedCompany.id,
          name: updatedCompany.name,
          rfc: updatedCompany.rfc,
          billingEmail: updatedCompany.billingEmail,
          timezone: updatedCompany.timezone,
          industry: updatedCompany.industry,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Update company error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;
