import { expect, test } from '@playwright/test';

test.describe('Default Site - Lit-Async', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/lit-async/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/Lit-Async - Sample Site/);
    await expect(page.locator('h1:has-text("lit-async Demo")')).toBeVisible();
  });

  test('displays all three demo cards', async ({ page }) => {
    await page.goto('/lit-async/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h2:has-text("track(Promise)")')).toBeVisible();
    await expect(page.locator('h2:has-text("track(AsyncGenerator)")')).toBeVisible();
    await expect(page.locator('h2:has-text("loading() Helper")')).toBeVisible();
  });

  test('promise and loading states function correctly', async ({ page }) => {
    await page.goto('/lit-async/', { waitUntil: 'domcontentloaded' });

    const btnReload = page.locator('#btn-reload-quote');
    await expect(btnReload).toBeVisible();

    await btnReload.click();
    await expect(page.locator('text=Loading promise...')).toBeVisible();

    await expect(page.locator('text=Loading promise...')).not.toBeVisible({ timeout: 2000 });

    const btnSlow = page.locator('#btn-trigger-slow');
    await btnSlow.click();
    await expect(page.locator('#slow-loading-placeholder')).toBeVisible();
    await expect(page.locator('text=Simulating slow network request')).toBeVisible();
    await expect(page.locator('#slow-loading-placeholder')).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Successfully loaded resource')).toBeVisible();
  });

  test('generator control works', async ({ page }) => {
    await page.goto('/lit-async/', { waitUntil: 'domcontentloaded' });

    const btnPause = page.locator('#btn-pause-generator');
    await expect(btnPause).toBeVisible();

    await btnPause.click();
    await expect(page.locator('#generator-stopped')).toBeVisible();
    await expect(page.locator('#btn-resume-generator')).toBeVisible();

    const btnResume = page.locator('#btn-resume-generator');
    await btnResume.click();
    await expect(page.locator('#generator-counter')).toBeVisible();
    await expect(page.locator('#btn-pause-generator')).toBeVisible();
  });

  test('navigation from index works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const btnNav = page.locator('button:has-text("[Lit-Async]")');
    await expect(btnNav).toBeVisible();

    await btnNav.click();
    await expect(page).toHaveURL(/\/lit-async\//);
    await expect(page.locator('h1:has-text("lit-async Demo")')).toBeVisible();
  });
});
