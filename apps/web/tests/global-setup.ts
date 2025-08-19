import { chromium, FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for Playwright tests...');

  // Wait for servers to be ready
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:7777';
  const apiURL = 'http://localhost:4001';

  console.log(`📡 Waiting for web server at ${baseURL}...`);
  console.log(`📡 Waiting for API server at ${apiURL}...`);

  // Create a browser instance to test connectivity
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Test web server connectivity
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    console.log('✅ Web server is ready');

    // Test API server connectivity
    const response = await page.request.get(`${apiURL}/health`);
    if (response.ok()) {
      console.log('✅ API server is ready');
    } else {
      console.warn('⚠️ API server health check failed, but continuing...');
    }

    // Reset and seed test database
    console.log('🗑️ Resetting test database...');
    try {
      await execAsync('npx tsx scripts/test-db-reset.ts', {
        cwd: process.cwd().replace('/apps/web', ''),
        timeout: 30000,
      });
      console.log('✅ Test database reset completed');
    } catch (error) {
      console.error('❌ Test database reset failed:', error);
      throw error;
    }

    // Verify test user can login
    console.log('🔐 Verifying test user authentication...');
    const loginResponse = await page.request.post(`${apiURL}/auth/login`, {
      data: {
        email: 'admin@testgym.mx',
        password: 'TestPassword123!',
      },
    });

    if (loginResponse.ok()) {
      console.log('✅ Test user authentication verified');
    } else {
      console.error('❌ Test user authentication failed');
      throw new Error('Test user authentication failed');
    }
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup completed successfully');
}

export default globalSetup;
