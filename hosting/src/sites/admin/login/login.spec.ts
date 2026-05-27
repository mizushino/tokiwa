import { expect, test } from '@playwright/test';

import { expectLoginPage, waitForAdminShell } from '../test-utils';

test.describe('Admin Site - Login', () => {
  test.use({ baseURL: 'http://localhost:5174' });

  test('login page loads successfully', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expectLoginPage(page);
  });

  test('displays login form elements', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("ログイン")')).toBeVisible();
  });

  test('displays social login buttons', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    await expect(page.locator('button:has-text("X (Twitter)")')).toBeVisible();
  });

  test('can login with email and password', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.fill('input[type="email"]', 'admin@playwright.test');
    await page.fill('input[type="password"]', 'mi6O4yUkNb');

    await Promise.all([page.waitForURL('**/'), page.click('button[type="submit"]')]);

    await waitForAdminShell(page);
  });

  test('shows error message for invalid credentials', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    const errorMessage = page.locator('.bg-red-50, .dark\\:bg-red-900\\/20');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('メールアドレスまたはパスワードが正しくありません。');
  });

  test('restores submit button after failed login', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await expect(page.locator('.bg-red-50, .dark\\:bg-red-900\\/20')).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await expect(submitButton).toContainText('ログイン');
  });
});
