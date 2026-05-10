import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    globalSetup: './src/test-setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        perFile: true,
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      exclude: [
        'lib/**',
        'node_modules/**',
        '**/*.test.ts',
        '**/*.config.*',
        'src/test-setup.ts',
        'src/models/**',
        'src/test/**',
      ],
    },
    // Ensure tests run sequentially to avoid emulator conflicts
    fileParallelism: false,
    pool: 'forks',
    maxConcurrency: 1,
    // Increase timeout for emulator tests
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@firestore': resolve(__dirname, '../firestore/src'),
      src: resolve(__dirname, './src'),
    },
  },
});
