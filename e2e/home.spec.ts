// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads with hero banner', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Somago/i);
    // Hero section should be visible
    const hero = page.locator('section, [data-testid="hero"], .hero').first();
    await expect(hero).toBeVisible();
  });

  test('categories section visible', async ({ page }) => {
    await page.goto('/');
    // Look for category-related content
    const categories = page.getByText(/categories/i).first();
    await expect(categories).toBeVisible();
  });

  test('search bar works', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test product');
    await searchInput.press('Enter');
    // Should navigate to search page
    await expect(page).toHaveURL(/search/);
  });

  test('product cards display', async ({ page }) => {
    await page.goto('/');
    // Wait for product cards to render
    const productCards = page.locator('[data-testid="product-card"], .product-card, a[href*="/product/"]');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
  });
});
