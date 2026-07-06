import { expect, test } from '@playwright/test';

test.describe('Default Site - Functions', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/functions/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/Functions/);
    const heading = page.locator('h1:has-text("Functions")');
    await expect(heading).toBeVisible();
  });

  test('displays functions UI elements', async ({ page }) => {
    await page.goto('/functions/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('ui-input[label="ID"]')).toBeVisible();
    await expect(page.locator('ui-input[label="Name"]')).toBeVisible();
    await expect(page.locator('ui-button:has-text("Run Sample Function")')).toBeVisible();
    await expect(page.locator('text=Result will appear here…')).toBeVisible();
  });

  test('can input text in the text fields', async ({ page }) => {
    await page.goto('/functions/', { waitUntil: 'domcontentloaded' });

    const idInput = page.locator('ui-input[label="ID"] input');
    await idInput.fill('test-id');
    await expect(idInput).toHaveValue('test-id');

    const nameInput = page.locator('ui-input[label="Name"] input');
    await nameInput.fill('Test Name');
    await expect(nameInput).toHaveValue('Test Name');
  });

  test('run button shows error when functions emulator is unavailable', async ({ page }) => {
    // The e2e web server starts only the auth/firestore/storage emulators,
    // so the callable invocation deterministically exercises the error path.
    await page.goto('/functions/', { waitUntil: 'domcontentloaded' });

    await page.click('ui-button:has-text("Run Sample Function")');

    await expect(page.locator('text=Function call failed')).toBeVisible();
  });

  test('navigation from footer works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.click('ui-button:has-text("Functions")');

    await expect(page).toHaveURL(/\/functions\//);
    const heading = page.locator('h1:has-text("Functions")');
    await expect(heading).toBeVisible();
  });
});
