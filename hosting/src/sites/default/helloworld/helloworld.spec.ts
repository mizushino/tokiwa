import { expect, test } from '@playwright/test';

test.describe('Default Site - Hello World', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/helloworld/', { waitUntil: 'domcontentloaded' });

    // Check page title
    await expect(page).toHaveTitle(/Hello World/);
  });

  test('displays hello world message', async ({ page }) => {
    await page.goto('/helloworld/', { waitUntil: 'domcontentloaded' });

    const heading = page.locator('h1:has-text("Hello, World!")');
    await expect(heading).toBeVisible();
  });

  test('navigation buttons work', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('button:has-text("[HelloWorld]")')).toBeVisible();

    await page.click('button:has-text("[HelloWorld]")');

    await expect(page).toHaveURL(/\/helloworld\//);
    const heading = page.locator('h1:has-text("Hello, World!")');
    await expect(heading).toBeVisible();
  });
});
