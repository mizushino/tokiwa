import { expect, test } from '@playwright/test';

test.describe('Default Site - Dropdown', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/dropdown/', { waitUntil: 'domcontentloaded' });

    const heading = page.locator('h1:has-text("Dropdown")');
    await expect(heading).toBeVisible();
  });

  test('displays all sections', async ({ page }) => {
    await page.goto('/dropdown/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h2:has-text("Basic")')).toBeVisible();
    await expect(page.locator('h2:has-text("Sizes")')).toBeVisible();
    await expect(page.locator('h2:has-text("Placements")')).toBeVisible();
    await expect(page.locator('h2:has-text("Button Variants")')).toBeVisible();
    await expect(page.locator('h2:has-text("Features")')).toBeVisible();
  });

  test('displays trigger buttons', async ({ page }) => {
    await page.goto('/dropdown/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('ui-button:has-text("Options")')).toBeVisible();
    await expect(page.locator('ui-button:has-text("Small")')).toBeVisible();
    await expect(page.locator('ui-button:has-text("Medium")')).toBeVisible();
    await expect(page.locator('ui-button:has-text("Large")')).toBeVisible();
  });

  test('opens menu on trigger click', async ({ page }) => {
    await page.goto('/dropdown/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('a[href="#edit"]')).toBeHidden();

    await page.click('ui-button:has-text("Options")');

    await expect(page.locator('a[href="#edit"]')).toBeVisible();
    await expect(page.locator('a[href="#duplicate"]')).toBeVisible();
    await expect(page.locator('a[href="#archive"]')).toBeVisible();
  });

  test('closes menu with Escape key', async ({ page }) => {
    await page.goto('/dropdown/', { waitUntil: 'domcontentloaded' });

    await page.click('ui-button:has-text("Options")');
    await expect(page.locator('a[href="#edit"]')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.locator('a[href="#edit"]')).toBeHidden();
  });

  test('navigation from footer works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.click('ui-button:has-text("Dropdown")');

    await expect(page).toHaveURL(/\/dropdown\//);
    const heading = page.locator('h1:has-text("Dropdown")');
    await expect(heading).toBeVisible();
  });
});
