import { test, expect } from '@playwright/test';

test('login page renders correctly', async ({ page }) => {
  await page.goto('/login');
  
  // Expect title to contain DirectorByte
  await expect(page).toHaveTitle(/DirectorByte/i);
  
  // Check for login form elements
  await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
  await expect(page.getByLabel(/Email/i)).toBeVisible();
  await expect(page.getByLabel(/Password/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
});
