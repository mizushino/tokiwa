import { expect, test } from '@playwright/test';

test.describe('Default Site - Checkboxes', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/checkboxes/', { waitUntil: 'domcontentloaded' });

    const heading = page.locator('h1:has-text("Checkboxes")');
    await expect(heading).toBeVisible();
  });

  test('displays all sections', async ({ page }) => {
    await page.goto('/checkboxes/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h2:has-text("Sizes")')).toBeVisible();
    await expect(page.locator('h2:has-text("States")')).toBeVisible();
    await expect(page.locator('h2:has-text("Interactive Example")')).toBeVisible();
    await expect(page.locator('h2:has-text("Usage Examples")')).toBeVisible();
  });

  test('displays size examples', async ({ page }) => {
    await page.goto('/checkboxes/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=SM:').first()).toBeVisible();
    await expect(page.locator('text=MD:').first()).toBeVisible();
    await expect(page.locator('text=LG:').first()).toBeVisible();
  });

  test('displays state examples', async ({ page }) => {
    await page.goto('/checkboxes/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('ui-checkbox:has-text("Normal checkbox")')).toBeVisible();
    await expect(page.locator('ui-checkbox:has-text("Checked checkbox")')).toBeVisible();
    await expect(page.locator('ui-checkbox:has-text("Indeterminate checkbox")')).toBeVisible();
    await expect(page.locator('ui-checkbox:has-text("Disabled checkbox")')).toBeVisible();
  });

  test('interactive checkbox updates selected options', async ({ page }) => {
    await page.goto('/checkboxes/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('li:has-text("None selected")')).toBeVisible();

    await page.click('ui-checkbox:has-text("Option 1")');

    await expect(page.locator('li:has-text("Option 1")')).toBeVisible();
    await expect(page.locator('li:has-text("None selected")')).toBeHidden();

    await page.click('ui-checkbox:has-text("Option 1")');

    await expect(page.locator('li:has-text("None selected")')).toBeVisible();
  });

  test('navigation from footer works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.click('ui-button:has-text("Checkboxes")');

    await expect(page).toHaveURL(/\/checkboxes\//);
    const heading = page.locator('h1:has-text("Checkboxes")');
    await expect(heading).toBeVisible();
  });
});
