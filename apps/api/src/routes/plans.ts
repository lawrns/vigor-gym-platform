import { Router, Request, Response } from 'express';
import { authRequired } from '../middleware/auth.js';
import { tenantRequired, TenantRequest } from '../middleware/tenant.js';

const router = Router();

// We'll inject the prisma instance from the main app
let prisma: any;

export function setPrismaInstance(prismaInstance: any) {
  prisma = prismaInstance;
}

// GET /v1/plans/public - Public plans catalog (no auth required)
// TEMPORARY: Using static data while Prisma connectivity is being debugged
router.get('/public', async (_req: Request, res: Response) => {
  try {
    console.log('Public plans endpoint called - using static data temporarily');

    // Static plans data based on what we know exists in the database
    const staticPlans = [
      {
        id: 'be46d756-954d-41be-aaf9-febc744c9185',
        code: 'TP_ON',
        name: 'TP ON',
        priceType: 'fixed',
        priceMXNFrom: 499,
        billingCycle: 'monthly',
        features: [
          'Acceso básico al gimnasio',
          'Equipos estándar',
          '30 visitas por mes',
          'Horario extendido'
        ],
        limits: { monthlyVisits: 30 },
      },
      {
        id: '92990587-b94c-4c08-9d50-c1213bc8aa8f',
        code: 'TP_PRO',
        name: 'TP PRO',
        priceType: 'fixed',
        priceMXNFrom: 899,
        billingCycle: 'monthly',
        features: [
          'Acceso premium al gimnasio',
          'Todos los equipos',
          'Clases grupales incluidas',
          'Visitas ilimitadas',
          'Acceso 24/7'
        ],
        limits: { monthlyVisits: -1 },
      },
      {
        id: '77ce39d2-7bad-4b81-8c63-5bb628f2eddf',
        code: 'TP_PLUS',
        name: 'TP+',
        priceType: 'custom',
        priceMXNFrom: 1499,
        billingCycle: 'custom',
        features: [
          'Plan personalizado',
          'Entrenamiento personal',
          'Consultoría nutricional',
          'Acceso VIP',
          'Seguimiento personalizado'
        ],
        limits: { monthlyVisits: -1 },
      }
    ];

    // Set cache headers for 5 minutes (plans don't change often)
    res.set('Cache-Control', 'public, max-age=300');

    res.json({
      plans: staticPlans,
      total: staticPlans.length,
    });
  } catch (error) {
    console.error('Error fetching public plans:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /v1/plans - List all available plans (authenticated, tenant-aware)
router.get('/', authRequired(['owner', 'manager']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        priceType: true,
        priceMxnCents: true,
        billingCycle: true,
        featuresJson: true,
      },
      orderBy: [
        { priceMxnCents: 'asc' },
        { code: 'asc' }
      ]
    });

    // Transform the data for frontend consumption
    const transformedPlans = plans.map((plan: any) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      priceType: plan.priceType,
      priceMXNFrom: plan.priceMxnCents ? Math.floor(plan.priceMxnCents / 100) : null,
      billingCycle: plan.billingCycle,
      features: plan.featuresJson?.highlights || [],
      limits: plan.featuresJson?.limits || {},
    }));

    // Set cache headers for 5 minutes (plans don't change often)
    res.set('Cache-Control', 'public, max-age=300');
    
    res.json({
      plans: transformedPlans,
      total: transformedPlans.length,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
