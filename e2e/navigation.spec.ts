import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between main pages', async ({ page }) => {
    await page.goto('/');
    
    // Check homepage
    await expect(page).toHaveURL('/');
    
    // Navigate to search
    const searchLink = page.getByRole('link', { name: /поиск|search/i });
    if (await searchLink.isVisible()) {
      await searchLink.click();
      await expect(page).toHaveURL(/\/search/);
    }
    
    // Navigate back to home
    const homeLink = page.getByRole('link', { name: /главная|home/i });
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('should have responsive mobile menu', async ({ page, viewport }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check for mobile menu button
    const menuButton = page.getByRole('button', { name: /меню|menu/i }).or(
      page.locator('[aria-label*="menu" i]')
    );
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Check that menu is open
      const menu = page.locator('nav').or(page.locator('[role="navigation"]'));
      await expect(menu).toBeVisible();
    }
  });

  test('should handle 404 page', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show 404 or not found message
    const notFound = page.getByText(/404|не найдено|not found/i);
    await expect(notFound).toBeVisible();
  });
});

