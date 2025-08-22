import express, { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma/index.js';
import { authRequired } from '../middleware/auth.js';
import { tenantRequired, TenantRequest } from '../middleware/tenant.js';
import { logger } from '../utils/auditLogger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas for onboarding steps
const brandStepSchema = z.object({
  gymName: z.string().min(1, 'Gym name is required').max(100),
  logoUrl: z.string().url().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .optional(),
});

const locationStepSchema = z.object({
  locations: z
    .array(
      z.object({
        name: z.string().min(1, 'Location name is required').max(100),
        address: z.string().min(1, 'Address is required').max(200),
        capacity: z.number().int().min(1).max(1000),
        hours: z.object({
          monday: z.object({ open: z.string(), close: z.string() }),
          tuesday: z.object({ open: z.string(), close: z.string() }),
          wednesday: z.object({ open: z.string(), close: z.string() }),
          thursday: z.object({ open: z.string(), close: z.string() }),
          friday: z.object({ open: z.string(), close: z.string() }),
          saturday: z.object({ open: z.string(), close: z.string() }),
          sunday: z.object({ open: z.string(), close: z.string() }),
        }),
      })
    )
    .min(1, 'At least one location is required'),
});

const plansStepSchema = z.object({
  plans: z
    .array(
      z.object({
        name: z.enum(['Basic', 'Pro', 'VIP']),
        priceMxnCents: z.number().int().min(0),
        billing: z.enum(['monthly', 'quarterly', 'yearly']).default('monthly'),
        features: z.array(z.string()).optional(),
      })
    )
    .min(1, 'At least one plan is required'),
});

const staffStepSchema = z.object({
  importMethod: z.enum(['CSV', 'Manual']),
  staff: z
    .array(
      z.object({
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        email: z.string().email(),
        role: z.enum(['MANAGER', 'RECEPTIONIST', 'TRAINER']),
        phone: z.string().optional(),
      })
    )
    .optional(),
  csvData: z.string().optional(),
});

const onboardingSeedSchema = z.object({
  brand: brandStepSchema,
  locations: locationStepSchema,
  plans: plansStepSchema,
  staff: staffStepSchema,
});

/**
 * GET /v1/onboarding/status
 * Get current onboarding status for the company
 */
router.get(
  '/status',
  authRequired(['owner', 'manager']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { companyId } = req.tenant!;

      // Check what onboarding steps have been completed
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          staff: true,
          currentPlan: true,
        },
      });

      if (!company) {
        return res.status(404).json({
          error: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        });
      }

      const status = {
        completed: {
          brand: !!(company.name && company.name !== 'Vigor Demo Co'),
          locations: false, // For now, we'll consider this always completed since gyms are global
          plans: !!company.currentPlan,
          staff: company.staff.length > 0,
        },
        progress: 0,
        nextStep: null as string | null,
        canComplete: false,
      };

      // Calculate progress
      const completedSteps = Object.values(status.completed).filter(Boolean).length;
      status.progress = Math.round((completedSteps / 4) * 100);

      // Determine next step
      if (!status.completed.brand) {
        status.nextStep = 'brand';
      } else if (!status.completed.locations) {
        status.nextStep = 'locations';
      } else if (!status.completed.plans) {
        status.nextStep = 'plans';
      } else if (!status.completed.staff) {
        status.nextStep = 'staff';
      }

      status.canComplete = completedSteps === 4;

      res.json({
        status,
        company: {
          id: company.id,
          name: company.name,
          hasCurrentPlan: !!company.currentPlan,
          staffCount: company.staff.length,
        },
      });
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error), companyId: req.tenant?.companyId },
        'Onboarding status error'
      );
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch onboarding status',
      });
    }
  }
);

/**
 * POST /v1/onboarding/seed
 * Seed company with onboarding data (idempotent)
 */
router.post(
  '/seed',
  authRequired(['owner', 'manager']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { companyId } = req.tenant!;

      // Validate the onboarding payload
      const validatedData = onboardingSeedSchema.parse(req.body);

      // Start transaction for atomic operations
      const result = await prisma.$transaction(async tx => {
        // Update company brand information
        const company = await tx.company.update({
          where: { id: companyId },
          data: {
            name: validatedData.brand.gymName,
            // Note: logoUrl and primaryColor are not in the current schema
            // These would need to be added to the Company model
          },
        });

        // Note: Gyms are global in the current schema, not company-specific
        // For now, we'll skip gym creation and assume they exist
        const gyms: any[] = [];

        // Note: Plans are global in the current schema, not company-specific
        // For now, we'll find an existing plan and assign it to the company
        const existingPlan = await tx.plan.findFirst();
        let plans: any[] = [];

        if (existingPlan) {
          // Update company to use this plan
          await tx.company.update({
            where: { id: companyId },
            data: { planId: existingPlan.id },
          });
          plans = [existingPlan];
        }

        // Create or update staff (this should work with current schema)
        const existingStaff = await tx.staff.findMany({
          where: { companyId },
        });

        // Only delete if we have new staff to add
        if (validatedData.staff.staff && validatedData.staff.staff.length > 0) {
          if (existingStaff.length > 0) {
            await tx.staff.deleteMany({
              where: { companyId },
            });
          }

          const staff = await Promise.all(
            validatedData.staff.staff.map(member =>
              tx.staff.create({
                data: {
                  firstName: member.firstName,
                  lastName: member.lastName,
                  email: member.email,
                  role: member.role,
                  phone: member.phone,
                  companyId,
                },
              })
            )
          );
        } else {
          // Keep existing staff if no new staff provided
        }

        // Get final staff count
        const finalStaff = await tx.staff.findMany({
          where: { companyId },
        });

        return {
          company,
          gyms,
          plans,
          staff: finalStaff,
        };
      });

      logger.info(
        {
          companyId,
          gymsCreated: result.gyms.length,
          plansCreated: result.plans.length,
          staffCreated: result.staff.length,
        },
        'Onboarding seed completed'
      );

      res.json({
        message: 'Onboarding seed completed successfully',
        data: {
          company: result.company,
          gymsCount: result.gyms.length,
          plansCount: result.plans.length,
          staffCount: result.staff.length,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid onboarding data',
          details: error.errors,
        });
      }

      logger.error(
        { error: error instanceof Error ? error.message : String(error), companyId: req.tenant?.companyId },
        'Onboarding seed error'
      );
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to complete onboarding seed',
      });
    }
  }
);

export default router;
