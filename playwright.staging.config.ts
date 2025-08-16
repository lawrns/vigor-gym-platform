import { defineConfig, devices } from '@playwright/test';

/**
 * Staging-specific Playwright configuration for comprehensive E2E testing
 * before production deployment.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run sequentially for staging to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1, // More retries for staging stability
  workers: 1, // Single worker for staging to ensure test isolation
  reporter: [
    ['html', { outputFolder: 'playwright-report-staging' }],
    ['json', { outputFile: 'test-results-staging.json' }],
    ['junit', { outputFile: 'test-results-staging.xml' }],
  ],
  
  // Global test timeout
  timeout: 60 * 1000, // 60 seconds per test
  
  // Expect timeout for assertions
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },

  use: {
    // Use staging environment
    baseURL: process.env.STAGING_WEB_URL || 'https://staging.vigor-gym.com',
    
    // Enhanced tracing for staging
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: false, // Enforce HTTPS in staging
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'X-Test-Environment': 'staging',
      'X-Test-Suite': 'e2e-comprehensive',
    },
  },

  projects: [
    // Setup project to prepare staging environment
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup',
    },
    
    // Main test suite
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable additional Chrome features for staging
        launchOptions: {
          args: [
            '--disable-web-security', // For iframe testing
            '--disable-features=VizDisplayCompositor', // Stability
          ],
        },
      },
      dependencies: ['setup'],
    },
    
    // Mobile testing for responsive design
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
      },
      dependencies: ['setup'],
    },
    
    // Cleanup project
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.ts/,
    },
  ],

  // No local web server for staging - we test against deployed environment
  // webServer: undefined,
});

// Environment-specific configuration
const stagingConfig = {
  // API endpoints
  API_BASE_URL: process.env.STAGING_API_URL || 'https://api-staging.vigor-gym.com',
  
  // Test credentials (should be environment variables in CI)
  TEST_USER: {
    email: process.env.STAGING_TEST_EMAIL || 'admin@testgym.mx',
    password: process.env.STAGING_TEST_PASSWORD || 'TestPassword123!',
  },
  
  // Stripe test configuration
  STRIPE_TEST_CARD: {
    number: '4242424242424242',
    expiry: '12/34',
    cvc: '123',
    zip: '12345',
  },
  
  // Test timeouts
  TIMEOUTS: {
    PAGE_LOAD: 30000,
    API_RESPONSE: 10000,
    STRIPE_ELEMENT: 15000,
  },
  
  // Feature flags for staging
  FEATURES: {
    SAVED_CARDS: true,
    OBSERVABILITY: true,
    SSR_DASHBOARD: true,
    WEBHOOK_PROCESSING: true,
  },
};

export { stagingConfig };
