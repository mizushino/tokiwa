import { expect, test } from '@playwright/test';

import { loginAsAdmin } from '../test-utils';

test.describe('Admin Site - Buttons', () => {
  test.use({ baseURL: 'http://localhost:5174' });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/buttons/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Check page heading
    const heading = page.locator('h1:has-text("Button Components")');
    await expect(heading).toBeVisible();
  });

  test('displays all button variants', async ({ page }) => {
    await page.goto('/buttons/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Check section headings
    await expect(page.locator('h2:has-text("Variants")')).toBeVisible();
    await expect(page.locator('h2:has-text("Sizes")')).toBeVisible();
    await expect(page.locator('h2:has-text("Rounded")')).toBeVisible();
    await expect(page.locator('h2:has-text("States")')).toBeVisible();
    await expect(page.locator('h2:has-text("Usage Examples")')).toBeVisible();
  });

  test('displays variant buttons', async ({ page }) => {
    await page.goto('/buttons/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('ui-button:has-text("Primary")').first()).toBeVisible();
    await expect(page.locator('ui-button:has-text("Secondary")').first()).toBeVisible();
    await expect(page.locator('ui-button:has-text("Success")').first()).toBeVisible();
    await expect(page.locator('ui-button:has-text("Danger")').first()).toBeVisible();
  });

  test('displays size examples', async ({ page }) => {
    await page.goto('/buttons/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Check size labels (use first() to avoid strict mode)
    await expect(page.locator('text=XS:').first()).toBeVisible();
    await expect(page.locator('text=SM:').first()).toBeVisible();
    await expect(page.locator('text=MD:').first()).toBeVisible();
    await expect(page.locator('text=LG:').first()).toBeVisible();
    await expect(page.locator('text=XL:').first()).toBeVisible();
  });

  test('navigation from sidebar works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Click Buttons navigation link
    await page.click('a[href="/buttons/"]');

    // Verify navigation to buttons page
    await expect(page).toHaveURL(/\/buttons\//);
    const heading = page.locator('h1:has-text("Button Components")');
    await expect(heading).toBeVisible();
  });
});
