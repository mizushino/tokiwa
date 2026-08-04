import { readFileSync } from 'fs';
import { resolve } from 'path';

import tailwindcss from '@tailwindcss/vite';
import type { UserConfig } from 'vite-plus';
import { defineConfig, loadEnv } from 'vite-plus';

import { allowsDemoFirebaseConfig, getFirebaseConfig } from './src/app/firebase-config';
import { PostBuildPlugin } from './vite-plugin-post-build';

const lint = JSON.parse(readFileSync(resolve(__dirname, 'oxlint-rules.json'), 'utf8'));
const appSitePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

let globalProperties = '';

export function getAppSite(value = process.env.APP_SITE): string {
  const site = value || 'default';
  if (!appSitePattern.test(site)) {
    throw new Error(`Invalid APP_SITE: ${site}`);
  }
  return site;
}

export function loadSiteEnvironment(mode: string, site: string, hostingDirectory = __dirname): NodeJS.ProcessEnv {
  const validatedSite = getAppSite(site);
  const sharedEnvironment = loadEnv(mode, hostingDirectory);
  const siteEnvironment = loadEnv(mode, resolve(hostingDirectory, 'src', 'sites', validatedSite));

  return {
    ...sharedEnvironment,
    ...siteEnvironment,
    ...process.env,
  };
}

export default ({ mode }: { mode: string }): UserConfig => {
  const site = getAppSite();
  const environment = loadSiteEnvironment(mode, site);
  process.env = { ...process.env, ...environment };
  getFirebaseConfig(environment, { allowDemoFallback: allowsDemoFirebaseConfig(mode) });

  const outDir = `../../../public/${site}`;

  return defineConfig({
    lint,
    root: `src/sites/${site}`,
    envDir: resolve(__dirname),
    publicDir: false,
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
      PostBuildPlugin(site),
    ],
    server: {
      port: Number(process.env.PORT) || 3000,
    },
  });
};
