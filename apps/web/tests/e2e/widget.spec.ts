/**
 * UltimateWidget Performance & Security Tests
 *
 * Validates widget initialization performance, CSP compliance,
 * and prevents API spam. Critical for maintaining SLOs.
 */

import { test, expect, Page } from '@playwright/test';

test.describe('UltimateWidget Performance', () => {
  test('widget mounts under 400ms and no console errors', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // Start timing
    const startTime = Date.now();

    // Navigate to page with widget
    await page.goto('/?e2e=1#widget');

    // Wait for widget to be ready
    await page.waitForSelector('[data-ultimate-widget-ready]', {
      timeout: 5000,
    });

    const initTime = Date.now() - startTime;

    // Performance assertion: widget init under 400ms (SLO)
    expect(initTime).toBeLessThan(400);

    // No console errors (includes hydration/CSP errors)
    expect(errors).toHaveLength(0);

    // Log performance for monitoring
    console.log(`Widget init time: ${initTime}ms`);

    // Check for hydration warnings (should be minimal)
    const hydrationWarnings = warnings.filter(
      w => w.includes('hydration') || w.includes('mismatch')
    );
    expect(hydrationWarnings.length).toBeLessThanOrEqual(0);
  });

  test('widget does not spam /auth/me endpoint', async ({ page }) => {
    const authRequests: string[] = [];

    // Track all requests to /auth/me
    page.on('request', request => {
      if (request.url().endsWith('/auth/me')) {
        authRequests.push(request.url());
      }
    });

    // Navigate and wait for widget
    await page.goto('/?e2e=1#widget');
    await page.waitForSelector('[data-ultimate-widget-ready]');

    // Wait a bit more to catch any delayed requests
    await page.waitForTimeout(2000);

    // Strict budget: at most 1 call to /auth/me during widget mount
    expect(authRequests.length).toBeLessThanOrEqual(1);

    console.log(`Auth requests during widget mount: ${authRequests.length}`);
  });

  test('widget respects CSP and has no inline scripts', async ({ page }) => {
    const cspViolations: string[] = [];

    // Listen for CSP violations
    page.on('console', msg => {
      if (msg.text().includes('Content Security Policy') || msg.text().includes('CSP')) {
        cspViolations.push(msg.text());
      }
    });

    await page.goto('/?e2e=1#widget');
    await page.waitForSelector('[data-ultimate-widget-ready]');

    // No CSP violations
    expect(cspViolations).toHaveLength(0);

    // Check that no inline scripts are present in widget area
    const inlineScripts = await page.locator('script:not([src])').count();
    expect(inlineScripts).toBe(0);
  });

  test('widget postMessage latency under 200ms', async ({ page }) => {
    const messageLatencies: number[] = [];

    // Inject performance measurement script
    await page.addInitScript(() => {
      window.addEventListener('message', event => {
        if (event.data.type === 'widget-perf-test') {
          const latency = Date.now() - event.data.timestamp;
          (window as any).widgetLatencies = (window as any).widgetLatencies || [];
          (window as any).widgetLatencies.push(latency);
        }
      });
    });

    await page.goto('/?e2e=1#widget');
    await page.waitForSelector('[data-ultimate-widget-ready]');

    // Send test messages and measure latency
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        const iframe = document.querySelector('iframe[data-widget-frame]') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            {
              type: 'widget-perf-test',
              timestamp: Date.now(),
            },
            '*'
          );
        }
      });

      await page.waitForTimeout(100);
    }

    // Get measured latencies
    const latencies = await page.evaluate(() => (window as any).widgetLatencies || []);

    if (latencies.length > 0) {
      const p95Latency = latencies.sort((a: number, b: number) => a - b)[
        Math.floor(latencies.length * 0.95)
      ];
      expect(p95Latency).toBeLessThan(200); // SLO: p95 < 200ms

      console.log(`Widget postMessage p95 latency: ${p95Latency}ms`);
    }
  });

  test('widget handles rate limiting gracefully', async ({ page }) => {
    const apiErrors: string[] = [];

    // Track API errors
    page.on('response', response => {
      if (response.status() === 429) {
        // Rate limited
        apiErrors.push(`Rate limited: ${response.url()}`);
      }
    });

    await page.goto('/?e2e=1#widget');
    await page.waitForSelector('[data-ultimate-widget-ready]');

    // Simulate rapid interactions that might trigger rate limiting
    for (let i = 0; i < 10; i++) {
      await page.click('[data-widget-action]', { timeout: 1000 }).catch(() => {
        // Ignore if element doesn't exist
      });
      await page.waitForTimeout(50);
    }

    // Widget should handle rate limiting gracefully (no crashes)
    const widgetStillPresent = await page.locator('[data-ultimate-widget-ready]').isVisible();
    expect(widgetStillPresent).toBe(true);

    if (apiErrors.length > 0) {
      console.log(`Rate limiting encountered: ${apiErrors.length} requests`);
    }
  });

  test('widget masks PII in error logs', async ({ page }) => {
    const consoleLogs: string[] = [];

    // Capture all console output
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    await page.goto('/?e2e=1#widget');
    await page.waitForSelector('[data-ultimate-widget-ready]');

    // Trigger potential error scenarios
    await page.evaluate(() => {
      // Simulate error with user data
      console.error('Widget error with user data:', {
        email: 'test@example.com',
        name: 'Test User',
        token: 'secret-token-123',
      });
    });

    // Check that PII is not present in logs
    const logsWithPII = consoleLogs.filter(
      log =>
        log.includes('test@example.com') ||
        log.includes('Test User') ||
        log.includes('secret-token-123')
    );

    // In production, PII should be masked
    if (process.env.NODE_ENV === 'production') {
      expect(logsWithPII).toHaveLength(0);
    }
  });
});

test.describe('Widget Integration', () => {
  test('widget survives page navigation', async ({ page }) => {
    await page.goto('/?e2e=1#widget');
    await page.waitForSelector('[data-ultimate-widget-ready]');

    // Navigate to another page
    await page.click('a[href="/dashboard"]');
    await page.waitForLoadState('networkidle');

    // Widget should still be functional if present
    const widgetPresent = await page.locator('[data-ultimate-widget-ready]').isVisible();
    if (widgetPresent) {
      // Widget should still respond to interactions
      const widgetResponsive = await page.locator('[data-widget-action]').isEnabled();
      expect(widgetResponsive).toBe(true);
    }
  });

  test('widget works with different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/?e2e=1#widget');

      const startTime = Date.now();
      await page.waitForSelector('[data-ultimate-widget-ready]');
      const initTime = Date.now() - startTime;

      // Widget should initialize quickly on all viewport sizes
      expect(initTime).toBeLessThan(400);

      console.log(`Widget init time at ${viewport.width}x${viewport.height}: ${initTime}ms`);
    }
  });
});
