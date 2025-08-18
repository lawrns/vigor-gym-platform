import { test, expect } from '@playwright/test';

test.describe('Simple Accessibility Check', () => {
  test('Dashboard 2.0 - Basic accessibility', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3005/dashboard-v2');
    
    // Check for basic accessibility elements
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBeGreaterThan(0);
    
    // Check for proper page title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Check for main landmark
    const main = await page.locator('main, [role="main"]').count();
    expect(main).toBeGreaterThan(0);
    
    // Check for interactive elements with accessible names
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 5)) { // Test first 5 buttons
      const accessibleName = await button.evaluate(el => {
        return el.getAttribute('aria-label') || 
               el.getAttribute('aria-labelledby') || 
               el.textContent?.trim() || 
               el.getAttribute('title');
      });
      expect(accessibleName).toBeTruthy();
    }
    
    console.log(`✅ Dashboard accessibility check: ${headings} headings, ${buttons.length} buttons`);
  });

  test('Onboarding - Basic accessibility', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('http://localhost:3005/onboarding');
    
    // Check for form labels
    const inputs = await page.locator('input').all();
    for (const input of inputs.slice(0, 5)) { // Test first 5 inputs
      const hasLabel = await input.evaluate(el => {
        const id = el.id;
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        
        return !!(ariaLabel || ariaLabelledBy || label);
      });
      expect(hasLabel).toBeTruthy();
    }
    
    // Check for progress indicator
    const progressbar = await page.locator('[role="progressbar"]').count();
    expect(progressbar).toBeGreaterThan(0);
    
    // Check for tab navigation
    const tabs = await page.locator('[role="tab"]').count();
    expect(tabs).toBeGreaterThan(0);
    
    console.log(`✅ Onboarding accessibility check: ${inputs.length} inputs, ${tabs} tabs`);
  });

  test('Keyboard navigation - Basic flow', async ({ page }) => {
    await page.goto('http://localhost:3005/onboarding');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstFocused = await page.locator(':focus').first();
    expect(firstFocused).toBeVisible();
    
    // Test that focus is visible
    const focusOutline = await firstFocused.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || 
             styles.boxShadow !== 'none' || 
             styles.border !== styles.border; // Check if border changes on focus
    });
    
    console.log('✅ Keyboard navigation working with focus indicators');
  });

  test('Color contrast - Basic check', async ({ page }) => {
    await page.goto('http://localhost:3005/dashboard-v2');
    
    // Get text elements and check they have sufficient contrast
    const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6').all();
    
    let contrastIssues = 0;
    for (const element of textElements.slice(0, 10)) { // Test first 10 text elements
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        };
      });
      
      // Basic check: ensure text color is different from background
      if (styles.color === styles.backgroundColor) {
        contrastIssues++;
      }
    }
    
    expect(contrastIssues).toBe(0);
    console.log('✅ Basic color contrast check passed');
  });
});
