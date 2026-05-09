import { mkdirSync } from 'fs';
import { resolve } from 'path';

import tailwindcss from '@tailwindcss/vite';
import type { UserConfig } from 'vite';
import { defineConfig, loadEnv } from 'vite';

import { PostBuildPlugin } from './vite-plugin-post-build';

let globalProperties = '';

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
      {
        name: 'tailwind-split-and-inject',
        enforce: 'pre',
        transform(code, id) {
          if (!id.includes('tailwind.css')) {
            return undefined;
          }

          const propertyRegex = /@property\s+--[\w-]+\s*\{[^}]+\}/g;
          globalProperties = code.match(propertyRegex)?.join('\n') || '';

          return {
            code: code.replace(propertyRegex, ''),
          };
        },
        transformIndexHtml(html) {
          if (!globalProperties) {
            return html;
          }

          return html.replace('</head>', `\n<style id="tw-properties">\n${globalProperties}\n</style>\n</head>`);
        },
      },
      PostBuildPlugin(),
    ],
    server: {
      port: Number(process.env.PORT) || 3000,
    },
  });
};
