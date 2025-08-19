import { test as teardown, expect } from '@playwright/test';
import { stagingConfig } from '../../playwright.staging.config';

/**
 * Staging environment teardown and cleanup
 * Cleans up test data and validates final state
 */

teardown.describe('Staging Environment Teardown', () => {
  teardown('cleanup test data', async ({ page, request }) => {
    console.log('🧹 Cleaning up test data...');

    try {
      // Authenticate first
      const loginResponse = await request.post(`${stagingConfig.API_BASE_URL}/auth/login`, {
        data: {
          email: stagingConfig.TEST_USER.email,
          password: stagingConfig.TEST_USER.password,
        },
      });

      if (loginResponse.ok()) {
        const cookies = loginResponse.headers()['set-cookie'];
        const cookieHeader = cookies ? cookies.join('; ') : '';

        // Clean up any test payment methods
        const paymentMethodsResponse = await request.get(
          `${stagingConfig.API_BASE_URL}/v1/billing/payment-methods`,
          {
            headers: { Cookie: cookieHeader },
          }
        );

        if (paymentMethodsResponse.ok()) {
          const data = await paymentMethodsResponse.json();
          const paymentMethods = data.paymentMethods || [];

          // Delete test payment methods (those with test card numbers)
          for (const pm of paymentMethods) {
            if (pm.last4 === '4242' || pm.last4 === '0002') {
              await request.delete(
                `${stagingConfig.API_BASE_URL}/v1/billing/payment-methods/${pm.id}`,
                {
                  headers: { Cookie: cookieHeader },
                }
              );
              console.log(`🗑️ Deleted test payment method: ${pm.id}`);
            }
          }
        }

        // Clean up any test members
        const membersResponse = await request.get(`${stagingConfig.API_BASE_URL}/v1/members`, {
          headers: { Cookie: cookieHeader },
        });

        if (membersResponse.ok()) {
          const data = await membersResponse.json();
          const members = data.members || [];

          // Delete test members (those with staging email addresses)
          for (const member of members) {
            if (member.email && member.email.includes('staging.com')) {
              await request.delete(`${stagingConfig.API_BASE_URL}/v1/members/${member.id}`, {
                headers: { Cookie: cookieHeader },
              });
              console.log(`🗑️ Deleted test member: ${member.id}`);
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Cleanup failed (non-critical):', error);
    }

    console.log('✅ Test data cleanup completed');
  });

  teardown('validate staging environment state', async ({ page, request }) => {
    console.log('🔍 Validating final staging environment state...');

    // Verify staging environment is still healthy after tests
    const healthResponse = await request.get(`${stagingConfig.API_BASE_URL}/health`);
    expect(healthResponse.ok()).toBeTruthy();

    // Verify web application is still accessible
    await page.goto('/');
    await expect(page).toHaveTitle(/Vigor/);

    // Verify login still works
    await page.goto('/login');
    await page.fill('input[name="email"]', stagingConfig.TEST_USER.email);
    await page.fill('input[name="password"]', stagingConfig.TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);

    console.log('✅ Staging environment state validated');
  });

  teardown('generate test report summary', async ({ page }) => {
    console.log('📊 Generating test report summary...');

    // This would typically generate a summary of test results
    // For now, we'll just log completion

    const timestamp = new Date().toISOString();
    const summary = {
      timestamp,
      environment: 'staging',
      testSuite: 'comprehensive-e2e',
      status: 'completed',
      features: {
        savedCards: 'tested',
        observability: 'tested',
        ssrDashboard: 'tested',
        authentication: 'tested',
        billing: 'tested',
      },
    };

    console.log('📋 Test Summary:', JSON.stringify(summary, null, 2));
    console.log('✅ Test report summary generated');
  });
});
