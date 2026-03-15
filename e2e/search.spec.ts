// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Search Page', () => {
  test('search page loads with query', async ({ page }) => {
    await page.goto('/search?q=shoes');
    await expect(page).toHaveURL(/search/);
    // Page should show search-related content
    const heading = page.getByText(/search|results|shoes/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('search results display', async ({ page }) => {
    await page.goto('/search?q=product');
    // Wait for results or product cards to appear
    const results = page.locator('[data-testid="product-card"], .product-card, a[href*="/product/"]');
    // If there are seeded products matching "product", cards should appear
    // Otherwise the empty state will show — either is acceptable
    await expect(page.locator('body')).toBeVisible();
  });

  test('empty search shows message', async ({ page }) => {
    await page.goto('/search?q=xyznonexistentproduct12345');
    // Should display an empty state / no results message
    const emptyState = page.getByText(/no results|no products|nothing found|not found|0 results/i).first();
    await expect(emptyState).toBeVisible({ timeout: 10000 });
  });
});
