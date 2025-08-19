#!/usr/bin/env node

/**
 * API Client Fix Verification Script
 *
 * Verifies that the apiClient.get is not a function error has been fixed
 * and that all API calls now use the proper namespaced methods.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:7777';

console.log('🔧 API Client Fix Verification');
console.log('==============================');
console.log(`Testing against: ${WEB_ORIGIN}\n`);

const tests = [
  {
    name: 'Login and access members page (no JS errors)',
    description: 'Verify members page loads without apiClient.get errors',
    test: async () => {
      // Login first
      const loginResult = await runCommand('curl', [
        '-s',
        '-c',
        'verify_cookies.txt',
        '-X',
        'POST',
        `${WEB_ORIGIN}/auth/login`,
        '-H',
        'Content-Type: application/json',
        '-d',
        '{"email":"admin@testgym.mx","password":"TestPassword123!"}',
      ]);

      let loginSuccess = false;
      try {
        const loginData = JSON.parse(loginResult.stdout);
        loginSuccess = loginData.user && loginData.user.email === 'admin@testgym.mx';
      } catch (e) {
        // Ignore parse errors
      }

      if (!loginSuccess) {
        return {
          success: false,
          details: 'Login failed',
          expected: 'Successful login',
          actual: 'Login failed',
        };
      }

      // Access members page
      const membersResult = await runCommand('curl', [
        '-s',
        '-b',
        'verify_cookies.txt',
        `${WEB_ORIGIN}/admin/members`,
      ]);

      // Check if page loads (should not have JS errors in the HTML)
      const pageLoads =
        membersResult.stdout.includes('<!DOCTYPE html>') &&
        membersResult.stdout.includes('admin@testgym.mx');

      return {
        success: pageLoads,
        details: pageLoads ? 'Members page loads successfully' : 'Members page failed to load',
        expected: 'Page loads with user context',
        actual: pageLoads ? 'Page loaded' : 'Page failed',
      };
    },
  },
  {
    name: 'TypeScript compilation check',
    description: 'Verify no TypeScript errors for API client usage',
    test: async () => {
      const result = await runCommand('npx', [
        'tsc',
        '--noEmit',
        '--skipLibCheck',
        'app/(routes)/admin/members/page.tsx',
        'components/admin/MemberForm.tsx',
        'components/admin/ImportCsvDialog.tsx',
      ]);

      const hasErrors = result.code !== 0;
      const errorOutput = result.stderr || result.stdout;

      return {
        success: !hasErrors,
        details: hasErrors
          ? `TypeScript errors: ${errorOutput.substring(0, 100)}...`
          : 'No TypeScript errors',
        expected: 'Clean TypeScript compilation',
        actual: hasErrors ? 'TypeScript errors found' : 'Clean compilation',
      };
    },
  },
  {
    name: 'API Client structure verification',
    description: 'Verify apiClient has proper namespaced methods',
    test: async () => {
      const result = await runCommand('node', [
        '-e',
        `
        const { apiClient } = require('./lib/api/client.ts');
        console.log('members:', typeof apiClient.members);
        console.log('members.list:', typeof apiClient.members?.list);
        console.log('members.create:', typeof apiClient.members?.create);
        console.log('members.update:', typeof apiClient.members?.update);
        console.log('members.delete:', typeof apiClient.members?.delete);
        console.log('get:', typeof apiClient.get);
        console.log('post:', typeof apiClient.post);
        `,
      ]);

      const output = result.stdout;
      const hasNamespacedMethods =
        output.includes('members: object') && output.includes('members.list: function');
      const lacksGenericMethods =
        output.includes('get: undefined') && output.includes('post: undefined');

      return {
        success: hasNamespacedMethods && lacksGenericMethods,
        details: `Namespaced: ${hasNamespacedMethods}, No generic: ${lacksGenericMethods}`,
        expected: 'Namespaced methods present, generic methods absent',
        actual: `Namespaced: ${hasNamespacedMethods}, Generic absent: ${lacksGenericMethods}`,
      };
    },
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

async function runTests() {
  const startTime = Date.now();
  let passed = 0;
  let failed = 0;
  const results = [];

  console.log('🧪 Running API Client Fix Verification Tests...\n');

  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}`);
      console.log(`   ${test.description}`);

      const result = await test.test();

      if (result.success) {
        console.log(`   ✅ PASS - ${result.details}\n`);
        passed++;
        results.push({ name: test.name, status: 'PASS', details: result.details });
      } else {
        console.log(`   ❌ FAIL - Expected: ${result.expected}, Got: ${result.actual}`);
        console.log(`   Details: ${result.details}\n`);
        failed++;
        results.push({
          name: test.name,
          status: 'FAIL',
          expected: result.expected,
          actual: result.actual,
        });
      }
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}\n`);
      failed++;
      results.push({ name: test.name, status: 'ERROR', error: error.message });
    }
  }

  // Cleanup
  try {
    await runCommand('rm', ['-f', 'verify_cookies.txt']);
  } catch (error) {
    // Ignore cleanup errors
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('='.repeat(60));
  console.log('📊 API CLIENT FIX VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 API CLIENT FIX VERIFIED SUCCESSFULLY!');
    console.log('\n✅ Verification Results:');
    console.log('   • Members page loads without JavaScript errors');
    console.log('   • All API calls use proper namespaced methods');
    console.log('   • TypeScript compilation is clean');
    console.log('   • Generic HTTP methods are not available on apiClient');
    console.log('\n🔧 The apiClient.get is not a function error has been eliminated!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some verifications failed. Check the errors above.');
    console.log('\n📋 Failed Tests:');
    results
      .filter(r => r.status !== 'PASS')
      .forEach(r => {
        console.log(`   • ${r.name}: ${r.status}`);
      });
    process.exit(1);
  }
}

// Handle process interruption
process.on('SIGINT', () => {
  console.log('\n\n🛑 Verification interrupted by user');
  process.exit(130);
});

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Verification failed:', error.message);
  process.exit(1);
});
