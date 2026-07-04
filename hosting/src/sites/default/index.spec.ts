import { expect, test, type Page } from '@playwright/test';

test.describe('Default Site - Index', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  const NAV_LABELS = [
    'Home',
    'Hello World',
    'Counter',
    'Lit-Async',
    'Firestore',
    'Functions',
    'Buttons',
    'Checkboxes',
    'Dropdown',
    'Modal',
  ];

  async function openIndex(page: Page): Promise<void> {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("Sample Site")')).toBeVisible();
  }

  test('homepage loads successfully', async ({ page }) => {
    await openIndex(page);

    await expect(page).toHaveTitle(/Sample Site/);
  });

  test('displays site heading', async ({ page }) => {
    await openIndex(page);

    await expect(page.locator('h1:has-text("Sample Site")')).toBeVisible();
  });

  test('displays all navigation buttons', async ({ page }) => {
    await openIndex(page);

    for (const label of NAV_LABELS) {
      await expect(page.locator(`ui-button:has-text("${label}")`).first()).toBeVisible();
    }
  });

  test('navigation to HelloWorld works', async ({ page }) => {
    await openIndex(page);

    await page.click('ui-button:has-text("Hello World")');
    await expect(page).toHaveURL(/\/helloworld\//);
  });

  test('navigation to Counter works', async ({ page }) => {
    await openIndex(page);

    await page.click('ui-button:has-text("Counter")');
    await expect(page).toHaveURL(/\/counter\//);
  });

  test('navigation to Firestore works', async ({ page }) => {
    await openIndex(page);

    await page.click('ui-button:has-text("Firestore")');
    await expect(page).toHaveURL(/\/firestore\//);
  });

  test('navigation to Functions works', async ({ page }) => {
    await openIndex(page);

    await page.click('ui-button:has-text("Functions")');
    await expect(page).toHaveURL(/\/functions\//);
  });

  test('navigation to Buttons works', async ({ page }) => {
    await openIndex(page);

    await page.click('ui-button:has-text("Buttons")');
    await expect(page).toHaveURL(/\/buttons\//);
  });

  test('navigation to Checkboxes works', async ({ page }) => {
    await openIndex(page);

    await page.click('ui-button:has-text("Checkboxes")');
    await expect(page).toHaveURL(/\/checkboxes\//);
  });

  test('navigation to Dropdown works', async ({ page }) => {
    await openIndex(page);

    await page.click('ui-button:has-text("Dropdown")');
    await expect(page).toHaveURL(/\/dropdown\//);
  });

  test('navigation to Modal works', async ({ page }) => {
    await openIndex(page);

    await page.click('ui-button:has-text("Modal")');
    await expect(page).toHaveURL(/\/modal\//);
  });

  test('navigation back to Home works', async ({ page }) => {
    await page.goto('/counter/');
    await expect(page.locator('#counter-value')).toHaveText('0');

    await page.click('ui-button:has-text("Home")');
    await expect(page).toHaveURL('http://localhost:5173/');
    await expect(page.locator('h1:has-text("Sample Site")')).toBeVisible();
  });
});
