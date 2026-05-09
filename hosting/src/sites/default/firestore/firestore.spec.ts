import { expect, test } from '@playwright/test';

test.describe('Default Site - Firestore', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/firestore/', { waitUntil: 'domcontentloaded' });

    // Check page title
    await expect(page).toHaveTitle(/Firestore/);
  });

  test('displays firestore UI elements', async ({ page }) => {
    await page.goto('/firestore/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('input.border.border-black')).toBeVisible();
    await expect(page.locator('button:has-text("[save]")')).toBeVisible();
    await expect(page.locator('button:has-text("[load]")')).toBeVisible();
  });

  test('displays snapshot data', async ({ page }) => {
    await page.goto('/firestore/', { waitUntil: 'domcontentloaded' });

    // Wait for snapshot to appear (realtime data)
    await page.waitForSelector('text=snapshot(realtime)');

    // Snapshot data should be visible
    await expect(page.locator('text=snapshot(realtime)')).toBeVisible();
  });

  test('load button shows loading state', async ({ page }) => {
    await page.goto('/firestore/', { waitUntil: 'domcontentloaded' });

    const pageBody = page.locator('body');
    const snapshot = page.locator('body');
    const loadButton = page.locator('button:has-text("[load]")');

    await loadButton.click();

    await expect(pageBody).toContainText('[load] => loading...');
    await expect(snapshot).toContainText('snapshot(realtime) =>');
  });

  test('can input text in the text field', async ({ page }) => {
    await page.goto('/firestore/', { waitUntil: 'domcontentloaded' });

    // Type in the input field
    const input = page.locator('input.border.border-black');
    await input.fill('Test Value');

    // Verify input value
    await expect(input).toHaveValue('Test Value');
  });

  test('navigation buttons work', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.click('button:has-text("[Firestore]")');

    await expect(page).toHaveURL(/\/firestore\//);
    await expect(page.locator('button:has-text("[save]")')).toBeVisible();
  });
});
