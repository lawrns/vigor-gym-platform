/**
 * Load Test Setup Script
 * 
 * Prepares the environment for load testing by creating test users
 * and ensuring the system is ready for high-volume testing
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4001';
const WEB_BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:7777';

// Test users to create
const TEST_USERS = [
  { email: 'loadtest1@testgym.mx', password: 'TestPassword123!', firstName: 'Load', lastName: 'Test1' },
  { email: 'loadtest2@testgym.mx', password: 'TestPassword123!', firstName: 'Load', lastName: 'Test2' },
  { email: 'loadtest3@testgym.mx', password: 'TestPassword123!', firstName: 'Load', lastName: 'Test3' },
  { email: 'loadtest4@testgym.mx', password: 'TestPassword123!', firstName: 'Load', lastName: 'Test4' },
  { email: 'loadtest5@testgym.mx', password: 'TestPassword123!', firstName: 'Load', lastName: 'Test5' },
];

async function setupLoadTest() {
  console.log('🚀 Setting up load test environment...');
  
  try {
    // Check if servers are running
    await checkServerHealth();
    
    // Create test users
    await createTestUsers();
    
    // Verify auth endpoints
    await verifyAuthEndpoints();
    
    console.log('✅ Load test environment setup complete!');
    console.log('\n📊 Ready to run load tests:');
    console.log('   npx artillery run tests/load/auth-load-test.yml');
    console.log('   npx artillery run tests/load/auth-load-test.yml --output report.json');
    console.log('   npx artillery report report.json');
    
  } catch (error) {
    console.error('❌ Load test setup failed:', error.message);
    process.exit(1);
  }
}

async function checkServerHealth() {
  console.log('🔍 Checking server health...');
  
  try {
    // Check API server
    const apiResponse = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log(`✅ API server healthy: ${apiResponse.status}`);
    
    // Check web server
    const webResponse = await axios.get(`${WEB_BASE_URL}/`, { timeout: 5000 });
    console.log(`✅ Web server healthy: ${webResponse.status}`);
    
  } catch (error) {
    throw new Error(`Server health check failed: ${error.message}`);
  }
}

async function createTestUsers() {
  console.log('👥 Creating test users...');
  
  for (const user of TEST_USERS) {
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {
        ...user,
        role: 'owner'
      });
      console.log(`✅ Created user: ${user.email}`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️  User already exists: ${user.email}`);
      } else {
        console.warn(`⚠️  Failed to create user ${user.email}: ${error.message}`);
      }
    }
  }
}

async function verifyAuthEndpoints() {
  console.log('🔐 Verifying auth endpoints...');
  
  const testUser = TEST_USERS[0];
  
  try {
    // Test login
    const loginResponse = await axios.post(`${WEB_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log(`✅ Login endpoint working: ${loginResponse.status}`);
    
    // Extract cookies for further testing
    const cookies = loginResponse.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';
    
    // Test dashboard access
    const dashboardResponse = await axios.get(`${WEB_BASE_URL}/dashboard`, {
      headers: { Cookie: cookieHeader }
    });
    
    console.log(`✅ Dashboard access working: ${dashboardResponse.status}`);
    
    // Test logout
    const logoutResponse = await axios.post(`${WEB_BASE_URL}/auth/logout`, {}, {
      headers: { Cookie: cookieHeader }
    });
    
    console.log(`✅ Logout endpoint working: ${logoutResponse.status}`);
    
  } catch (error) {
    throw new Error(`Auth endpoint verification failed: ${error.message}`);
  }
}

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users...');
  
  // Note: This would require an admin endpoint to delete users
  // For now, we'll just log the cleanup intent
  console.log('ℹ️  Test user cleanup would require admin privileges');
  console.log('ℹ️  Consider implementing a cleanup endpoint for test environments');
}

// Performance monitoring during load test
function startPerformanceMonitoring() {
  console.log('📊 Starting performance monitoring...');
  
  const startTime = Date.now();
  let requestCount = 0;
  let errorCount = 0;
  
  const interval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const rps = requestCount / elapsed;
    const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;
    
    console.log(`📈 Performance: ${rps.toFixed(2)} RPS, ${errorRate.toFixed(2)}% errors`);
  }, 10000); // Log every 10 seconds
  
  return {
    stop: () => clearInterval(interval),
    recordRequest: () => requestCount++,
    recordError: () => errorCount++
  };
}

// Load test result analysis
function analyzeResults(reportPath) {
  console.log('📊 Analyzing load test results...');
  
  try {
    const fs = require('fs');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    console.log('\n📈 Load Test Summary:');
    console.log(`   Total Requests: ${report.aggregate.counters['http.requests']}`);
    console.log(`   Success Rate: ${(100 - (report.aggregate.counters['http.request_rate'] || 0)).toFixed(2)}%`);
    console.log(`   Average Response Time: ${report.aggregate.latency.mean.toFixed(2)}ms`);
    console.log(`   95th Percentile: ${report.aggregate.latency.p95.toFixed(2)}ms`);
    console.log(`   99th Percentile: ${report.aggregate.latency.p99.toFixed(2)}ms`);
    
    // Performance thresholds
    const thresholds = {
      successRate: 99,
      avgResponseTime: 1000,
      p95ResponseTime: 2000,
      p99ResponseTime: 5000
    };
    
    const successRate = 100 - (report.aggregate.counters['http.request_rate'] || 0);
    const avgResponseTime = report.aggregate.latency.mean;
    const p95ResponseTime = report.aggregate.latency.p95;
    const p99ResponseTime = report.aggregate.latency.p99;
    
    console.log('\n🎯 Performance Analysis:');
    console.log(`   Success Rate: ${successRate >= thresholds.successRate ? '✅' : '❌'} ${successRate.toFixed(2)}% (target: >${thresholds.successRate}%)`);
    console.log(`   Avg Response: ${avgResponseTime <= thresholds.avgResponseTime ? '✅' : '❌'} ${avgResponseTime.toFixed(2)}ms (target: <${thresholds.avgResponseTime}ms)`);
    console.log(`   95th Percentile: ${p95ResponseTime <= thresholds.p95ResponseTime ? '✅' : '❌'} ${p95ResponseTime.toFixed(2)}ms (target: <${thresholds.p95ResponseTime}ms)`);
    console.log(`   99th Percentile: ${p99ResponseTime <= thresholds.p99ResponseTime ? '✅' : '❌'} ${p99ResponseTime.toFixed(2)}ms (target: <${thresholds.p99ResponseTime}ms)`);
    
  } catch (error) {
    console.error('❌ Failed to analyze results:', error.message);
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      setupLoadTest();
      break;
    case 'cleanup':
      cleanupTestUsers();
      break;
    case 'analyze':
      const reportPath = process.argv[3] || 'report.json';
      analyzeResults(reportPath);
      break;
    default:
      console.log('Usage:');
      console.log('  node setup-load-test.js setup    - Setup load test environment');
      console.log('  node setup-load-test.js cleanup  - Cleanup test users');
      console.log('  node setup-load-test.js analyze [report.json] - Analyze results');
      break;
  }
}

module.exports = {
  setupLoadTest,
  cleanupTestUsers,
  analyzeResults,
  startPerformanceMonitoring
};
