import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    globalSetup: './src/test-setup.ts',
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
