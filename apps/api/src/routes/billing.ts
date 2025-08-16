import express, { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma/index.js';
import { authRequired, AuthenticatedRequest } from '../middleware/auth.js';
import { tenantRequired, TenantRequest } from '../middleware/tenant.js';
import {
  createStripeCheckoutSession,
  createStripeSetupIntent,
  getPaymentMethods,
  setDefaultPaymentMethod,
  createStripePortalSession,
  applyEntitlement,
  applyEntitlementWithTransaction,
  verifyStripeWebhook,
  CheckoutSessionRequest,
  SetupIntentRequest,
} from '../services/billing.js';

const prisma = new PrismaClient();

const router = express.Router();

// Validation schemas
const createCheckoutSessionSchema = z.object({
  planId: z.string().uuid(),
});

// POST /v1/billing/checkout/session
// Create a checkout session for plan purchase
router.post('/checkout/session', async (req: Request, res: Response) => {
  try {
    const { planId } = createCheckoutSessionSchema.parse(req.body);

    // Get company ID if user is authenticated
    let companyId: string | undefined;
    if (req.headers.authorization || req.cookies?.accessToken) {
      // Try to get authenticated user context
      try {
        // Re-run auth middleware to get user context
        const authMiddleware = authRequired();
        const tenantMiddleware = tenantRequired();
        
        await new Promise<void>((resolve, reject) => {
          authMiddleware(req as AuthenticatedRequest, res, (err) => {
            if (err) return reject(err);
            tenantMiddleware(req as TenantRequest, res, (err) => {
              if (err) return reject(err);
              resolve();
            });
          });
        });

        companyId = (req as TenantRequest).tenant?.companyId;
      } catch (error) {
        // User not authenticated, continue without company context
        console.log('User not authenticated for checkout, proceeding anonymously');
      }
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:7777';
    const sessionRequest: CheckoutSessionRequest = {
      planId,
      companyId,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/planes?canceled=true`,
    };

    const session = await createStripeCheckoutSession(sessionRequest);

    res.json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }

    console.error('Checkout session creation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    res.status(500).json({ message });
  }
});

// POST /v1/billing/stripe/setup-intent
// Create SetupIntent for saving payment methods
router.post('/stripe/setup-intent', authRequired(['owner', 'manager', 'staff']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const companyId = req.tenant?.companyId;
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    const setupIntentRequest: SetupIntentRequest = {
      companyId,
      memberId: req.body.memberId, // Optional member ID
    };

    const setupIntent = await createStripeSetupIntent(setupIntentRequest);
    res.json(setupIntent);
  } catch (error) {
    console.error('SetupIntent creation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create SetupIntent';
    res.status(500).json({ message });
  }
});

// GET /v1/billing/payment-methods
// List payment methods for the company
router.get('/payment-methods', authRequired(['owner', 'manager', 'staff']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const companyId = req.tenant?.companyId;
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    const paymentMethods = await getPaymentMethods(companyId);
    res.json({ paymentMethods });
  } catch (error) {
    console.error('Payment methods fetch error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch payment methods';
    res.status(500).json({ message });
  }
});

// POST /v1/billing/payment-methods/default
// Set default payment method
router.post('/payment-methods/default', authRequired(['owner', 'manager']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const companyId = req.tenant?.companyId;
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    const { paymentMethodId } = req.body;
    if (!paymentMethodId) {
      return res.status(400).json({ message: 'Payment method ID is required' });
    }

    const paymentMethod = await setDefaultPaymentMethod(companyId, paymentMethodId);
    res.json({ paymentMethod });
  } catch (error) {
    console.error('Set default payment method error:', error);
    const message = error instanceof Error ? error.message : 'Failed to set default payment method';
    res.status(500).json({ message });
  }
});

// POST /v1/billing/stripe/portal
// Create Stripe customer portal session
router.post('/stripe/portal', authRequired(['owner', 'manager']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const companyId = req.tenant?.companyId;
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:7777';
    const returnUrl = `${baseUrl}/admin/billing`;

    const portalSession = await createStripePortalSession(companyId, returnUrl);
    res.json(portalSession);
  } catch (error) {
    console.error('Portal session creation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create portal session';
    res.status(500).json({ message });
  }
});

// POST /v1/billing/webhook/stripe
// Handle Stripe webhook events
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const startTime = Date.now();
  let eventId = 'unknown';

  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      console.warn('[WEBHOOK] Missing stripe-signature header');
      return res.status(400).json({ message: 'Missing stripe-signature header' });
    }

    // Verify webhook signature with raw body (Buffer)
    const rawBody = req.body as Buffer;
    const event = verifyStripeWebhook(rawBody, signature);
    eventId = event.id;

    console.log(`[WEBHOOK] Received Stripe webhook: ${event.type} (${event.id})`);

    // Check for duplicate event first (before any processing)
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: event.id },
    });

    if (existingEvent?.processed) {
      console.log(`[WEBHOOK] Event ${event.id} already processed, returning success`);
      return res.json({ received: true, duplicate: true });
    }

    // Process the webhook in a transaction for data consistency
    await prisma.$transaction(async (tx) => {
      // Create or update webhook event record (idempotency)
      await tx.webhookEvent.upsert({
        where: { eventId: event.id },
        update: {
          processed: false,
          eventType: event.type,
        },
        create: {
          provider: 'stripe',
          eventId: event.id,
          eventType: event.type,
          processed: false,
        },
      });

      // Process the webhook with transaction context
      await applyEntitlementWithTransaction(tx, {
        provider: 'stripe',
        eventId: event.id,
        eventType: event.type,
        data: event.data.object,
      });

      // Mark event as processed
      await tx.webhookEvent.update({
        where: { eventId: event.id },
        data: { processed: true },
      });
    });

    const processingTime = Date.now() - startTime;
    console.log(`[WEBHOOK] Successfully processed ${event.type} (${event.id}) in ${processingTime}ms`);

    res.json({ received: true, eventId: event.id, processingTimeMs: processingTime });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[WEBHOOK] Error processing webhook ${eventId} after ${processingTime}ms:`, error);

    // Return appropriate status codes
    if (error instanceof Error) {
      if (error.message.includes('Invalid webhook signature')) {
        return res.status(401).json({ message: 'Invalid webhook signature' });
      }
      if (error.message.includes('Stripe not configured')) {
        return res.status(500).json({ message: 'Webhook configuration error' });
      }
    }

    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    res.status(400).json({ message, eventId });
  }
});

// GET /v1/billing/subscription
// Get current subscription for authenticated company
router.get('/subscription', authRequired(['owner', 'manager']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const { companyId } = req.tenant!;

    const subscription = await prisma.subscription.findFirst({
      where: { companyId },
      include: {
        plan: {
          select: {
            id: true,
            code: true,
            name: true,
            priceMxnCents: true,
            billingCycle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    res.json({ subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /v1/billing/subscription/cancel
// Cancel current subscription
router.post('/subscription/cancel', authRequired(['owner']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const { companyId } = req.tenant!;

    const subscription = await prisma.subscription.findFirst({
      where: { 
        companyId,
        status: 'active',
      },
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    // For now, just mark as canceled in our database
    // In production, you'd also cancel with the payment provider
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { 
        status: 'canceled',
        cancelAtPeriodEnd: true,
      },
    });

    // Remove plan from company
    await prisma.company.update({
      where: { id: companyId },
      data: { planId: null },
    });

    res.json({ message: 'Subscription canceled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /v1/billing/invoices
// Get billing history for authenticated company
router.get('/invoices', authRequired(['owner', 'manager']), tenantRequired(), async (req: TenantRequest, res: Response) => {
  try {
    const { companyId } = req.tenant!;
    const { limit = '20', offset = '0' } = req.query;

    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const offsetNum = parseInt(offset as string, 10);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { companyId },
        include: {
          payments: {
            select: {
              id: true,
              provider: true,
              status: true,
              paidMxnCents: true,
              createdAt: true,
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
        take: limitNum,
        skip: offsetNum,
      }),
      prisma.invoice.count({ where: { companyId } }),
    ]);

    res.json({
      invoices,
      total,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
