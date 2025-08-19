import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/**', 'dist/**', 'src/generated/**', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
});
