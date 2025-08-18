import { test, expect } from '@playwright/test';

// Test data
const TEST_DEVICE = {
  name: 'E2E Test Kiosk',
  locationId: null
};

const TEST_MEMBER = {
  firstName: 'Test',
  lastName: 'Member',
  email: 'test.member@e2e.test'
};

const TEST_GYM = {
  name: 'E2E Test Gym',
  city: 'Test City',
  state: 'Test State'
};

let deviceCredentials: { deviceId: string; deviceSecret: string } | null = null;
let deviceToken: string | null = null;
let adminToken: string | null = null;
let testMemberId: string | null = null;
let testGymId: string | null = null;

test.describe('Device Scan Flow E2E', () => {
  test.beforeAll(async ({ request }) => {
    // Setup test data
    await setupTestData(request);
  });

  test.afterAll(async ({ request }) => {
    // Cleanup test data
    await cleanupTestData(request);
  });

  test('Complete device scan lifecycle', async ({ page, request }) => {
    // Step 1: Device Authentication
    await test.step('Device authenticates and gets JWT', async () => {
      const response = await request.post('/api/proxy/devices/auth', {
        data: {
          deviceId: deviceCredentials!.deviceId,
          deviceSecret: deviceCredentials!.deviceSecret
        }
      });

      expect(response.status()).toBe(200);
      const authData = await response.json();
      expect(authData.deviceToken).toBeTruthy();
      expect(authData.expiresIn).toBe(86400); // 24 hours
      
      deviceToken = authData.deviceToken;
    });

    // Step 2: Kiosk Login
    await test.step('Kiosk device login flow', async () => {
      await page.goto('/kiosk');
      
      // Should show device login form
      await expect(page.getByText('Device Login')).toBeVisible();
      
      // Fill device credentials
      await page.fill('[data-testid="device-id-input"]', deviceCredentials!.deviceId);
      await page.fill('[data-testid="device-secret-input"]', deviceCredentials!.deviceSecret);
      
      // Submit login
      await page.click('[data-testid="device-login-submit"]');
      
      // Should proceed to config or scan screen
      await expect(page.getByText('Select Location')).toBeVisible();
      
      // Select gym location
      await page.click(`[data-testid="gym-option-${testGymId}"]`);
      await page.click('[data-testid="config-continue"]');
      
      // Should reach scan screen
      await expect(page.getByText('Member Check-in')).toBeVisible();
      await expect(page.getByTestId('kiosk-status')).toHaveText('ONLINE');
    });

    // Step 3: Member Scan and Visit Creation
    let visitId: string;
    await test.step('Scan member and create visit', async () => {
      // Switch to manual input mode
      await page.click('[data-testid="scan-mode-manual"]');
      
      // Enter member ID
      await page.fill('[data-testid="member-id-input"]', testMemberId!);
      
      // Submit scan
      await page.click('[data-testid="scan-submit"]');
      
      // Should show success screen
      await expect(page.getByText('Welcome!')).toBeVisible();
      await expect(page.getByText('Check-in successful')).toBeVisible();
      await expect(page.getByText(`${TEST_MEMBER.firstName} ${TEST_MEMBER.lastName}`)).toBeVisible();
      
      // Extract visit ID from success response (for later checkout test)
      const visitResponse = await request.get('/api/proxy/visits/today');
      const visitsData = await visitResponse.json();
      visitId = visitsData.visits[0]?.id;
      expect(visitId).toBeTruthy();
    });

    // Step 4: Duplicate Scan Prevention
    await test.step('Duplicate scan within 5 minutes is blocked', async () => {
      // Wait for auto-return to scan screen
      await page.waitForTimeout(5000);
      await expect(page.getByText('Member Check-in')).toBeVisible();
      
      // Try to scan same member again
      await page.fill('[data-testid="member-id-input"]', testMemberId!);
      await page.click('[data-testid="scan-submit"]');
      
      // Should show error
      await expect(page.getByText('Check-in Failed')).toBeVisible();
      await expect(page.getByText('Member is already checked in')).toBeVisible();
    });

    // Step 5: SSE Counter Update Validation
    await test.step('Dashboard SSE counter updates', async () => {
      // Open dashboard in new tab
      const dashboardPage = await page.context().newPage();
      await dashboardPage.goto('/dashboard');
      
      // Wait for dashboard to load
      await expect(dashboardPage.getByText('Today\'s Check-ins')).toBeVisible();
      
      // Get initial count
      const initialCountElement = dashboardPage.locator('[data-testid="today-checkins-count"]');
      const initialCount = parseInt(await initialCountElement.textContent() || '0');
      
      // Perform another check-in with different member
      const secondMemberId = await createTestMember(request, {
        firstName: 'Second',
        lastName: 'Member',
        email: 'second.member@e2e.test'
      });
      
      // Go back to kiosk and scan second member
      await page.fill('[data-testid="member-id-input"]', secondMemberId);
      await page.click('[data-testid="scan-submit"]');
      
      // Wait for success
      await expect(page.getByText('Welcome!')).toBeVisible();
      
      // Verify dashboard counter increased within 2 seconds
      await expect(initialCountElement).toHaveText((initialCount + 1).toString(), { timeout: 2000 });
      
      await dashboardPage.close();
    });

    // Step 6: Checkout and Duration Validation
    await test.step('Checkout sets duration >= 1 minute', async () => {
      // Wait at least 1 minute for valid duration
      await page.waitForTimeout(61000);
      
      // Checkout via API (simulating device checkout)
      const checkoutResponse = await request.post('/api/proxy/checkins/checkout', {
        headers: {
          'Authorization': `Bearer ${deviceToken}`
        },
        data: {
          visitId: visitId
        }
      });
      
      expect(checkoutResponse.status()).toBe(200);
      const checkoutData = await checkoutResponse.json();
      expect(checkoutData.visit.durationMinutes).toBeGreaterThanOrEqual(1);
      expect(checkoutData.visit.checkOut).toBeTruthy();
    });
  });

  test('Network error handling and retry logic', async ({ page, request }) => {
    await test.step('Handles network failures gracefully', async () => {
      await page.goto('/kiosk');
      
      // Login to kiosk
      await page.fill('[data-testid="device-id-input"]', deviceCredentials!.deviceId);
      await page.fill('[data-testid="device-secret-input"]', deviceCredentials!.deviceSecret);
      await page.click('[data-testid="device-login-submit"]');
      
      // Navigate to scan screen
      await page.click(`[data-testid="gym-option-${testGymId}"]`);
      await page.click('[data-testid="config-continue"]');
      
      // Simulate network offline
      await page.context().setOffline(true);
      
      // Try to scan - should show offline error
      await page.click('[data-testid="scan-mode-manual"]');
      await page.fill('[data-testid="member-id-input"]', testMemberId!);
      await page.click('[data-testid="scan-submit"]');
      
      await expect(page.getByText('Device is offline')).toBeVisible();
      
      // Restore network
      await page.context().setOffline(false);
      
      // Retry should work
      await page.click('[data-testid="scan-submit"]');
      await expect(page.getByText('Welcome!')).toBeVisible();
    });
  });
});

// Helper functions
async function setupTestData(request: any) {
  // Get admin token
  const authResponse = await request.post('/api/auth/login', {
    data: {
      email: 'admin@testgym.mx',
      password: 'TestPassword123!'
    }
  });
  
  if (authResponse.status() === 200) {
    const authData = await authResponse.json();
    adminToken = authData.token;
  }

  // Create test gym
  const gymResponse = await request.post('/api/proxy/gyms', {
    headers: { 'Authorization': `Bearer ${adminToken}` },
    data: TEST_GYM
  });
  
  if (gymResponse.status() === 201) {
    const gymData = await gymResponse.json();
    testGymId = gymData.gym.id;
  }

  // Create test member
  testMemberId = await createTestMember(request, TEST_MEMBER);

  // Register test device
  const deviceResponse = await request.post('/api/proxy/devices/register', {
    headers: { 'Authorization': `Bearer ${adminToken}` },
    data: TEST_DEVICE
  });
  
  if (deviceResponse.status() === 201) {
    const deviceData = await deviceResponse.json();
    deviceCredentials = {
      deviceId: deviceData.device.id,
      deviceSecret: deviceData.deviceSecret
    };
  }
}

async function createTestMember(request: any, memberData: typeof TEST_MEMBER): Promise<string> {
  const memberResponse = await request.post('/api/proxy/members', {
    headers: { 'Authorization': `Bearer ${adminToken}` },
    data: memberData
  });
  
  if (memberResponse.status() === 201) {
    const member = await memberResponse.json();
    
    // Create active membership
    const membershipResponse = await request.post('/api/proxy/memberships', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        memberId: member.member.id,
        planId: 'test-plan-id',
        status: 'active',
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      }
    });
    
    return member.member.id;
  }
  
  throw new Error('Failed to create test member');
}

async function cleanupTestData(request: any) {
  // Cleanup is handled by test reset endpoint
  if (process.env.ENABLE_TEST_ROUTES === 'true') {
    await request.post('/api/proxy/test/reset', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
  }
}
