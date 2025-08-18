import { defineConfig, devices } from '@playwright/test';

// Environment-based configuration
const isStaging = process.env.E2E_ENV === 'staging';
const baseURL = process.env.STAGING_BASE_URL || process.env.PW_BASE_URL || (isStaging ? 'https://staging.vigor-gym.com' : 'http://localhost:7777');
const apiURL = process.env.PW_API_URL || (isStaging ? 'https://api-staging.vigor-gym.com' : 'http://localhost:4001');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: !isStaging, // Sequential for staging to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: isStaging ? 1 : (process.env.CI ? 1 : 3),
  timeout: 30000,
  expect: {
    timeout: 8000,
  },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],

  use: {
    baseURL,
    storageState: 'tests/.auth/storageState.json',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 20000,
  },

  // Global setup for database reset and health checks
  globalSetup: require.resolve('./scripts/e2e-global-setup.ts'),

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Add environment variables for tests
        extraHTTPHeaders: {
          'X-Test-Environment': isStaging ? 'staging' : 'local',
        },
      },
      // Disable parallel execution for visits tests until isolated
      fullyParallel: false,
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        extraHTTPHeaders: {
          'X-Test-Environment': isStaging ? 'staging' : 'local',
        },
      },
      // Disable parallel execution for visits tests until isolated
      fullyParallel: false,
    },
  ],

  // Only start local servers for local testing
  webServer: isStaging ? undefined : [
    {
      command: 'npm run dev -w @vigor/api',
      port: 4001,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run dev -w @vigor/web',
      port: 7777,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
