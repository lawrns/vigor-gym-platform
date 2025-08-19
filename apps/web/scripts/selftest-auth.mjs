#!/usr/bin/env node

/**
 * Auth Self-Test Runner
 *
 * Executes comprehensive auth system validation including:
 * - Type checking
 * - Linting
 * - Unit tests
 * - Integration tests
 * - E2E tests
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 Starting Auth System Self-Test...\n');

const steps = [
  {
    name: 'Node.js Version',
    cmd: 'node',
    args: ['-v'],
    description: 'Verify Node.js runtime',
  },
  {
    name: 'TypeScript Check',
    cmd: 'npm',
    args: ['run', 'typecheck'],
    description: 'Validate TypeScript compilation',
  },
  {
    name: 'ESLint',
    cmd: 'npm',
    args: ['run', 'lint'],
    description: 'Check code quality and style',
  },
  {
    name: 'Unit Tests - Error Handling',
    cmd: 'npm',
    args: ['run', 'test', '--', '__tests__/unit/errors.isAPIClientError.test.ts'],
    description: 'Test error type guards and APIClientError',
  },
  {
    name: 'Integration Tests - Auth Flow',
    cmd: 'npm',
    args: ['run', 'test', '--', '__tests__/integration/auth.flow.guest_redirects.test.ts'],
    description: 'Test guest redirect behavior',
  },
  {
    name: 'E2E Tests - Auth Spec',
    cmd: 'npx',
    args: ['playwright', 'test', 'tests/e2e/auth-flow.spec.ts', '--reporter=line'],
    description: 'End-to-end authentication flows',
  },
];

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📋 ${options.name || cmd}`);
    console.log(`   ${options.description || 'Running command'}`);
    console.log(`   Command: ${cmd} ${args.join(' ')}\n`);

    const process = spawn(cmd, args, {
      stdio: 'inherit',
      cwd: projectRoot,
      shell: true,
    });

    process.on('exit', code => {
      if (code === 0) {
        console.log(`✅ ${options.name || cmd} passed\n`);
        resolve();
      } else {
        console.error(`❌ ${options.name || cmd} failed with exit code ${code}\n`);
        reject(new Error(`${cmd} failed with exit code ${code}`));
      }
    });

    process.on('error', error => {
      console.error(`❌ ${options.name || cmd} failed to start:`, error.message);
      reject(error);
    });
  });
}

async function runSelfTest() {
  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  for (const step of steps) {
    try {
      await run(step.cmd, step.args, {
        name: step.name,
        description: step.description,
      });
      passed++;
    } catch (error) {
      failed++;
      console.error(`\n💥 Step "${step.name}" failed:`, error.message);

      // Continue with other tests unless it's a critical failure
      if (step.name.includes('TypeScript') || step.name.includes('Unit Tests')) {
        console.error('🛑 Critical test failed. Stopping execution.');
        break;
      }
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 AUTH SELF-TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All auth system tests passed! System is ready for production.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Handle process interruption
process.on('SIGINT', () => {
  console.log('\n\n🛑 Self-test interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Self-test terminated');
  process.exit(143);
});

// Run the self-test
runSelfTest().catch(error => {
  console.error('\n💥 Self-test runner failed:', error.message);
  process.exit(1);
});
