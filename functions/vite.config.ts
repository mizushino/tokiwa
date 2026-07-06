import { readFileSync } from 'fs';
import { builtinModules } from 'module';
import { resolve } from 'path';

import type { UserConfig } from 'vite-plus';
import { defineConfig } from 'vite-plus';

// Provided by the Firebase runtime or installed from `dependencies` on deploy.
// Everything else (including transitive deps such as `uuid`) is bundled, matching
// the previous esbuild setup so `package.json` stays the source of truth.
const external = ['firebase-admin', 'firebase-functions', '@napi-rs/image'];
const isExternal = (id: string): boolean =>
  external.some((pkg) => id === pkg || id.startsWith(`${pkg}/`)) ||
  id.startsWith('node:') ||
  builtinModules.includes(id);

const lint = JSON.parse(readFileSync(resolve(__dirname, 'oxlint-rules.json'), 'utf8'));

// Firebase Cloud Functions build.
// SSR/node target: our own source (and the aliased `@firestore` sources) are
// bundled, while runtime dependencies stay external and are installed by
// Firebase from `package.json` on deploy. Output is a CommonJS bundle at
// `lib/index.cjs`, matching the package `main` field.
export default defineConfig({
  fmt: {
    tabWidth: 2,
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 120,
    sortPackageJson: false,
    ignorePatterns: [],
  },
  lint,
  resolve: {
    alias: {
      '@firestore': resolve(__dirname, '../firestore/src'),
      src: resolve(__dirname, 'src'),
    },
  },
  ssr: {
    // Bundle all dependencies except the ones marked external below.
    noExternal: true,
  },
  build: {
    ssr: resolve(__dirname, 'src/index.ts'),
    target: 'node24',
    outDir: 'lib',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'oxc',
    rollupOptions: {
      external: isExternal,
      output: {
        format: 'cjs',
        entryFileNames: 'index.cjs',
      },
    },
  },
}) as UserConfig;
