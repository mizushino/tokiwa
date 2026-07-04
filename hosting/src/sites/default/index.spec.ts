import { expect, test, type Page } from '@playwright/test';

test.describe('Default Site - Index', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  async function openIndex(page: Page): Promise<void> {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("Sample")')).toBeVisible();
    await expect(page.locator('h1:has-text("Index")')).toBeVisible();
  }

  test('homepage loads successfully', async ({ page }) => {
    await openIndex(page);

    await expect(page).toHaveTitle(/Sample Site/);
  });

  test('displays sample heading', async ({ page }) => {
    await openIndex(page);

    const heading = page.locator('h1:has-text("Sample")');
    await expect(heading).toBeVisible();
  });

  test('displays index heading in outlet', async ({ page }) => {
    await openIndex(page);

    const indexHeading = page.locator('h1:has-text("Index")');
    await expect(indexHeading).toBeVisible();
  });

  test('displays all navigation buttons', async ({ page }) => {
    await openIndex(page);

    await expect(page.locator('button:has-text("[Top]")')).toBeVisible();
    await expect(page.locator('button:has-text("[HelloWorld]")')).toBeVisible();
    await expect(page.locator('button:has-text("[Counter]")')).toBeVisible();
    await expect(page.locator('button:has-text("[Firestore]")')).toBeVisible();
    await expect(page.locator('button:has-text("[Functions]")')).toBeVisible();
    await expect(page.locator('button:has-text("[Buttons]")')).toBeVisible();
    await expect(page.locator('button:has-text("[Checkboxes]")')).toBeVisible();
    await expect(page.locator('button:has-text("[Dropdown]")')).toBeVisible();
    await expect(page.locator('button:has-text("[Modal]")')).toBeVisible();
  });

  test('navigation to HelloWorld works', async ({ page }) => {
    await openIndex(page);

    await page.click('button:has-text("[HelloWorld]")');
    await expect(page).toHaveURL(/\/helloworld\//);
  });

  test('navigation to Counter works', async ({ page }) => {
    await openIndex(page);

    await page.click('button:has-text("[Counter]")');
    await expect(page).toHaveURL(/\/counter\//);
  });

  test('navigation to Firestore works', async ({ page }) => {
    await openIndex(page);

    await page.click('button:has-text("[Firestore]")');
    await expect(page).toHaveURL(/\/firestore\//);
  });

  test('navigation to Functions works', async ({ page }) => {
    await openIndex(page);

    await page.click('button:has-text("[Functions]")');
    await expect(page).toHaveURL(/\/functions\//);
  });

  test('navigation to Buttons works', async ({ page }) => {
    await openIndex(page);

    await page.click('button:has-text("[Buttons]")');
    await expect(page).toHaveURL(/\/buttons\//);
  });

  test('navigation to Checkboxes works', async ({ page }) => {
    await openIndex(page);

    await page.click('button:has-text("[Checkboxes]")');
    await expect(page).toHaveURL(/\/checkboxes\//);
  });

  test('navigation to Dropdown works', async ({ page }) => {
    await openIndex(page);

    await page.click('button:has-text("[Dropdown]")');
    await expect(page).toHaveURL(/\/dropdown\//);
  });

  test('navigation to Modal works', async ({ page }) => {
    await openIndex(page);

    await page.click('button:has-text("[Modal]")');
    await expect(page).toHaveURL(/\/modal\//);
  });

  test('navigation back to Top works', async ({ page }) => {
    await page.goto('/counter/');
    await expect(page.locator('text=Count = 0')).toBeVisible();

    await page.click('button:has-text("[Top]")');
    await expect(page).toHaveURL('http://localhost:5173/');

    const indexHeading = page.locator('h1:has-text("Index")');
    await expect(indexHeading).toBeVisible();
  });
});
