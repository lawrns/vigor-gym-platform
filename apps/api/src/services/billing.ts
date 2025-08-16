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

export interface SetupIntentRequest {
  companyId: string;
  memberId?: string;
}

export interface SetupIntentResponse {
  clientSecret: string;
  setupIntentId: string;
}

/**
 * Create a Stripe SetupIntent for saving payment methods
 */
export async function createStripeSetupIntent(request: SetupIntentRequest): Promise<SetupIntentResponse> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    // Find or create Stripe customer
    const company = await prisma.company.findUnique({
      where: { id: request.companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Create or get Stripe customer
    let customerId: string;

    // Check if company already has a Stripe customer ID (we'll add this field later if needed)
    // For now, create a new customer each time or search by email
    const customers = await stripe.customers.list({
      email: company.billingEmail,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: company.billingEmail,
        name: company.name,
        metadata: {
          companyId: company.id,
        },
      });
      customerId = customer.id;
    }

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        companyId: request.companyId,
        memberId: request.memberId || '',
      },
    });

    return {
      clientSecret: setupIntent.client_secret!,
      setupIntentId: setupIntent.id,
    };
  } catch (error) {
    console.error('Error creating Stripe SetupIntent:', error);
    throw new Error('Failed to create SetupIntent');
  }
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
    case 'payment_method.attached':
      await handlePaymentMethodAttached(data);
      break;
    case 'customer.updated':
      await handleCustomerUpdated(data);
      break;
    case 'invoice.created':
    case 'invoice.updated':
    case 'invoice.paid':
      await handleInvoiceChange(data);
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
 * Get payment methods for a company
 */
export async function getPaymentMethods(companyId: string) {
  return await prisma.paymentMethod.findMany({
    where: { companyId },
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(companyId: string, paymentMethodId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    // First, unset all current default payment methods for this company
    await prisma.paymentMethod.updateMany({
      where: { companyId, isDefault: true },
      data: { isDefault: false },
    });

    // Set the new default
    const paymentMethod = await prisma.paymentMethod.update({
      where: { id: paymentMethodId, companyId },
      data: { isDefault: true },
    });

    // Also update in Stripe if we have the Stripe payment method ID
    if (paymentMethod.stripePaymentMethodId) {
      // Get the customer ID from the company
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (company) {
        const customers = await stripe.customers.list({
          email: company.billingEmail,
          limit: 1,
        });

        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;

          // Attach payment method to customer and set as default
          await stripe.paymentMethods.attach(paymentMethod.stripePaymentMethodId, {
            customer: customerId,
          });

          await stripe.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: paymentMethod.stripePaymentMethodId,
            },
          });
        }
      }
    }

    return paymentMethod;
  } catch (error) {
    console.error('Error setting default payment method:', error);
    throw new Error('Failed to set default payment method');
  }
}

/**
 * Create Stripe customer portal session
 */
export async function createStripePortalSession(companyId: string, returnUrl: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Find Stripe customer
    const customers = await stripe.customers.list({
      email: company.billingEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      throw new Error('No Stripe customer found for this company');
    }

    const customerId = customers.data[0].id;

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return {
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating Stripe portal session:', error);
    throw new Error('Failed to create portal session');
  }
}

/**
 * Handle payment method attached webhook
 */
async function handlePaymentMethodAttached(paymentMethod: any): Promise<void> {
  try {
    const { id: stripePaymentMethodId, customer, card, type } = paymentMethod;

    // Find the company by customer ID
    const company = await findCompanyByStripeCustomer(customer);
    if (!company) {
      console.log(`No company found for Stripe customer: ${customer}`);
      return;
    }

    // Upsert payment method in database
    await prisma.paymentMethod.upsert({
      where: { stripePaymentMethodId },
      update: {
        type: type as any,
        brand: card?.brand || null,
        last4: card?.last4 || null,
      },
      create: {
        companyId: company.id,
        memberId: null, // We can associate with member later if needed
        type: type as any,
        brand: card?.brand || null,
        last4: card?.last4 || null,
        stripePaymentMethodId,
        isDefault: false,
      },
    });

    console.log(`Payment method ${stripePaymentMethodId} saved for company ${company.id}`);
  } catch (error) {
    console.error('Error handling payment method attached:', error);
  }
}

/**
 * Handle customer updated webhook
 */
async function handleCustomerUpdated(customer: any): Promise<void> {
  try {
    const { id: customerId, invoice_settings } = customer;

    // If there's a default payment method, update our records
    if (invoice_settings?.default_payment_method) {
      const company = await findCompanyByStripeCustomer(customerId);
      if (company) {
        // Unset all current defaults
        await prisma.paymentMethod.updateMany({
          where: { companyId: company.id, isDefault: true },
          data: { isDefault: false },
        });

        // Set the new default
        await prisma.paymentMethod.updateMany({
          where: {
            companyId: company.id,
            stripePaymentMethodId: invoice_settings.default_payment_method
          },
          data: { isDefault: true },
        });

        console.log(`Updated default payment method for company ${company.id}`);
      }
    }
  } catch (error) {
    console.error('Error handling customer updated:', error);
  }
}

/**
 * Handle invoice events
 */
async function handleInvoiceChange(invoice: any): Promise<void> {
  try {
    const { id: invoiceId, customer, status, amount_paid, currency } = invoice;

    const company = await findCompanyByStripeCustomer(customer);
    if (!company) {
      console.log(`No company found for Stripe customer: ${customer}`);
      return;
    }

    // Update or create invoice record
    await prisma.invoice.upsert({
      where: { cfdiUuid: invoiceId }, // Using cfdiUuid as unique identifier for now
      update: {
        status: mapStripeInvoiceStatus(status),
        totalMxnCents: amount_paid || 0,
        issuedAt: status === 'paid' ? new Date() : null,
      },
      create: {
        companyId: company.id,
        cfdiUuid: invoiceId,
        status: mapStripeInvoiceStatus(status),
        totalMxnCents: amount_paid || 0,
        issuedAt: status === 'paid' ? new Date() : null,
      },
    });

    console.log(`Invoice ${invoiceId} updated for company ${company.id}`);
  } catch (error) {
    console.error('Error handling invoice change:', error);
  }
}

/**
 * Helper function to find company by Stripe customer ID
 */
async function findCompanyByStripeCustomer(customerId: string) {
  if (!stripe) return null;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;

    const companyId = (customer as any).metadata?.companyId;
    if (companyId) {
      return await prisma.company.findUnique({ where: { id: companyId } });
    }

    // Fallback: find by email
    if ((customer as any).email) {
      return await prisma.company.findFirst({
        where: { billingEmail: (customer as any).email },
      });
    }

    return null;
  } catch (error) {
    console.error('Error finding company by Stripe customer:', error);
    return null;
  }
}

/**
 * Map Stripe invoice status to our enum
 */
function mapStripeInvoiceStatus(stripeStatus: string): 'draft' | 'issued' | 'paid' | 'void' {
  switch (stripeStatus) {
    case 'draft': return 'draft';
    case 'open': return 'issued';
    case 'paid': return 'paid';
    case 'void': return 'void';
    case 'uncollectible': return 'void';
    default: return 'draft';
  }
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
