import { expect, test } from '@playwright/test';

test.describe('Default Site - Counter', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/counter/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/Counter/);
  });

  test('displays initial count of 0', async ({ page }) => {
    await page.goto('/counter/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#counter-value')).toHaveText('0');
  });

  test('increment button increases count', async ({ page }) => {
    await page.goto('/counter/', { waitUntil: 'domcontentloaded' });

    await page.click('button:has-text("[+]")');
    await expect(page.locator('#counter-value')).toHaveText('1');

    await page.click('button:has-text("[+]")');
    await expect(page.locator('#counter-value')).toHaveText('2');
  });

  test('decrement button decreases count', async ({ page }) => {
    await page.goto('/counter/', { waitUntil: 'domcontentloaded' });

    await page.click('button:has-text("[+]")');
    await expect(page.locator('#counter-value')).toHaveText('1');

    await page.click('button:has-text("[-]")');
    await expect(page.locator('#counter-value')).toHaveText('0');

    await page.click('button:has-text("[-]")');
    await expect(page.locator('#counter-value')).toHaveText('-1');
  });

  test('reset button sets count to 0', async ({ page }) => {
    await page.goto('/counter/', { waitUntil: 'domcontentloaded' });

    await page.click('button:has-text("[+]")');
    await page.click('button:has-text("[+]")');
    await page.click('button:has-text("[+]")');
    await expect(page.locator('#counter-value')).toHaveText('3');

    await page.click('button:has-text("Reset")');
    await expect(page.locator('#counter-value')).toHaveText('0');
  });

  test('navigation buttons work', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.click('button:has-text("[Counter]")');

    await expect(page).toHaveURL(/\/counter\//);
    await expect(page.locator('#counter-value')).toHaveText('0');
  });
});

