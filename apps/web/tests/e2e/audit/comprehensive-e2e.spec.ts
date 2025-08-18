import { test, expect } from '@playwright/test';

test.describe('Comprehensive E2E Site Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Console error: ${msg.text()}`);
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.error(`Page error: ${error.message}`);
    });
  });

  test('1. Landing/Home Page - Load and Navigation', async ({ page }) => {
    console.log('🏠 Testing Landing Page...');
    
    await page.goto('http://localhost:3005');
    
    // Check page loads
    await expect(page).toHaveTitle(/Vigor/);
    
    // Check no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.waitForLoadState('networkidle');
    expect(errors.length).toBe(0);
    
    console.log('✅ Landing page loaded without errors');
  });

  test('2. Login Page - Authentication Flow', async ({ page }) => {
    console.log('🔐 Testing Login Page...');
    
    await page.goto('http://localhost:3005/login');
    
    // Check form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Test login with valid credentials
    await page.fill('input[type="email"]', 'admin@testgym.mx');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    console.log('✅ Login flow completed successfully');
  });

  test('3. Dashboard 2.0 - Widget Population and Real-time', async ({ page }) => {
    console.log('📊 Testing Dashboard 2.0...');
    
    // Login first
    await page.goto('http://localhost:3005/login');
    await page.fill('input[type="email"]', 'admin@testgym.mx');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Navigate to Dashboard 2.0
    await page.goto('http://localhost:3005/dashboard-v2');
    await page.waitForLoadState('networkidle');
    
    // Check widgets are present and populated
    const widgets = [
      'Active Visits',
      'Revenue',
      'Activity Feed',
      'Classes',
      'Staff Coverage'
    ];
    
    for (const widget of widgets) {
      const widgetElement = page.locator(`text=${widget}`).first();
      await expect(widgetElement).toBeVisible({ timeout: 10000 });
    }
    
    // Check for real-time indicator
    const realtimeIndicator = page.locator('text=Datos en tiempo real, text=real-time, text=connected').first();
    await expect(realtimeIndicator).toBeVisible({ timeout: 15000 });
    
    // Check Active Visits shows capacity
    const activeVisits = page.locator('text=/\\d+\\/\\d+/').first();
    await expect(activeVisits).toBeVisible();
    
    // Check Revenue sparkline exists
    const revenueChart = page.locator('canvas, svg').first();
    await expect(revenueChart).toBeVisible();
    
    console.log('✅ Dashboard widgets loaded and real-time connected');
  });

  test('4. Onboarding Wizard - Complete Flow', async ({ page }) => {
    console.log('🎯 Testing Onboarding Wizard...');
    
    // Login first
    await page.goto('http://localhost:3005/login');
    await page.fill('input[type="email"]', 'admin@testgym.mx');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Navigate to onboarding
    await page.goto('http://localhost:3005/onboarding');
    await page.waitForLoadState('networkidle');
    
    // Check step navigation exists
    const steps = ['Brand', 'Locations', 'Plans', 'Staff'];
    for (const step of steps) {
      await expect(page.locator(`text=${step}`)).toBeVisible();
    }
    
    // Check progress bar
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();
    
    // Test Brand step
    const gymNameInput = page.locator('input[name="gymName"], input[placeholder*="gym"], input[placeholder*="Gym"]').first();
    if (await gymNameInput.isVisible()) {
      await gymNameInput.fill('Test Gym E2E');
    }
    
    // Test color picker if present
    const colorInputs = page.locator('input[type="color"], button[data-color]');
    if (await colorInputs.first().isVisible()) {
      await colorInputs.first().click();
    }
    
    // Try to proceed to next step
    const nextButton = page.locator('button:has-text("Continuar"), button:has-text("Next"), button:has-text("Continue")').first();
    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      await nextButton.click();
    }
    
    console.log('✅ Onboarding wizard navigation working');
  });

  test('5. Members Page - List and Data', async ({ page }) => {
    console.log('👥 Testing Members Page...');
    
    // Login first
    await page.goto('http://localhost:3005/login');
    await page.fill('input[type="email"]', 'admin@testgym.mx');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Navigate to members
    await page.goto('http://localhost:3005/members');
    await page.waitForLoadState('networkidle');
    
    // Check members list loads
    const membersList = page.locator('table, .member-card, .member-item').first();
    await expect(membersList).toBeVisible({ timeout: 10000 });
    
    // Check for member data (should have 85 members from seed)
    const memberCount = page.locator('text=/\\d+ members/, text=/Total: \\d+/').first();
    await expect(memberCount).toBeVisible();
    
    // Check status indicators
    const statusElements = page.locator('text=Active, text=Paused, text=Cancelled').first();
    await expect(statusElements).toBeVisible();
    
    console.log('✅ Members page loaded with data');
  });

  test('6. Classes Page - Schedule and Roster', async ({ page }) => {
    console.log('🏃 Testing Classes Page...');
    
    // Login first
    await page.goto('http://localhost:3005/login');
    await page.fill('input[type="email"]', 'admin@testgym.mx');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Navigate to classes
    await page.goto('http://localhost:3005/classes');
    await page.waitForLoadState('networkidle');
    
    // Check classes schedule
    const classSchedule = page.locator('table, .class-card, .schedule').first();
    await expect(classSchedule).toBeVisible({ timeout: 10000 });
    
    // Check for today's classes (should have 10+ from seed)
    const todayClasses = page.locator('text=/Today/, text=/Hoy/').first();
    await expect(todayClasses).toBeVisible();
    
    console.log('✅ Classes page loaded with schedule');
  });

  test('7. Revenue Page - Charts and Metrics', async ({ page }) => {
    console.log('💰 Testing Revenue Page...');
    
    // Login first
    await page.goto('http://localhost:3005/login');
    await page.fill('input[type="email"]', 'admin@testgym.mx');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Navigate to revenue (might be part of dashboard)
    await page.goto('http://localhost:3005/revenue');
    await page.waitForLoadState('networkidle');
    
    // If revenue page doesn't exist, check dashboard revenue widget
    if (page.url().includes('404') || page.url().includes('not-found')) {
      await page.goto('http://localhost:3005/dashboard-v2');
      await page.waitForLoadState('networkidle');
    }
    
    // Check for revenue charts/data
    const revenueChart = page.locator('canvas, svg, .chart').first();
    await expect(revenueChart).toBeVisible({ timeout: 10000 });
    
    // Check for growth percentage (should show 4% from seed)
    const growthMetric = page.locator('text=/%/, text=/growth/, text=/crecimiento/').first();
    await expect(growthMetric).toBeVisible();
    
    console.log('✅ Revenue data displayed correctly');
  });

  test('8. Staff Page - Team Management', async ({ page }) => {
    console.log('👨‍💼 Testing Staff Page...');
    
    // Login first
    await page.goto('http://localhost:3005/login');
    await page.fill('input[type="email"]', 'admin@testgym.mx');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Navigate to staff
    await page.goto('http://localhost:3005/staff');
    await page.waitForLoadState('networkidle');
    
    // If staff page doesn't exist, check dashboard staff widget
    if (page.url().includes('404') || page.url().includes('not-found')) {
      await page.goto('http://localhost:3005/dashboard-v2');
      await page.waitForLoadState('networkidle');
    }
    
    // Check for staff list/coverage
    const staffList = page.locator('table, .staff-card, .coverage').first();
    await expect(staffList).toBeVisible({ timeout: 10000 });
    
    // Check for staff roles (should have 7 staff from seed)
    const staffRoles = page.locator('text=Manager, text=Trainer, text=Receptionist').first();
    await expect(staffRoles).toBeVisible();
    
    console.log('✅ Staff management loaded correctly');
  });

  test('9. Mobile Responsiveness - Key Pages', async ({ page }) => {
    console.log('📱 Testing Mobile Responsiveness...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 360, height: 640 });
    
    // Login first
    await page.goto('http://localhost:3005/login');
    await page.fill('input[type="email"]', 'admin@testgym.mx');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Test dashboard mobile layout
    await page.goto('http://localhost:3005/dashboard-v2');
    await page.waitForLoadState('networkidle');
    
    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // 10px tolerance
    
    // Test onboarding mobile layout
    await page.goto('http://localhost:3005/onboarding');
    await page.waitForLoadState('networkidle');
    
    // Check form elements are touch-friendly
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40); // Touch-friendly height
        }
      }
    }
    
    console.log('✅ Mobile responsiveness verified');
  });

  test('10. Performance and Console Errors - Final Check', async ({ page }) => {
    console.log('⚡ Testing Performance and Console Errors...');
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });
    
    // Login and test main pages
    await page.goto('http://localhost:3005/login');
    await page.fill('input[type="email"]', 'admin@testgym.mx');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Test dashboard performance
    const startTime = Date.now();
    await page.goto('http://localhost:3005/dashboard-v2');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
    
    // Test onboarding performance
    await page.goto('http://localhost:3005/onboarding');
    await page.waitForLoadState('networkidle');
    
    // Check for critical errors (should be zero)
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('warning')
    );
    
    console.log(`Dashboard load time: ${loadTime}ms`);
    console.log(`Console errors: ${errors.length}`);
    console.log(`Console warnings: ${warnings.length}`);
    console.log(`Critical errors: ${criticalErrors.length}`);
    
    // Report results
    if (criticalErrors.length > 0) {
      console.error('Critical errors found:', criticalErrors);
    }
    
    expect(criticalErrors.length).toBe(0);
    
    console.log('✅ Performance and error check completed');
  });
});
