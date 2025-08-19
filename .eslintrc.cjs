/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'next/core-web-vitals', 'plugin:jest/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'jest'],
  rules: {
    // Security: Prevent importing server-only admin client in client components
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/supabase/admin'],
            message:
              'Supabase admin client should only be imported in server-side code. Use the regular client for browser code.',
          },
        ],
      },
    ],
    // Code quality
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    // API server configuration
    {
      files: ['apps/api/**/*.ts'],
      env: {
        node: true,
        browser: false,
      },
      extends: ['eslint:recommended'],
      rules: {
        // API-specific rules
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
    // Test files configuration
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true,
      },
      extends: ['plugin:jest/recommended'],
      rules: {
        // Allow any in tests for mocking
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    // Server-side Next.js files can import admin client
    {
      files: [
        'apps/web/app/**/route.ts',
        'apps/web/app/**/page.tsx',
        'apps/web/lib/auth/**/*.ts',
        'apps/web/lib/supabase/admin.ts',
      ],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'build/',
    '.next/',
    'node_modules/',
    '*.config.js',
    '*.config.mjs',
    'coverage/',
    'apps/api/src/generated/',
    'e2e-report/',
    'a11y-report/',
    'test-results/',
    'playwright-report/',
    '**/*.min.js',
    '**/*.bundle.js',
    // Service worker files
    '**/sw.js',
    '**/public/sw.js',
    // K6 test files (use different globals)
    '**/tests/k6/**/*.js',
    '**/tests/load/**/*.js',
    // Staging config files
    '**/*.staging.js',
    // Load test setup files
    '**/setup-load-test.js',
  ],
};
