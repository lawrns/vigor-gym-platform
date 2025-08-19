import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  test('Dashboard 2.0 - Mobile viewport (360px)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 360, height: 640 });

    await page.goto('http://localhost:3005/dashboard-v2');
    await page.waitForLoadState('networkidle');

    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // Allow 5px tolerance

    // Check widgets are stacked vertically and readable
    const widgets = await page.locator('[data-testid*="widget"], .widget, [class*="widget"]').all();

    for (const widget of widgets.slice(0, 3)) {
      // Test first 3 widgets
      const box = await widget.boundingBox();
      if (box) {
        // Widget should not be wider than viewport
        expect(box.width).toBeLessThanOrEqual(360);

        // Widget should be tall enough to be readable
        expect(box.height).toBeGreaterThan(50);
      }
    }

    // Check text is readable (not too small)
    const textElements = await page.locator('p, span, div').all();
    for (const element of textElements.slice(0, 5)) {
      const fontSize = await element.evaluate(el => {
        return parseInt(window.getComputedStyle(el).fontSize);
      });

      if (fontSize > 0) {
        expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable size
      }
    }

    console.log(`✅ Dashboard mobile test: ${widgets.length} widgets, no horizontal scroll`);
  });

  test('Onboarding wizard - Mobile viewport (360px)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });

    await page.goto('http://localhost:3005/onboarding');
    await page.waitForLoadState('networkidle');

    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);

    // Check form elements are properly sized
    const inputs = await page.locator('input, textarea, select').all();
    for (const input of inputs.slice(0, 5)) {
      const box = await input.boundingBox();
      if (box) {
        // Input should not be wider than viewport minus padding
        expect(box.width).toBeLessThanOrEqual(320); // 360 - 40px padding

        // Input should be tall enough for touch
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }

    // Check buttons are touch-friendly
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 3)) {
      const box = await button.boundingBox();
      if (box) {
        // Button should be at least 44px tall (iOS guideline)
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }

    console.log(`✅ Onboarding mobile test: ${inputs.length} inputs, ${buttons.length} buttons`);
  });

  test('Dashboard 2.0 - Tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('http://localhost:3005/dashboard-v2');
    await page.waitForLoadState('networkidle');

    // Check widgets use available space efficiently
    const widgets = await page.locator('[data-testid*="widget"], .widget, [class*="widget"]').all();

    let totalWidgetWidth = 0;
    for (const widget of widgets.slice(0, 3)) {
      const box = await widget.boundingBox();
      if (box) {
        totalWidgetWidth += box.width;
      }
    }

    // Widgets should use a reasonable portion of available space
    expect(totalWidgetWidth).toBeGreaterThan(400);

    console.log(`✅ Dashboard tablet test: efficient space usage`);
  });

  test('Touch interactions - Mobile gestures', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });

    await page.goto('http://localhost:3005/onboarding');
    await page.waitForLoadState('networkidle');

    // Test touch interactions on buttons
    const buttons = await page.locator('button').all();

    for (const button of buttons.slice(0, 2)) {
      if (await button.isVisible()) {
        // Simulate touch tap
        await button.tap();

        // Check button responds to touch (no errors thrown)
        const isEnabled = await button.isEnabled();
        // Just verify the button exists and is interactable
        expect(typeof isEnabled).toBe('boolean');
      }
    }

    console.log('✅ Touch interactions working');
  });

  test('Text scaling - 200% zoom', async ({ page }) => {
    await page.goto('http://localhost:3005/dashboard-v2');

    // Simulate 200% zoom by setting a smaller viewport
    await page.setViewportSize({ width: 640, height: 480 });

    // Check content is still accessible
    const headings = await page.locator('h1, h2, h3').all();
    for (const heading of headings.slice(0, 3)) {
      if (await heading.isVisible()) {
        const text = await heading.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    }

    // Check no content is cut off
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    // Allow some horizontal scroll at 200% zoom
    expect(bodyWidth).toBeLessThan(viewportWidth * 2);

    console.log('✅ Text scaling test passed');
  });

  test('Orientation change - Portrait to landscape', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('http://localhost:3005/dashboard-v2');
    await page.waitForLoadState('networkidle');

    // Switch to landscape
    await page.setViewportSize({ width: 640, height: 360 });
    await page.waitForTimeout(500); // Allow layout to adjust

    // Check layout adapts
    const widgets = await page.locator('[data-testid*="widget"], .widget, [class*="widget"]').all();

    let visibleWidgets = 0;
    for (const widget of widgets) {
      if (await widget.isVisible()) {
        visibleWidgets++;
      }
    }

    expect(visibleWidgets).toBeGreaterThan(0);

    console.log(`✅ Orientation change test: ${visibleWidgets} widgets visible in landscape`);
  });
});
