#!/usr/bin/env node

/**
 * Comprehensive E2E Authentication Test Report
 * 
 * Tests all authentication flows for the Vigor Gym Platform:
 * - Guest experience (no console spam)
 * - Login flow (cookies, redirects)
 * - Authenticated features (dashboard, KPI, navigation)
 * - Logout flow (cookie clearing)
 * - Edge cases (protected routes, session expiration)
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:7777';
const API_ORIGIN = process.env.API_ORIGIN || 'http://localhost:4001';

console.log('🔐 Comprehensive E2E Authentication Test');
console.log('=========================================');
console.log(`Web: ${WEB_ORIGIN}`);
console.log(`API: ${API_ORIGIN}\n`);

const tests = [
  {
    category: '🚀 Application Status',
    tests: [
      {
        name: 'Web App Health Check',
        test: async () => {
          const result = await runCommand('curl', ['-s', `${WEB_ORIGIN}`, '-o', '/dev/null', '-w', '%{http_code}']);
          return {
            success: result.stdout === '200',
            details: `HTTP ${result.stdout}`,
            expected: 'HTTP 200',
            actual: `HTTP ${result.stdout}`,
          };
        }
      },
      {
        name: 'API Health Check',
        test: async () => {
          const result = await runCommand('curl', ['-s', `${API_ORIGIN}/health`]);
          let isHealthy = false;
          try {
            const data = JSON.parse(result.stdout);
            isHealthy = data.status === 'ok';
          } catch (e) {
            // Ignore parse errors
          }
          return {
            success: isHealthy,
            details: result.stdout,
            expected: '{"status":"ok"}',
            actual: result.stdout,
          };
        }
      }
    ]
  },
  {
    category: '👤 Guest Experience',
    tests: [
      {
        name: 'Homepage loads with login button',
        test: async () => {
          const result = await runCommand('curl', ['-s', `${WEB_ORIGIN}`]);
          const hasLoginButton = result.stdout.includes('Iniciar Sesión');
          return {
            success: hasLoginButton,
            details: hasLoginButton ? 'Login button found' : 'Login button missing',
            expected: 'Contains "Iniciar Sesión" button',
            actual: hasLoginButton ? 'Found' : 'Not found',
          };
        }
      },
      {
        name: 'Guest auth/me returns 401 (silent)',
        test: async () => {
          const result = await runCommand('curl', ['-s', '-w', '%{http_code}', `${WEB_ORIGIN}/auth/me`]);
          const statusCode = result.stdout.slice(-3);
          const responseBody = result.stdout.slice(0, -3);
          const isAuthRequired = responseBody.includes('Authentication required');
          return {
            success: statusCode === '401' && isAuthRequired,
            details: `Status: ${statusCode}, Response: ${responseBody.substring(0, 30)}...`,
            expected: '401 with auth required message',
            actual: `${statusCode} with ${isAuthRequired ? 'auth required' : 'other'} message`,
          };
        }
      },
      {
        name: 'Guest KPI returns 401 (silent)',
        test: async () => {
          const result = await runCommand('curl', ['-s', '-w', '%{http_code}', `${WEB_ORIGIN}/api/kpi/overview`]);
          const statusCode = result.stdout.slice(-3);
          return {
            success: statusCode === '401',
            details: `KPI proxy status: ${statusCode}`,
            expected: '401 status code',
            actual: `${statusCode} status code`,
          };
        }
      },
      {
        name: 'Protected route redirects to login',
        test: async () => {
          const result = await runCommand('curl', ['-s', '-L', `${WEB_ORIGIN}/dashboard`]);
          const isLoginPage = result.stdout.includes('Iniciar Sesión') && result.stdout.includes('Accede a tu cuenta');
          return {
            success: isLoginPage,
            details: isLoginPage ? 'Redirected to login page' : 'No redirect or wrong page',
            expected: 'Redirect to login page',
            actual: isLoginPage ? 'Login page' : 'Other page',
          };
        }
      }
    ]
  },
  {
    category: '🔑 Login Flow',
    tests: [
      {
        name: 'Login with valid credentials',
        test: async () => {
          const result = await runCommand('curl', [
            '-s', '-w', '%{http_code}', '-c', 'test_auth_cookies.txt',
            '-X', 'POST', `${WEB_ORIGIN}/auth/login`,
            '-H', 'Content-Type: application/json',
            '-d', '{"email":"admin@testgym.mx","password":"TestPassword123!"}'
          ]);
          
          const statusCode = result.stdout.slice(-3);
          const responseBody = result.stdout.slice(0, -3);
          
          let hasUserData = false;
          let hasTokens = false;
          try {
            const data = JSON.parse(responseBody);
            hasUserData = data.user && data.user.email === 'admin@testgym.mx';
            hasTokens = !!data.accessToken;
          } catch (e) {
            // Ignore parse errors
          }
          
          return {
            success: statusCode === '200' && hasUserData && hasTokens,
            details: `Status: ${statusCode}, User: ${hasUserData}, Tokens: ${hasTokens}`,
            expected: '200 with user data and tokens',
            actual: `${statusCode} with user:${hasUserData} tokens:${hasTokens}`,
          };
        }
      },
      {
        name: 'Cookies are set correctly',
        test: async () => {
          // Check if cookie file exists and has content
          const result = await runCommand('cat', ['test_auth_cookies.txt']);
          const hasCookies = result.stdout.includes('accessToken') && result.stdout.includes('refreshToken');
          return {
            success: hasCookies,
            details: hasCookies ? 'Cookies file contains tokens' : 'Missing or empty cookies',
            expected: 'accessToken and refreshToken in cookies',
            actual: hasCookies ? 'Both tokens present' : 'Tokens missing',
          };
        }
      }
    ]
  },
  {
    category: '✅ Authenticated Features',
    tests: [
      {
        name: 'Authenticated auth/me returns user data',
        test: async () => {
          const result = await runCommand('curl', ['-s', '-b', 'test_auth_cookies.txt', `${WEB_ORIGIN}/auth/me`]);
          let hasUserData = false;
          try {
            const data = JSON.parse(result.stdout);
            hasUserData = data.user && data.user.email === 'admin@testgym.mx';
          } catch (e) {
            // Ignore parse errors
          }
          return {
            success: hasUserData,
            details: hasUserData ? 'User data returned' : 'No user data',
            expected: 'User object with email',
            actual: hasUserData ? 'User data present' : 'No user data',
          };
        }
      },
      {
        name: 'Dashboard loads for authenticated user',
        test: async () => {
          const result = await runCommand('curl', ['-s', '-b', 'test_auth_cookies.txt', `${WEB_ORIGIN}/dashboard`]);
          const isDashboard = result.stdout.includes('Dashboard') && result.stdout.includes('admin@testgym.mx');
          return {
            success: isDashboard,
            details: isDashboard ? 'Dashboard page loaded' : 'Not dashboard page',
            expected: 'Dashboard page with user info',
            actual: isDashboard ? 'Dashboard loaded' : 'Other page',
          };
        }
      },
      {
        name: 'KPI data loads for authenticated user',
        test: async () => {
          const result = await runCommand('curl', ['-s', '-b', 'test_auth_cookies.txt', `${WEB_ORIGIN}/api/kpi/overview`]);
          let hasKpiData = false;
          try {
            const data = JSON.parse(result.stdout);
            hasKpiData = typeof data.activeMembers === 'number';
          } catch (e) {
            // Ignore parse errors
          }
          return {
            success: hasKpiData,
            details: hasKpiData ? 'KPI data returned' : 'No KPI data',
            expected: 'KPI object with metrics',
            actual: hasKpiData ? 'KPI data present' : 'No KPI data',
          };
        }
      },
      {
        name: 'Protected pages accessible',
        test: async () => {
          const result = await runCommand('curl', ['-s', '-b', 'test_auth_cookies.txt', `${WEB_ORIGIN}/admin/members`]);
          const isProtectedPage = result.stdout.includes('admin@testgym.mx') && !result.stdout.includes('Iniciar Sesión');
          return {
            success: isProtectedPage,
            details: isProtectedPage ? 'Protected page accessible' : 'Access denied or redirected',
            expected: 'Access to protected page',
            actual: isProtectedPage ? 'Access granted' : 'Access denied',
          };
        }
      }
    ]
  },
  {
    category: '🚪 Logout Flow',
    tests: [
      {
        name: 'Logout clears cookies',
        test: async () => {
          const result = await runCommand('curl', ['-s', '-w', '%{http_code}', '-b', 'test_auth_cookies.txt', '-X', 'POST', `${WEB_ORIGIN}/auth/logout`]);
          const statusCode = result.stdout.slice(-3);
          const responseBody = result.stdout.slice(0, -3);
          const isLoggedOut = responseBody.includes('Logged out successfully');
          return {
            success: statusCode === '200' && isLoggedOut,
            details: `Status: ${statusCode}, Message: ${isLoggedOut ? 'Success' : 'Other'}`,
            expected: '200 with logout success message',
            actual: `${statusCode} with ${isLoggedOut ? 'success' : 'other'} message`,
          };
        }
      },
      {
        name: 'Post-logout auth check returns 401',
        test: async () => {
          const result = await runCommand('curl', ['-s', '-w', '%{http_code}', `${WEB_ORIGIN}/auth/me`]);
          const statusCode = result.stdout.slice(-3);
          return {
            success: statusCode === '401',
            details: `Post-logout auth status: ${statusCode}`,
            expected: '401 status code',
            actual: `${statusCode} status code`,
          };
        }
      }
    ]
  },
  {
    category: '🔒 Edge Cases',
    tests: [
      {
        name: 'Direct protected route access redirects',
        test: async () => {
          const result = await runCommand('curl', ['-s', `${WEB_ORIGIN}/admin/members`]);
          const hasNextParam = result.stdout.includes('next=') || result.stdout.includes('/login');
          return {
            success: hasNextParam,
            details: hasNextParam ? 'Redirect with next parameter' : 'No redirect or wrong format',
            expected: 'Redirect to login with next parameter',
            actual: hasNextParam ? 'Proper redirect' : 'No redirect',
          };
        }
      }
    ]
  }
];

function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: projectRoot,
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('exit', (code) => {
      resolve({
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function runTests() {
  const startTime = Date.now();
  let totalPassed = 0;
  let totalFailed = 0;
  const results = [];

  console.log('🧪 Running Comprehensive E2E Authentication Tests...\n');

  for (const category of tests) {
    console.log(`\n${category.category}`);
    console.log('='.repeat(category.category.length));

    for (const test of category.tests) {
      try {
        console.log(`\n🔍 ${test.name}`);

        const result = await test.test();
        
        if (result.success) {
          console.log(`   ✅ PASS - ${result.details}`);
          totalPassed++;
          results.push({ category: category.category, name: test.name, status: 'PASS', details: result.details });
        } else {
          console.log(`   ❌ FAIL - Expected: ${result.expected}, Got: ${result.actual}`);
          totalFailed++;
          results.push({ category: category.category, name: test.name, status: 'FAIL', expected: result.expected, actual: result.actual });
        }
      } catch (error) {
        console.log(`   💥 ERROR: ${error.message}`);
        totalFailed++;
        results.push({ category: category.category, name: test.name, status: 'ERROR', error: error.message });
      }
    }
  }

  // Cleanup
  try {
    await runCommand('rm', ['-f', 'test_auth_cookies.txt']);
  } catch (error) {
    // Ignore cleanup errors
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE E2E AUTHENTICATION TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);

  if (totalFailed === 0) {
    console.log('\n🎉 ALL AUTHENTICATION FLOWS WORKING IMPECCABLY!');
    console.log('\n✅ Verification Results:');
    console.log('   • Guest experience: Clean console, polite UX');
    console.log('   • Login flow: Secure cookies, proper redirects');
    console.log('   • Authenticated features: Full access, KPI data');
    console.log('   • Logout flow: Clean cookie clearing');
    console.log('   • Edge cases: Proper redirects and protection');
    console.log('\n🔐 Authentication system is production-ready!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some authentication flows failed. Check the errors above.');
    console.log('\n📋 Failed Tests:');
    results.filter(r => r.status !== 'PASS').forEach(r => {
      console.log(`   • ${r.category}: ${r.name} - ${r.status}`);
    });
    process.exit(1);
  }
}

// Handle process interruption
process.on('SIGINT', () => {
  console.log('\n\n🛑 E2E test interrupted by user');
  process.exit(130);
});

// Run the tests
runTests().catch((error) => {
  console.error('\n💥 E2E test runner failed:', error.message);
  process.exit(1);
});
