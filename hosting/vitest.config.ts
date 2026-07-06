import { resolve } from 'path';

import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.ts'],
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
