import { expect, test } from '@playwright/test';

test.describe('Default Site - Firestore', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/firestore/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/Firestore/);
  });

  test('displays firestore UI elements', async ({ page }) => {
    await page.goto('/firestore/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#name-input')).toBeVisible();
    await expect(page.locator('ui-button:has-text("Save")')).toBeVisible();
    await expect(page.locator('ui-button:has-text("Load")')).toBeVisible();
  });

  test('displays realtime snapshot section', async ({ page }) => {
    await page.goto('/firestore/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h2:has-text("Realtime Snapshot")')).toBeVisible();
  });

  test('load button shows result', async ({ page }) => {
    await page.goto('/firestore/', { waitUntil: 'domcontentloaded' });

    await page.click('ui-button:has-text("Load")');

    await expect(page.locator('text=Load result:')).toBeVisible();
  });

  test('can input text in the text field', async ({ page }) => {
    await page.goto('/firestore/', { waitUntil: 'domcontentloaded' });

    const input = page.locator('#name-input');
    await input.fill('Test Value');

    await expect(input).toHaveValue('Test Value');
  });

  test('navigation buttons work', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.click('ui-button:has-text("Firestore")');

    await expect(page).toHaveURL(/\/firestore\//);
    await expect(page.locator('ui-button:has-text("Save")')).toBeVisible();
  });
});
