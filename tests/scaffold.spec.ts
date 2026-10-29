import { test, expect } from '@playwright/test';
test('phase zero scaffold loads', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('BeatCarve');
});
