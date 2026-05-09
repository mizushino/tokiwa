import tailwindcss from '@tailwindcss/vite';
import { mkdirSync } from 'fs';
import { resolve } from 'path';
import type { UserConfig } from 'vite';
import { defineConfig, loadEnv } from 'vite';

import { PostBuildPlugin } from './vite-plugin-post-build';

export default ({ mode }: { mode: string }): UserConfig => {
  const site = process.env.APP_SITE || 'default';
  process.env = { ...process.env, ...loadEnv(mode, `${process.cwd()}/src/sites/${site}`) };

  const outDir = `../../../public/${site}`;
  const publicDir = resolve(process.cwd(), 'public', site);

  return defineConfig({
    root: `src/sites/${site}`,
    envDir: resolve(__dirname),
    publicDir,
    resolve: {
      alias: {
        '@firestore': resolve(__dirname, '../firestore/src'),
        '@functions': resolve(__dirname, '../functions/src'),
        '@app': resolve(__dirname, 'src/app'),
        '@assets': resolve(__dirname, 'src/assets'),
        '@components': resolve(__dirname, 'src/components'),
        '@models': resolve(__dirname, 'src/models'),
        '@services': resolve(__dirname, 'src/services'),
      },
    },
    build: {
      outDir,
      emptyOutDir: true,
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('firestore')) {
                return 'firestore';
              } else if (id.includes('firebase')) {
                return 'firebase';
              }
              return 'vendor';
            }
          },
        },
        onwarn: (warning, warn) => {
          if (warning.message.includes('dynamically imported')) {
            return;
          }
          warn(warning);
        },
      },
    },
    plugins: [
      {
        name: 'create-output-dir',
        buildStart() {
          mkdirSync(publicDir, { recursive: true });
        },
      },
      tailwindcss(),
      PostBuildPlugin(),
    ],
    server: {
      port: Number(process.env.PORT) || 3000,
    },
  });
};
