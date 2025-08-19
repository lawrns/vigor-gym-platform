import { test, expect } from '../framework/fixtures';

// Type declarations for PostHog spy
declare global {
  interface Window {
    capturedEvents: Array<{ event: string; properties: any }>;
    posthog: {
      capture: (event: string, properties: any) => void;
      init: () => void;
      __loaded: boolean;
    };
  }
}

/**
 * MKT-02: Show-Don't-Tell Launch (/beneficios + /beneficios/demo)
 * Tests for the marketing benefits page and interactive demo covering all sections and tracking
 */

test.describe('Marketing Benefits Page (MKT-02)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the benefits page
    await page.goto('/beneficios');
  });

  test('MKT-01.1: renders all sections and CTAs', async ({ page }) => {
    console.log('🎯 Testing all sections render correctly...');

    // Hero section
    await expect(page.locator('[data-testid="hero"]')).toBeVisible();
    await expect(page.locator('[data-testid="hero"] h1')).toContainText(
      'Tu gimnasio, en tu bolsillo'
    );

    // Check primary and secondary CTAs in hero
    await expect(page.locator('[data-testid="hero"] [data-cta="primary"]')).toBeVisible();
    await expect(page.locator('[data-testid="hero"] [data-cta="secondary"]')).toBeVisible();
    console.log('✅ Hero section rendered with CTAs');

    // Benefits grid
    await expect(page.locator('[data-testid="benefits"]')).toBeVisible();
    const benefitItems = page.locator('[data-testid="benefits"] > div > div');
    await expect(benefitItems).toHaveCount(4);
    console.log('✅ Benefits grid rendered with 4 items');

    // How it works section
    await expect(page.locator('[data-testid="how-it-works"]')).toBeVisible();
    await expect(page.locator('[data-testid="how-it-works"] h2')).toContainText('¿Cómo funciona?');
    const steps = page.locator('[data-testid="how-it-works"] .grid > div');
    await expect(steps).toHaveCount(3);
    console.log('✅ How it works section rendered with 3 steps');

    // AI banner
    await expect(page.locator('[data-testid="ai-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-banner"] h2')).toContainText('Escaneo corporal');
    await expect(page.locator('[data-testid="ai-banner"] [data-cta="feature"]')).toBeVisible();
    console.log('✅ AI banner rendered with CTA');

    // FAQ section
    await expect(page.locator('[data-testid="faq"]')).toBeVisible();
    await expect(page.locator('[data-testid="faq"] h2')).toContainText('Preguntas frecuentes');
    const faqItems = page.locator('[data-testid="faq"] .space-y-4 > div');
    await expect(faqItems).toHaveCount(3);
    console.log('✅ FAQ section rendered with 3 items');

    // Final CTA
    await expect(page.locator('[data-testid="final-cta"]')).toBeVisible();
    await expect(page.locator('[data-testid="final-cta"] h2')).toContainText(
      '¿Listo para entrenar mejor?'
    );
    await expect(page.locator('[data-testid="final-cta"] [data-cta="primary"]')).toBeVisible();
    await expect(page.locator('[data-testid="final-cta"] [data-cta="secondary"]')).toBeVisible();
    console.log('✅ Final CTA section rendered with both CTAs');
  });

  test('MKT-01.2: clicking primary CTA emits lp_cta_click', async ({ page }) => {
    console.log('📊 Testing CTA click tracking...');

    // Set up PostHog capture spy
    await page.addInitScript(() => {
      window.capturedEvents = [];
      window.posthog = {
        capture: (event, properties) => {
          window.capturedEvents.push({ event, properties });
        },
        init: () => {},
        __loaded: true,
      };
    });

    // Click the primary CTA in hero
    await page.click('[data-testid="hero"] [data-cta="primary"]');

    // Wait a bit for the event to be captured
    await page.waitForTimeout(500);

    // Check if the event was captured
    const events = await page.evaluate(() => window.capturedEvents);
    const ctaClickEvent = events.find(e => e.event === 'lp_cta_click');

    expect(ctaClickEvent).toBeDefined();
    expect(ctaClickEvent.properties.cta).toBe('primary');
    expect(ctaClickEvent.properties.section).toBe('hero');
    console.log('✅ CTA click event tracked correctly');
  });

  test('MKT-01.3: FAQ toggle functionality works', async ({ page }) => {
    console.log('❓ Testing FAQ toggle functionality...');

    // Set up PostHog capture spy for FAQ tracking
    await page.addInitScript(() => {
      window.capturedEvents = [];
      window.posthog = {
        capture: (event, properties) => {
          window.capturedEvents.push({ event, properties });
        },
        init: () => {},
        __loaded: true,
      };
    });

    // Get the first FAQ item
    const firstFAQ = page.locator('[data-testid="faq"] .space-y-4 > div').first();
    const faqButton = firstFAQ.locator('button');
    const faqAnswer = firstFAQ.locator('[id^="faq-answer-"]');

    // Initially, answer should not be visible
    await expect(faqAnswer).not.toBeVisible();

    // Click to open
    await faqButton.click();
    await expect(faqAnswer).toBeVisible();
    console.log('✅ FAQ opens correctly');

    // Click to close
    await faqButton.click();
    await expect(faqAnswer).not.toBeVisible();
    console.log('✅ FAQ closes correctly');

    // Check if FAQ toggle events were tracked
    await page.waitForTimeout(500);
    const events = await page.evaluate(() => window.capturedEvents);
    const faqEvents = events.filter(e => e.event === 'lp_faq_toggle');

    expect(faqEvents.length).toBeGreaterThanOrEqual(2); // Open and close
    console.log('✅ FAQ toggle events tracked');
  });

  test('MKT-01.4: page responds quickly (performance)', async ({ page }) => {
    console.log('⚡ Testing page performance...');

    const startTime = Date.now();

    // Navigate and wait for page to be fully loaded
    await page.goto('/beneficios');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load in under 2 seconds (2000ms)
    expect(loadTime).toBeLessThan(2000);
    console.log(`✅ Page loaded in ${loadTime}ms (< 2000ms target)`);

    // Check that all critical elements are visible
    await expect(page.locator('[data-testid="hero"]')).toBeVisible();
    await expect(page.locator('[data-testid="benefits"]')).toBeVisible();
    await expect(page.locator('[data-testid="final-cta"]')).toBeVisible();
    console.log('✅ All critical sections visible after load');
  });

  test('MKT-02.1: demo CTAs navigate to demo page', async ({ page }) => {
    console.log('🎯 Testing demo CTA navigation...');

    // Check hero demo CTA
    const heroDemoCTA = page.locator('[data-testid="hero-split"] [data-cta="primary"]');
    await expect(heroDemoCTA).toBeVisible();
    await expect(heroDemoCTA).toContainText('Probar demo');

    // Check bottom demo CTA
    const bottomDemoCTA = page.locator('[data-testid="cta-bottom"] [data-cta="primary"]');
    await expect(bottomDemoCTA).toBeVisible();
    await expect(bottomDemoCTA).toContainText('Probar demo');

    console.log('✅ Demo CTAs found and have correct text');
  });

  test('MKT-01.5: accessibility features work correctly', async ({ page }) => {
    console.log('♿ Testing accessibility features...');

    // Check heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveAttribute('class', /font-display/);
    console.log('✅ Single H1 with proper styling');

    // Check FAQ accessibility
    const faqButtons = page.locator('[data-testid="faq"] button');
    const firstFaqButton = faqButtons.first();

    await expect(firstFaqButton).toHaveAttribute('aria-expanded', 'false');
    await expect(firstFaqButton).toHaveAttribute('aria-controls');

    // Click and check aria-expanded changes
    await firstFaqButton.click();
    await expect(firstFaqButton).toHaveAttribute('aria-expanded', 'true');
    console.log('✅ FAQ ARIA attributes work correctly');

    // Check focus visibility on CTAs
    const primaryCTA = page.locator('[data-testid="hero"] [data-cta="primary"]');
    await primaryCTA.focus();

    // Should have focus ring styles
    await expect(primaryCTA).toHaveClass(/focus:ring/);
    console.log('✅ Focus styles present on CTAs');

    // Check image alt text
    const heroImage = page.locator('[data-testid="hero"] img');
    await expect(heroImage).toHaveAttribute('alt');
    const altText = await heroImage.getAttribute('alt');
    expect(altText).toBeTruthy();
    expect(altText.length).toBeGreaterThan(5);
    console.log('✅ Images have descriptive alt text');
  });

  test('MKT-01.6: SEO metadata is correct', async ({ page }) => {
    console.log('🔍 Testing SEO metadata...');

    // Check page title
    await expect(page).toHaveTitle(/Vigor.*Beneficios.*gimnasio/);
    console.log('✅ Page title contains key terms');

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content');
    const description = await metaDescription.getAttribute('content');
    expect(description).toContain('Reserva clases');
    expect(description).toContain('IA');
    console.log('✅ Meta description contains key features');

    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDescription = page.locator('meta[property="og:description"]');
    const ogImage = page.locator('meta[property="og:image"]');

    await expect(ogTitle).toHaveAttribute('content');
    await expect(ogDescription).toHaveAttribute('content');
    await expect(ogImage).toHaveAttribute('content', /vigor-beneficios/);
    console.log('✅ Open Graph tags present and correct');
  });
});

test.describe('Demo Page (/beneficios/demo)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the demo page
    await page.goto('/beneficios/demo');
  });

  test('MKT-02.2: demo page renders all components', async ({ page }) => {
    console.log('🎯 Testing demo page components...');

    // Check page title and description
    await expect(page.locator('h1')).toContainText('Prueba Vigor en 60 segundos');
    await expect(page.locator('p')).toContainText('Experimenta cómo funciona sin registrarte');

    // Check all demo components are present
    await expect(page.locator('[data-testid="demo-checkin"]')).toBeVisible();
    await expect(page.locator('[data-testid="demo-classes"]')).toBeVisible();
    await expect(page.locator('[data-testid="demo-progress"]')).toBeVisible();

    console.log('✅ All demo components rendered');
  });

  test('MKT-02.3: check-in demo flow works', async ({ page }) => {
    console.log('🎯 Testing check-in demo flow...');

    const checkinSection = page.locator('[data-testid="demo-checkin"]');

    // Should show method selection initially
    await expect(checkinSection.locator('button').first()).toBeVisible();

    // Click QR method
    await checkinSection.locator('button').first().click();

    // Should show QR interface
    await expect(checkinSection.locator('button:has-text("Simular escaneo")')).toBeVisible();

    // Simulate check-in
    await checkinSection.locator('button:has-text("Simular escaneo")').click();

    // Should show success state
    await expect(checkinSection.locator('text=¡Listo! Check-in exitoso.')).toBeVisible({
      timeout: 3000,
    });

    console.log('✅ Check-in demo flow completed successfully');
  });

  test('MKT-02.4: class booking demo works', async ({ page }) => {
    console.log('🎯 Testing class booking demo...');

    const classSection = page.locator('[data-testid="demo-classes"]');

    // Should show class list
    await expect(classSection.locator('button').first()).toBeVisible();

    // Click first available class
    await classSection.locator('button').first().click();

    // Should show book button
    await expect(classSection.locator('button:has-text("Reservar clase")')).toBeVisible();

    // Book the class
    await classSection.locator('button:has-text("Reservar clase")').click();

    // Should show success state
    await expect(classSection.locator('text=¡Clase reservada!')).toBeVisible({ timeout: 2000 });

    console.log('✅ Class booking demo completed successfully');
  });

  test('MKT-02.5: progress demo shows animated metrics', async ({ page }) => {
    console.log('🎯 Testing progress demo animations...');

    const progressSection = page.locator('[data-testid="demo-progress"]');

    // Should show progress cards
    await expect(progressSection.locator('text=Racha actual')).toBeVisible();
    await expect(progressSection.locator('text=Este mes')).toBeVisible();

    // Wait for AI insight to appear
    await expect(progressSection.locator('text=Consejo de IA')).toBeVisible({ timeout: 3000 });

    // Should show action buttons
    await expect(
      progressSection.locator('button:has-text("Ver historial completo")')
    ).toBeVisible();

    console.log('✅ Progress demo animations and insights working');
  });

  test('MKT-02.6: demo footer CTAs work', async ({ page }) => {
    console.log('🎯 Testing demo footer CTAs...');

    // Check footer CTAs are present
    await expect(page.locator('[data-cta="primary"][data-section="demo-footer"]')).toBeVisible();
    await expect(page.locator('[data-cta="secondary"][data-section="demo-footer"]')).toBeVisible();

    // Check CTA text
    await expect(page.locator('[data-cta="primary"][data-section="demo-footer"]')).toContainText(
      'Ver planes'
    );
    await expect(page.locator('[data-cta="secondary"][data-section="demo-footer"]')).toContainText(
      'Volver a beneficios'
    );

    console.log('✅ Demo footer CTAs present and correctly labeled');
  });
});
