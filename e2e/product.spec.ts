// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Product Detail Page', () => {
  test('product detail page loads', async ({ page }) => {
    // First go to homepage to find a product link
    await page.goto('/');
    const productLink = page.locator('a[href*="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 10000 });
    await productLink.click();
    // Should be on a product detail page
    await expect(page).toHaveURL(/\/product\//);
  });

  test('image gallery renders', async ({ page }) => {
    await page.goto('/');
    const productLink = page.locator('a[href*="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 10000 });
    await productLink.click();
    await expect(page).toHaveURL(/\/product\//);
    // Look for product images
    const productImage = page.locator('img').first();
    await expect(productImage).toBeVisible();
  });

  test('add to cart button visible', async ({ page }) => {
    await page.goto('/');
    const productLink = page.locator('a[href*="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 10000 });
    await productLink.click();
    await expect(page).toHaveURL(/\/product\//);
    // Look for add to cart button
    const addToCart = page.getByRole('button', { name: /add to cart|buy now/i }).first();
    await expect(addToCart).toBeVisible();
  });

  test('reviews section visible', async ({ page }) => {
    await page.goto('/');
    const productLink = page.locator('a[href*="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 10000 });
    await productLink.click();
    await expect(page).toHaveURL(/\/product\//);
    // Look for reviews section
    const reviews = page.getByText(/review/i).first();
    await expect(reviews).toBeVisible();
  });
});
