import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const isCI = Boolean(env.CI);
const firebaseProjectId = env.FIREBASE_PROJECT_ID || 'tokiwa-template';

export default defineConfig({
  testDir: './src',
  testMatch: '**/*.spec.ts',
  outputDir: '../.artifacts/playwright/test-results',

  /* Global setup file */
  globalSetup: './global-setup.ts',

  /* Run tests with moderate parallelism to avoid overloading local emulators/dev servers */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: isCI,

  /* Retry on CI only */
  retries: isCI ? 2 : 0,

  /* Keep local parallelism moderate; 10 workers was overloading Vite + emulators. */
  workers: isCI ? 1 : 4,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { open: 'never', outputFolder: '../.artifacts/playwright/report' }]],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: `bash -lc 'lsof -ti:8080,9099,9199,4000 | xargs -r kill -9 2>/dev/null || true; mkdir -p ../.artifacts/firebase && cd ../.artifacts/firebase && exec npx firebase --config ../../firebase.json emulators:start --project ${firebaseProjectId} --only auth,firestore,storage'`,
      url: 'http://localhost:4000',
      reuseExistingServer: !isCI,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'PORT=5173 APP_SITE=default VITE_USE_EMULATOR=true npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !isCI,
      timeout: 120 * 1000,
    },
    {
      command: 'PORT=5174 APP_SITE=admin VITE_USE_EMULATOR=true npm run dev',
      url: 'http://localhost:5174',
      reuseExistingServer: !isCI,
      timeout: 120 * 1000,
    },
  ],
});
