import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.ts'],
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
        'node_modules/',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        '**/*.d.ts',
        'vite.config.ts',
        'vitest.config.ts',
        'src/**/index.ts',
        'src/app/element/tailwind.css',
      ],
    },
  },
  resolve: {
    alias: {
      '@app': resolve(__dirname, './src/app'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@models': resolve(__dirname, './src/models'),
      '@assets': resolve(__dirname, './src/assets'),
    },
  },
});
