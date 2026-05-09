import { test, expect } from '@playwright/test';

import { expectLoginPage } from './test-utils';

test.describe('Admin Site', () => {
  test.use({ baseURL: 'http://localhost:5174' });

  test('admin homepage loads successfully', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/Admin|ログイン|Hello, World!/);
    await expectLoginPage(page);
  });

  test('authentication is required', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL('http://localhost:5174/');
    await expectLoginPage(page);
    await expect(page.locator('ui-sidebar')).toHaveCount(0);
  });
});
