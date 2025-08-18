import { test, expect } from '@playwright/test';

// Test credentials
const TEST_DEVICE = {
  id: '1da7ac94-8c08-4943-8200-c71b67869dea',
  secret: '289c1fa5e0d0977d06a9f9ca6c92c56eb1da2adedb3af04216f48d69f42fb278'
};

test.describe('Kiosk Device Login', () => {
  test('should successfully authenticate device and proceed to location selection', async ({ page }) => {
    // Navigate to kiosk
    await page.goto('/kiosk');

    // Should show device login form
    await expect(page.getByText('Device Login')).toBeVisible();

    // Fill device credentials
    await page.fill('[data-testid="device-id-input"]', TEST_DEVICE.id);
    await page.fill('[data-testid="device-secret-input"]', TEST_DEVICE.secret);

    // Intercept the authentication request
    const authPromise = page.waitForResponse(response => 
      response.url().includes('/api/proxy/devices/auth') && response.status() === 200
    );

    // Submit login
    await page.click('[data-testid="device-login-submit"]');

    // Wait for successful authentication
    const authResponse = await authPromise;
    const authData = await authResponse.json();
    
    // Verify response contains device token
    expect(authData.deviceToken).toBeTruthy();
    expect(authData.device.id).toBe(TEST_DEVICE.id);

    // Should proceed to location selection or scan screen
    await expect(page.getByText('Select Location')).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid device credentials', async ({ page }) => {
    await page.goto('/kiosk');

    // Fill invalid credentials
    await page.fill('[data-testid="device-id-input"]', 'invalid-device-id');
    await page.fill('[data-testid="device-secret-input"]', 'invalid-secret');

    // Submit login
    await page.click('[data-testid="device-login-submit"]');

    // Should show error message
    await expect(page.getByText('Invalid device credentials')).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/kiosk');

    // Try to submit without filling fields
    await page.click('[data-testid="device-login-submit"]');

    // Submit button should be disabled or show validation error
    const submitButton = page.locator('[data-testid="device-login-submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/kiosk');

    // Fill valid credentials
    await page.fill('[data-testid="device-id-input"]', TEST_DEVICE.id);
    await page.fill('[data-testid="device-secret-input"]', TEST_DEVICE.secret);

    // Simulate network failure
    await page.route('/api/proxy/devices/auth', route => route.abort());

    // Submit login
    await page.click('[data-testid="device-login-submit"]');

    // Should show network error message
    await expect(page.getByText(/network error|connection/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('PWA Features', () => {
  test('should load manifest and icons without errors', async ({ page }) => {
    // Check manifest loads
    const manifestResponse = await page.goto('/manifest.json');
    expect(manifestResponse?.status()).toBe(200);

    // Check required icons load
    const iconSizes = ['64x64', '144x144', '192x192', '512x512'];
    
    for (const size of iconSizes) {
      const iconResponse = await page.goto(`/icons/icon-${size}.png`);
      expect(iconResponse?.status()).toBe(200);
    }
  });

  test('should register service worker without errors', async ({ page }) => {
    await page.goto('/kiosk');

    // Check for service worker registration
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    expect(swRegistered).toBe(true);

    // Wait a bit for service worker to register
    await page.waitForTimeout(2000);

    // Check console for service worker messages (should not have errors)
    const logs = await page.evaluate(() => {
      return (window as any).__swLogs || [];
    });

    // Should not have service worker errors
    const swErrors = logs.filter((log: any) => 
      log.includes('Service Worker') && log.includes('error')
    );
    expect(swErrors.length).toBe(0);
  });
});

test.describe('Registration Route', () => {
  test('should load /registro page successfully', async ({ page }) => {
    const response = await page.goto('/registro');
    expect(response?.status()).toBe(200);

    // Should show registration content
    await expect(page.getByText('Crea tu cuenta')).toBeVisible();
    await expect(page.getByText('Comenzar registro')).toBeVisible();
  });

  test('should navigate to actual registration form', async ({ page }) => {
    await page.goto('/registro');

    // Click the registration button
    await page.click('text=Comenzar registro');

    // Should navigate to the actual registration form
    await expect(page).toHaveURL('/register');
  });
});
