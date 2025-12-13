import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /войти/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/пароль/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /войти/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /войти/i }).click();
    
    // Wait for validation errors
    await expect(page.getByText(/обязательно/i).first()).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/пароль/i).fill('wrongpassword');
    await page.getByRole('button', { name: /войти/i }).click();
    
    // Should show error message
    await expect(page.getByText(/неверный|ошибка/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to sign up', async ({ page }) => {
    await page.getByRole('button', { name: /регистрация/i }).click();
    await expect(page.getByRole('heading', { name: /регистрация/i })).toBeVisible();
  });

  test('should navigate to home from auth page', async ({ page }) => {
    await page.getByRole('link', { name: /главная|home/i }).click();
    await expect(page).toHaveURL('/');
  });
});

