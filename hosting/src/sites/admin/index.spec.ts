import { expect, test } from '@playwright/test';

import { loginAsAdmin, waitForAdminShell } from './test-utils';

test.describe('Admin Site - Dashboard', () => {
  test.use({ baseURL: 'http://localhost:5174' });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('dashboard loads after login', async ({ page }) => {
    await waitForAdminShell(page);
  });

  test('displays sidebar with navigation items', async ({ page }) => {
    await waitForAdminShell(page);
    await expect(page.locator('a[href="/dashboard/"]')).toBeVisible();
    await expect(page.locator('a[href="/helloworld/"]')).toBeVisible();
    await expect(page.locator('a[href="/buttons/"]')).toBeVisible();
  });

  test('displays user profile in sidebar', async ({ page }) => {
    await waitForAdminShell(page);
    const profileImage = page.locator('ui-sidebar img[src*="gravatar"], ui-sidebar img[alt=""]');
    await expect(profileImage).toBeVisible();
  });

  test('navigation between pages works', async ({ page }) => {
    await waitForAdminShell(page);

    await page.click('a[href="/buttons/"]');
    await expect(page).toHaveURL(/\/buttons\//);

    await page.click('a[href="/dashboard/"]');
    await expect(page).toHaveURL(/\/dashboard\//);
  });

  test('sidebar badge is displayed', async ({ page }) => {
    await waitForAdminShell(page);
    const dashboardLink = page.locator('a[href="/dashboard/"]');
    const badge = dashboardLink.locator('span:has-text("5")');
    await expect(badge).toBeVisible();
  });

  test('logo is displayed in sidebar', async ({ page }) => {
    await waitForAdminShell(page);
    const logo = page.locator('svg[slot="logo"]');
    await expect(logo).toBeVisible();
  });

  test('can logout by clicking user profile', async ({ page }) => {
    await waitForAdminShell(page);
    const userProfile = page.locator('ui-sidebar a:has(img)').first();
    await expect(userProfile).toBeVisible();
    await userProfile.click();

    await expect(page.locator('h2:has-text("アカウントにログイン")')).toBeVisible({ timeout: 5000 });
  });
});
