import { expect, test } from '@playwright/test';

test.describe('Default Site - Counter', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/counter/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/Counter/);
  });

  test('displays initial count of 0', async ({ page }) => {
    await page.goto('/counter/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Count = 0')).toBeVisible();
  });

  test('increment button increases count', async ({ page }) => {
    await page.goto('/counter/', { waitUntil: 'domcontentloaded' });

    await page.click('button:has-text("[+]")');
    await expect(page.locator('text=Count = 1')).toBeVisible();

    await page.click('button:has-text("[+]")');
    await expect(page.locator('text=Count = 2')).toBeVisible();
  });

  test('decrement button decreases count', async ({ page }) => {
    await page.goto('/counter/', { waitUntil: 'domcontentloaded' });

    await page.click('button:has-text("[+]")');
    await expect(page.locator('text=Count = 1')).toBeVisible();

    await page.click('button:has-text("[-]")');
    await expect(page.locator('text=Count = 0')).toBeVisible();

    await page.click('button:has-text("[-]")');
    await expect(page.locator('text=Count = -1')).toBeVisible();
  });

  test('reset button sets count to 0', async ({ page }) => {
    await page.goto('/counter/', { waitUntil: 'domcontentloaded' });

    await page.click('button:has-text("[+]")');
    await page.click('button:has-text("[+]")');
    await page.click('button:has-text("[+]")');
    await expect(page.locator('text=Count = 3')).toBeVisible();

    await page.click('button:has-text("[reset]")');
    await expect(page.locator('text=Count = 0')).toBeVisible();
  });

  test('navigation buttons work', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.click('button:has-text("[Counter]")');

    await expect(page).toHaveURL(/\/counter\//);
    await expect(page.locator('text=Count = 0')).toBeVisible();
  });
});
