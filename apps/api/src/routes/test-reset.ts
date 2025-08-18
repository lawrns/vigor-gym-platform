import { Router } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * Test-only route to reset visits state between tests
 * Only available in test environment for safety
 */
router.post('/visits/reset', async (_req, res) => {
  if (process.env.NODE_ENV !== 'test' && process.env.ENABLE_TEST_ROUTES !== 'true') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    // Delete all open visits (not checked out)
    const deletedCount = await prisma.visit.deleteMany({
      where: {
        checkOut: null
      }
    });

    console.log(`🧹 Test reset: Deleted ${deletedCount.count} open visits`);

    res.status(200).json({
      ok: true,
      deletedCounts: {
        visits: deletedCount.count
      },
      message: 'Open visits cleared for testing'
    });
  } catch (error) {
    console.error('❌ Test reset failed:', error);
    res.status(500).json({
      error: 'Reset failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test-only route to reset billing state between tests
 * Only available in test environment for safety
 */
router.post('/billing/reset', async (_req, res) => {
  if (process.env.NODE_ENV !== 'test' && process.env.ENABLE_TEST_ROUTES !== 'true' && process.env.E2E_MODE !== 'true') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    // Delete webhook events and test subscriptions
    const webhookResult = await prisma.webhookEvent.deleteMany({});
    const subscriptionResult = await prisma.subscription.deleteMany({
      where: {
        // Only delete test subscriptions or those without real Stripe IDs
        OR: [
          { externalId: { startsWith: 'sub_test_' } },
          { externalId: { startsWith: 'cs_test_' } },
          { externalId: { startsWith: 'test_' } }
        ]
      }
    });

    console.log(`🧹 Billing reset: Deleted ${webhookResult.count} webhook events, ${subscriptionResult.count} test subscriptions`);
    res.status(200).json({
      ok: true,
      deletedCounts: {
        webhookEvents: webhookResult.count,
        subscriptions: subscriptionResult.count
      },
      message: `Deleted ${webhookResult.count} webhook events and ${subscriptionResult.count} test subscriptions`
    });
  } catch (error) {
    console.error('❌ Billing reset failed:', error);
    res.status(500).json({
      error: 'Billing reset failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test-only route to reset all test data between tests
 * Only available in test environment for safety
 */
router.post('/reset', async (_req, res) => {
  if (process.env.NODE_ENV !== 'test' && process.env.ENABLE_TEST_ROUTES !== 'true') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    // Reset visits
    const visitsResult = await prisma.visit.deleteMany({
      where: {
        checkOut: null
      }
    });

    // Reset billing data
    const webhookResult = await prisma.webhookEvent.deleteMany({});
    const subscriptionResult = await prisma.subscription.deleteMany({
      where: {
        OR: [
          { externalId: { startsWith: 'sub_test_' } },
          { externalId: { startsWith: 'cs_test_' } },
          { externalId: { startsWith: 'test_' } }
        ]
      }
    });

    const deletedCounts = {
      visits: visitsResult.count,
      webhookEvents: webhookResult.count,
      subscriptions: subscriptionResult.count
    };

    console.log(`🧹 Full test reset: Deleted ${JSON.stringify(deletedCounts)}`);

    res.status(200).json({
      ok: true,
      deletedCounts,
      message: 'All test data cleared'
    });
  } catch (error) {
    console.error('❌ Full test reset failed:', error);
    res.status(500).json({
      error: 'Reset failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
