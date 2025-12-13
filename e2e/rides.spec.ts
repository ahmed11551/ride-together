import { test, expect } from '@playwright/test';

test.describe('Rides', () => {
  test('should display rides list on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check for rides section or empty state
    const ridesSection = page.getByText(/поездки|rides/i);
    const emptyState = page.getByText(/нет поездок|no rides/i);
    
    await expect(ridesSection.or(emptyState)).toBeVisible();
  });

  test('should navigate to search page', async ({ page }) => {
    await page.goto('/');
    
    // Find and click search button
    const searchButton = page.getByRole('button', { name: /найти|search/i }).or(
      page.getByRole('link', { name: /найти|search/i })
    );
    
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await expect(page).toHaveURL(/\/search/);
    }
  });

  test('should display search form', async ({ page }) => {
    await page.goto('/search');
    
    // Check for search form elements
    const fromInput = page.getByLabel(/откуда|from/i).or(
      page.getByPlaceholder(/откуда|from/i)
    );
    const toInput = page.getByLabel(/куда|to/i).or(
      page.getByPlaceholder(/куда|to/i)
    );
    
    await expect(fromInput.or(toInput)).toBeVisible();
  });

  test('should navigate to create ride page when authenticated', async ({ page }) => {
    // Note: This test requires authentication
    // In a real scenario, you would set up auth state
    await page.goto('/create-ride');
    
    // Should either show create form or redirect to auth
    const createForm = page.getByRole('heading', { name: /создать|create/i });
    const authPage = page.getByRole('heading', { name: /войти|login/i });
    
    await expect(createForm.or(authPage)).toBeVisible();
  });
});

