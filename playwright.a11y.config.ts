import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/a11y',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 30000,
  expect: {
    timeout: 8000,
  },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'a11y-report', open: 'never' }],
  ],

  use: {
    baseURL: 'http://localhost:3005',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No global setup for accessibility tests
});
