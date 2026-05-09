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
      exclude: ['lib/**', 'node_modules/**', '**/*.test.ts', '**/*.config.*', 'src/test-setup.ts', 'src/models/**'],
    },
    // Ensure tests run sequentially to avoid emulator conflicts
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
