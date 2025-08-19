import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for Playwright tests...');

  // Clean up test data if needed
  console.log('🗑️ Cleaning up test data...');

  // Add any cleanup logic here
  // For example, clearing test database records, files, etc.

  console.log('✅ Global teardown completed successfully');
}

export default globalTeardown;
