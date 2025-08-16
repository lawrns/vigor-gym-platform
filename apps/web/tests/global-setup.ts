import { chromium, FullConfig } from '@playwright/test';

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
    
    // Seed test data if needed
    console.log('🌱 Seeding test data...');
    
    // Create test user if it doesn't exist
    try {
      await page.request.post(`${apiURL}/auth/register`, {
        data: {
          email: 'admin@testgym.mx',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'Admin',
          role: 'owner'
        }
      });
      console.log('✅ Test user created/verified');
    } catch (error) {
      console.log('ℹ️ Test user already exists or creation failed (expected)');
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
