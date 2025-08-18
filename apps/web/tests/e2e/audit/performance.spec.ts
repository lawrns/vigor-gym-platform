import { test, expect } from '@playwright/test';

test.describe('Performance Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@testgym.mx');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard**');
  });

  test('Dashboard 2.0 - Performance budgets', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard-v2');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Performance budget: Page should load within 2.5 seconds
    expect(loadTime).toBeLessThan(2500);
    
    // Check for performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });

    // Performance budgets
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1000); // 1s for DOM ready
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500); // 1.5s for FCP
    
    console.log('Performance metrics:', performanceMetrics);
  });

  test('Widget mount times - Individual performance', async ({ page }) => {
    await page.goto('/dashboard-v2');
    
    // Test individual widget load times
    const widgets = [
      '[data-testid="active-visits-widget"]',
      '[data-testid="expiring-memberships-widget"]',
      '[data-testid="revenue-sparkline"]',
      '[data-testid="live-activity-feed"]'
    ];

    for (const widgetSelector of widgets) {
      const startTime = Date.now();
      
      await page.waitForSelector(widgetSelector, { timeout: 5000 });
      
      const mountTime = Date.now() - startTime;
      
      // Widget should mount within 400ms
      expect(mountTime).toBeLessThan(400);
      
      console.log(`${widgetSelector} mount time: ${mountTime}ms`);
    }
  });

  test('SSE connection performance', async ({ page }) => {
    await page.goto('/dashboard-v2');
    
    // Monitor SSE connection establishment
    const sseStartTime = Date.now();
    
    // Wait for SSE connection to be established
    await page.waitForFunction(() => {
      return window.performance.getEntriesByType('resource').some(entry => 
        entry.name.includes('/v1/events')
      );
    }, { timeout: 5000 });
    
    const sseConnectionTime = Date.now() - sseStartTime;
    
    // SSE should connect within 3 seconds
    expect(sseConnectionTime).toBeLessThan(3000);
    
    console.log(`SSE connection time: ${sseConnectionTime}ms`);
  });

  test('Memory usage - No significant leaks', async ({ page }) => {
    await page.goto('/dashboard-v2');
    await page.waitForLoadState('networkidle');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      } : null;
    });

    if (initialMemory) {
      // Simulate user interaction for 30 seconds
      for (let i = 0; i < 10; i++) {
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }

      const finalMemory = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        };
      });

      // Memory should not increase by more than 50MB
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB

      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    }
  });

  test('Network efficiency - Resource optimization', async ({ page }) => {
    const responses: any[] = [];
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        size: response.headers()['content-length'] || 0,
        type: response.headers()['content-type'] || ''
      });
    });

    await page.goto('/dashboard-v2');
    await page.waitForLoadState('networkidle');

    // Analyze network requests
    const jsRequests = responses.filter(r => r.type.includes('javascript'));
    const cssRequests = responses.filter(r => r.type.includes('css'));
    const imageRequests = responses.filter(r => r.type.includes('image'));
    const apiRequests = responses.filter(r => r.url.includes('/v1/'));

    // Performance budgets for resources
    expect(jsRequests.length).toBeLessThan(20); // Max 20 JS files
    expect(cssRequests.length).toBeLessThan(10); // Max 10 CSS files
    expect(apiRequests.every(r => r.status < 400)).toBeTruthy(); // All API calls successful

    console.log(`Network summary: ${jsRequests.length} JS, ${cssRequests.length} CSS, ${imageRequests.length} images, ${apiRequests.length} API calls`);
  });

  test('Real-time updates performance', async ({ page }) => {
    await page.goto('/dashboard-v2');
    await page.waitForLoadState('networkidle');

    // Monitor for real-time updates
    const updateStartTime = Date.now();
    
    // Wait for at least one SSE event
    await page.waitForFunction(() => {
      return window.localStorage.getItem('last-sse-event') !== null;
    }, { timeout: 10000 });

    const updateTime = Date.now() - updateStartTime;
    
    // Real-time updates should arrive within 5 seconds
    expect(updateTime).toBeLessThan(5000);
    
    console.log(`Real-time update received in: ${updateTime}ms`);
  });
});
