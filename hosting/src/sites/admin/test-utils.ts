import { expect, type Page } from '@playwright/test';

export async function expectLoginPage(page: Page): Promise<void> {
  await expect(page.locator('h2:has-text("アカウントにログイン")')).toBeVisible();
  await expect(page.locator('button[type="submit"]:has-text("ログイン")')).toBeVisible();
}

export async function waitForAdminShell(page: Page): Promise<void> {
  await expect(page.locator('a[href="/dashboard/"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('h1:has-text("Hello, Dashboard!")')).toBeVisible();
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expectLoginPage(page);

  await page.fill('input[type="email"]', 'admin@playwright.test');
  await page.fill('input[type="password"]', 'mi6O4yUkNb');

  await Promise.all([
    page.waitForURL('**/'),
    page.click('button[type="submit"]'),
  ]);

  await waitForAdminShell(page);
}