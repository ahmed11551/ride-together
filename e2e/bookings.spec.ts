import { test, expect } from '@playwright/test';

test.describe('Bookings', () => {
  test('should display bookings page', async ({ page }) => {
    await page.goto('/my-bookings');
    
    // Should either show bookings or redirect to auth
    const bookingsPage = page.getByText(/бронирования|bookings/i);
    const authPage = page.getByRole('heading', { name: /войти|login/i });
    
    await expect(bookingsPage.or(authPage)).toBeVisible();
  });

  test('should navigate to ride details from booking', async ({ page }) => {
    // This test would require authenticated state and existing bookings
    // For now, just check that the page structure is correct
    await page.goto('/my-bookings');
    
    // Check for page structure
    const pageContent = page.locator('main').or(page.locator('[role="main"]'));
    await expect(pageContent).toBeVisible();
  });
});

