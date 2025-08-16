import Stripe from 'stripe';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

// Initialize Stripe (only if API key is provided)
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeApiKey ? new Stripe(stripeApiKey, {
  // Use default API version to avoid type conflicts
}) : null;

export interface CheckoutSessionRequest {
  planId: string;
  companyId?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  provider: 'stripe' | 'mercadopago';
  url: string;
  sessionId: string;
}

export interface WebhookEventData {
  provider: 'stripe' | 'mercadopago';
  eventId: string;
  eventType: string;
  data: any;
}

/**
 * Create a Stripe checkout session for plan purchase
 */
export async function createStripeCheckoutSession(
  request: CheckoutSessionRequest
): Promise<CheckoutSessionResponse> {
  try {
    if (!stripe) {
      throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY');
    }

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: request.planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    if (!plan.stripePriceId) {
      throw new Error('Plan does not have Stripe price configured');
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      metadata: {
        planId: request.planId,
        companyId: request.companyId || '',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_creation: 'always',
    });

    return {
      provider: 'stripe',
      url: session.url!,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

/**
 * Apply entitlement after successful payment
 */
export async function applyEntitlement(eventData: WebhookEventData): Promise<void> {
  try {
    // Check if event already processed
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: eventData.eventId },
    });

    if (existingEvent?.processed) {
      console.log(`Event ${eventData.eventId} already processed, skipping`);
      return;
    }

    // Record webhook event
    await prisma.webhookEvent.upsert({
      where: { eventId: eventData.eventId },
      update: { processed: false },
      create: {
        provider: eventData.provider,
        eventId: eventData.eventId,
        eventType: eventData.eventType,
        processed: false,
      },
    });

    if (eventData.provider === 'stripe') {
      await processStripeWebhook(eventData);
    }

    // Mark event as processed
    await prisma.webhookEvent.update({
      where: { eventId: eventData.eventId },
      data: { processed: true },
    });

    console.log(`Successfully processed webhook event: ${eventData.eventId}`);
  } catch (error) {
    console.error('Error applying entitlement:', error);
    throw error;
  }
}

/**
 * Process Stripe webhook events
 */
async function processStripeWebhook(eventData: WebhookEventData): Promise<void> {
  const { eventType, data } = eventData;

  switch (eventType) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(data);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(data);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(data);
      break;
    default:
      console.log(`Unhandled event type: ${eventType}`);
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session: any): Promise<void> {
  const { metadata, subscription: subscriptionId, customer } = session;
  const { planId, companyId } = metadata;

  if (!planId) {
    throw new Error('Missing planId in checkout session metadata');
  }

  // Get or create company
  let company;
  if (companyId) {
    company = await prisma.company.findUnique({ where: { id: companyId } });
  }

  if (!company) {
    throw new Error('Company not found for checkout session');
  }

  // Update company plan
  await prisma.company.update({
    where: { id: company.id },
    data: { planId },
  });

  // Create subscription record
  await prisma.subscription.upsert({
    where: {
      provider_externalId: {
        provider: 'stripe',
        externalId: subscriptionId,
      },
    },
    update: {
      status: 'active',
    },
    create: {
      companyId: company.id,
      planId,
      provider: 'stripe',
      externalId: subscriptionId,
      status: 'active',
    },
  });

  console.log(`Entitlement applied for company ${company.id}, plan ${planId}`);
}

/**
 * Handle subscription changes
 */
async function handleSubscriptionChange(subscription: any): Promise<void> {
  const { id: subscriptionId, status, current_period_end, cancel_at_period_end } = subscription;

  await prisma.subscription.updateMany({
    where: {
      provider: 'stripe',
      externalId: subscriptionId,
    },
    data: {
      status: mapStripeStatus(status),
      currentPeriodEnd: current_period_end ? new Date(current_period_end * 1000) : null,
      cancelAtPeriodEnd: cancel_at_period_end || false,
    },
  });
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCanceled(subscription: any): Promise<void> {
  const { id: subscriptionId } = subscription;

  await prisma.subscription.updateMany({
    where: {
      provider: 'stripe',
      externalId: subscriptionId,
    },
    data: {
      status: 'canceled',
    },
  });

  // Optionally remove plan from company
  const sub = await prisma.subscription.findFirst({
    where: {
      provider: 'stripe',
      externalId: subscriptionId,
    },
    include: { company: true },
  });

  if (sub) {
    await prisma.company.update({
      where: { id: sub.companyId },
      data: { planId: null },
    });
  }
}

/**
 * Map Stripe subscription status to our enum
 */
function mapStripeStatus(stripeStatus: string): any {
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    trialing: 'trialing',
    unpaid: 'unpaid',
  };

  return statusMap[stripeStatus] || 'incomplete';
}

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeWebhook(payload: string, signature: string): any {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}
