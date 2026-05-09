import { expect, test } from '@playwright/test';

import { loginAsAdmin } from '../test-utils';

test.describe('Admin Site - Hello World', () => {
  test.use({ baseURL: 'http://localhost:5174' });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/helloworld/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Check page title (exact match)
    await expect(page).toHaveTitle('Hello, World!');
  });

  test('displays hello world message', async ({ page }) => {
    await page.goto('/helloworld/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const heading = page.locator('h1:has-text("Hello, World!")');
    await expect(heading).toBeVisible();
  });

  test('navigation from sidebar works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Click Hello World navigation link
    await page.click('a[href="/helloworld/"]');

    // Verify navigation to helloworld page
    await expect(page).toHaveURL(/\/helloworld\//);
    const heading = page.locator('h1:has-text("Hello, World!")');
    await expect(heading).toBeVisible();
  });
});
