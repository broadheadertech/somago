// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in');
    // Clerk sign-in form or redirect should appear
    await expect(page.locator('body')).toBeVisible();
    // Check for sign-in related content
    const signInContent = page.getByText(/sign in|log in|email/i).first();
    await expect(signInContent).toBeVisible({ timeout: 10000 });
  });

  test('sign-up page loads', async ({ page }) => {
    await page.goto('/sign-up');
    // Clerk sign-up form or redirect should appear
    await expect(page.locator('body')).toBeVisible();
    // Check for sign-up related content
    const signUpContent = page.getByText(/sign up|create.*account|email/i).first();
    await expect(signUpContent).toBeVisible({ timeout: 10000 });
  });

  test('unauthenticated redirect for /account', async ({ page }) => {
    await page.goto('/account');
    // Should show sign-in prompt or redirect to sign-in
    const signInPrompt = page.getByText(/sign in|log in|not authenticated/i).first();
    await expect(signInPrompt).toBeVisible({ timeout: 10000 });
  });
});
