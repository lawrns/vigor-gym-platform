import { chromium, FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

/**
 * Global setup for E2E tests
 * Handles database reset, health checks, and environment preparation
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E global setup...');

  // Load environment variables
  const isStaging = process.env.E2E_ENV === 'staging';
  const envFile = isStaging ? '.env.staging' : '.env.local';

  try {
    config({ path: path.resolve(process.cwd(), envFile) });
    console.log(`📄 Loaded environment from ${envFile}`);
  } catch (error) {
    console.warn(`⚠️ Could not load ${envFile}, using process.env`);
  }

  const baseURL =
    process.env.PW_BASE_URL ||
    (isStaging ? 'https://staging.vigor-gym.com' : 'http://localhost:7777');
  const apiURL =
    process.env.PW_API_URL ||
    (isStaging ? 'https://api-staging.vigor-gym.com' : 'http://localhost:4001');
  const tenantId = process.env.TENANT_ID || '00000000-0000-0000-0000-000000000001';

  console.log(`🌐 Base URL: ${baseURL}`);
  console.log(`🔌 API URL: ${apiURL}`);
  console.log(`🏢 Tenant ID: ${tenantId}`);

  // Step 1: Reset and seed database (if not staging)
  if (!isStaging) {
    console.log('🗄️ Resetting and seeding database...');
    try {
      execSync(`npx tsx scripts/test-db-reset.ts --tenant=${tenantId} --seed=true`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      console.log('✅ Database reset completed');
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    }
  } else {
    console.log('⏭️ Skipping database reset for staging environment');
  }

  // Step 2: Start Stripe webhook listener (local only)
  if (!isStaging && process.env.STRIPE_CLI_WEBHOOK !== 'false') {
    console.log('💳 Starting Stripe webhook listener...');
    try {
      // Start Stripe CLI in background
      const stripeProcess = execSync(
        `stripe listen --forward-to ${apiURL}/v1/billing/webhook/stripe --print-secret`,
        { encoding: 'utf8', timeout: 10000 }
      );

      // Extract webhook secret
      const webhookSecret = stripeProcess.match(/whsec_[a-zA-Z0-9]+/)?.[0];
      if (webhookSecret) {
        process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
        console.log('✅ Stripe webhook listener started');
      }
    } catch (error) {
      console.warn('⚠️ Could not start Stripe webhook listener (continuing without)');
    }
  }

  // Step 3: Health check endpoints
  console.log('🏥 Running health checks...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Check web application health
    console.log('📱 Checking web application...');
    const webResponse = await page.goto(`${baseURL}/`, { timeout: 30000 });
    if (!webResponse?.ok()) {
      throw new Error(`Web health check failed: ${webResponse?.status()}`);
    }
    console.log('✅ Web application healthy');

    // Check API health
    console.log('🔌 Checking API health...');
    const apiResponse = await page.request.get(`${apiURL}/health`);
    if (!apiResponse.ok()) {
      throw new Error(`API health check failed: ${apiResponse.status()}`);
    }
    console.log('✅ API healthy');

    // Check database connectivity
    console.log('🗄️ Checking database connectivity...');
    const dbResponse = await page.request.get(`${apiURL}/v1/metrics/health`);
    if (dbResponse.ok()) {
      const dbData = await dbResponse.json();
      if (dbData.database !== 'connected') {
        throw new Error('Database not connected');
      }
      console.log('✅ Database connected');
    } else {
      console.warn('⚠️ Could not check database connectivity');
    }
  } catch (error) {
    console.error('❌ Health checks failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  // Step 4: Create admin session for API smoke tests
  console.log('🔐 Creating admin session...');

  const adminBrowser = await chromium.launch();
  const adminContext = await adminBrowser.newContext();
  const adminPage = await adminContext.newPage();

  try {
    const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@testgym.mx';
    const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'TestPassword123!';

    // Login to create session
    await adminPage.goto(`${baseURL}/login`);
    await adminPage.fill('[data-testid="login-email"]', adminEmail);
    await adminPage.fill('[data-testid="login-password"]', adminPassword);
    await adminPage.click('[data-testid="login-submit"]');

    // Wait for successful login (handle page refresh)
    try {
      await adminPage.waitForURL(/dashboard/, { timeout: 15000 });
    } catch (error) {
      // If navigation times out due to page refresh, wait a bit and check URL
      await adminPage.waitForTimeout(2000);
      if (!adminPage.url().includes('/dashboard')) {
        throw error;
      }
    }
    console.log('✅ Admin session created');

    // Test authenticated API call
    const kpiResponse = await adminPage.request.get(`${apiURL}/v1/kpi/overview`);
    if (kpiResponse.ok()) {
      console.log('✅ Authenticated API calls working');
    } else {
      console.warn('⚠️ Authenticated API calls may have issues');
    }

    // Reload page to surface cookies to RSC
    await adminPage.reload();
    await adminPage.waitForLoadState('networkidle');

    // Ensure the tests/.auth directory exists
    const authDir = path.resolve(process.cwd(), 'tests/.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Save storage state for reuse across tests
    const storageStatePath = path.resolve(authDir, 'storageState.json');
    await adminContext.storageState({ path: storageStatePath });
    console.log(`💾 Saved storage state to ${storageStatePath}`);

    // Reset test data if in E2E mode
    if (process.env.E2E_MODE === 'true') {
      try {
        await adminPage.request.post(`${apiURL}/v1/test/visits/reset`);
        await adminPage.request.post(`${apiURL}/v1/test/billing/reset`);
        console.log('🧹 Reset test data');
      } catch (error) {
        console.warn('⚠️ Could not reset test data:', error);
      }
    }
  } catch (error) {
    console.error('❌ Admin session creation failed:', error);
    throw error;
  } finally {
    await adminBrowser.close();
  }

  // Step 5: Warm up critical endpoints
  console.log('🔥 Warming up critical endpoints...');

  const warmupBrowser = await chromium.launch();
  const warmupContext = await warmupBrowser.newContext();
  const warmupPage = await warmupContext.newPage();

  try {
    const endpoints = [
      `${baseURL}/dashboard`,
      `${baseURL}/admin/members`,
      `${baseURL}/planes`,
      `${apiURL}/v1/metrics/auth`,
      `${apiURL}/v1/metrics/billing`,
    ];

    for (const endpoint of endpoints) {
      try {
        await warmupPage.goto(endpoint, { timeout: 10000 });
        console.log(`✅ Warmed up: ${endpoint}`);
      } catch (error) {
        console.warn(`⚠️ Could not warm up: ${endpoint}`);
      }
    }
  } finally {
    await warmupBrowser.close();
  }

  // Step 6: Set global test environment variables
  process.env.E2E_SETUP_COMPLETE = 'true';
  process.env.E2E_BASE_URL = baseURL;
  process.env.E2E_API_URL = apiURL;
  process.env.E2E_TENANT_ID = tenantId;

  console.log('🎉 E2E global setup completed successfully!');
  console.log('📊 Environment ready for test execution');
}

export default globalSetup;
