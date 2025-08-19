#!/usr/bin/env node

/**
 * Auth Fixes Verification Script
 *
 * Verifies that:
 * 1. Guest /auth/me returns 401 (expected)
 * 2. Login flow works correctly
 * 3. Authenticated /auth/me returns 200
 * 4. Cookie attributes are correct
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 Verifying Auth Fixes...\n');

const tests = [
  {
    name: 'Guest /auth/me (expect 401)',
    cmd: 'curl',
    args: ['-s', '-w', '%{http_code}', 'http://localhost:7777/auth/me'],
    expectedStatus: '401',
    description: 'Guest should get 401 without cookies',
  },
  {
    name: 'Login (expect 200 with cookies)',
    cmd: 'curl',
    args: [
      '-s',
      '-w',
      '%{http_code}',
      '-c',
      'test_cookies.txt',
      '-X',
      'POST',
      'http://localhost:7777/auth/login',
      '-H',
      'Content-Type: application/json',
      '-d',
      JSON.stringify({ email: 'admin@testgym.mx', password: 'TestPassword123!' }),
    ],
    expectedStatus: '200',
    description: 'Login should succeed and set cookies',
  },
  {
    name: 'Authenticated /auth/me (expect 200)',
    cmd: 'curl',
    args: ['-s', '-w', '%{http_code}', '-b', 'test_cookies.txt', 'http://localhost:7777/auth/me'],
    expectedStatus: '200',
    description: 'Authenticated user should get 200 with user data',
  },
];

function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: projectRoot,
      shell: true,
      ...options,
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', data => {
      stdout += data.toString();
    });

    process.stderr.on('data', data => {
      stderr += data.toString();
    });

    process.on('exit', code => {
      resolve({
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });

    process.on('error', error => {
      reject(error);
    });
  });
}

async function runVerification() {
  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  console.log('📋 Running HTTP Auth Flow Tests...\n');

  for (const test of tests) {
    try {
      console.log(`🧪 ${test.name}`);
      console.log(`   ${test.description}`);
      console.log(`   Command: ${test.cmd} ${test.args.join(' ')}`);

      const result = await runCommand(test.cmd, test.args);

      // Extract status code from the end of stdout (curl -w '%{http_code}')
      const output = result.stdout;
      const statusCode = output.slice(-3); // Last 3 characters should be the status code
      const responseBody = output.slice(0, -3); // Everything except the last 3 characters

      console.log(`   Status: ${statusCode}`);

      if (statusCode === test.expectedStatus) {
        console.log(`   ✅ PASS\n`);
        passed++;
      } else {
        console.log(`   ❌ FAIL - Expected ${test.expectedStatus}, got ${statusCode}`);
        console.log(`   Response: ${responseBody.substring(0, 100)}...`);
        console.log('');
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}\n`);
      failed++;
    }
  }

  // Additional verification: Check cookie attributes
  console.log('🍪 Checking Cookie Attributes...');
  try {
    const result = await runCommand('curl', [
      '-s',
      '-i',
      '-c',
      'cookie_check.txt',
      '-X',
      'POST',
      'http://localhost:7777/auth/login',
      '-H',
      'Content-Type: application/json',
      '-d',
      JSON.stringify({ email: 'admin@testgym.mx', password: 'TestPassword123!' }),
    ]);

    const headers = result.stdout;
    const hasHttpOnly = headers.includes('HttpOnly');
    const hasSameSiteLax = headers.includes('SameSite=Lax');
    const hasPath = headers.includes('Path=/');
    const hasSecure = headers.includes('Secure'); // Should be false in dev

    console.log(`   HttpOnly: ${hasHttpOnly ? '✅' : '❌'}`);
    console.log(`   SameSite=Lax: ${hasSameSiteLax ? '✅' : '❌'}`);
    console.log(`   Path=/: ${hasPath ? '✅' : '❌'}`);
    console.log(`   Secure (should be false in dev): ${!hasSecure ? '✅' : '❌'}`);

    if (hasHttpOnly && hasSameSiteLax && hasPath && !hasSecure) {
      console.log('   ✅ Cookie attributes correct\n');
      passed++;
    } else {
      console.log('   ❌ Cookie attributes incorrect\n');
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ ERROR checking cookies: ${error.message}\n`);
    failed++;
  }

  // Cleanup
  try {
    await runCommand('rm', ['-f', 'test_cookies.txt', 'cookie_check.txt']);
  } catch (error) {
    // Ignore cleanup errors
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('='.repeat(60));
  console.log('📊 AUTH FIXES VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All auth fixes verified! HTTP flow is working correctly.');
    console.log('\n📝 Next: Test in browser to verify console logging fixes.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some verifications failed. Please check the errors above.');
    process.exit(1);
  }
}

// Handle process interruption
process.on('SIGINT', () => {
  console.log('\n\n🛑 Verification interrupted by user');
  process.exit(130);
});

// Run the verification
runVerification().catch(error => {
  console.error('\n💥 Verification runner failed:', error.message);
  process.exit(1);
});
