import { expect, test } from '@playwright/test';

test.describe('Default Site - Modal', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/modal/', { waitUntil: 'domcontentloaded' });

    const heading = page.locator('h1:has-text("Modal API")');
    await expect(heading).toBeVisible();
  });

  test('displays semantic API buttons', async ({ page }) => {
    await page.goto('/modal/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('ui-button:has-text("Modal.success()")')).toBeVisible();
    await expect(page.locator('ui-button:has-text("Modal.info()")')).toBeVisible();
    await expect(page.locator('ui-button:has-text("Modal.error()")')).toBeVisible();
    await expect(page.locator('ui-button:has-text("Modal.confirm()")').first()).toBeVisible();
  });

  test('Modal.success() shows modal and records acknowledgement', async ({ page }) => {
    await page.goto('/modal/', { waitUntil: 'domcontentloaded' });

    await page.click('ui-button:has-text("Modal.success()")');

    await expect(page.locator('text=Your operation completed successfully!')).toBeVisible();

    await page.click('ui-modal ui-button:has-text("OK")');

    await expect(page.locator('text=Modal.success(): Acknowledged')).toBeVisible();
  });

  test('Modal.confirm() records confirmation', async ({ page }) => {
    await page.goto('/modal/', { waitUntil: 'domcontentloaded' });

    await page.click('ui-button:text-is("Modal.confirm()")');

    await expect(page.locator('text=Are you sure you want to proceed?')).toBeVisible();

    await page.click('ui-modal ui-button:has-text("Confirm")');

    await expect(page.locator('text=Modal.confirm(): Confirmed')).toBeVisible();
  });

  test('Modal.confirm() records cancellation', async ({ page }) => {
    await page.goto('/modal/', { waitUntil: 'domcontentloaded' });

    await page.click('ui-button:text-is("Modal.confirm()")');

    await expect(page.locator('text=Are you sure you want to proceed?')).toBeVisible();

    await page.click('ui-modal ui-button:has-text("Cancel")');

    await expect(page.locator('text=Modal.confirm(): Cancelled')).toBeVisible();
  });

  test('single argument API shows message without title', async ({ page }) => {
    await page.goto('/modal/', { waitUntil: 'domcontentloaded' });

    await page.click('ui-button:has-text("Single Argument")');

    await expect(page.locator('text=This message has no title')).toBeVisible();

    await page.click('ui-modal ui-button:has-text("OK")');

    await expect(page.locator('text=Single argument API: Acknowledged')).toBeVisible();
  });

  test('navigation from footer works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.click('ui-button:has-text("Modal")');

    await expect(page).toHaveURL(/\/modal\//);
    const heading = page.locator('h1:has-text("Modal API")');
    await expect(heading).toBeVisible();
  });
});
