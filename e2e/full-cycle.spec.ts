import { test, expect } from '@playwright/test';

/**
 * E2E тест для полного цикла использования приложения:
 * Регистрация → Создание поездки → Бронирование → Чат
 * 
 * Примечание: Для полного тестирования требуется:
 * 1. Настроить тестовую базу данных
 * 2. Использовать тестовые учетные данные
 * 3. Очищать данные после тестов
 */

test.describe('Full Cycle: Registration → Ride Creation → Booking → Chat', () => {
  test.skip('should complete full user journey', async ({ page }) => {
    // Этот тест пропущен, так как требует настройки тестовой БД
    // Раскомментируйте и настройте для полного тестирования

    // 1. Регистрация
    await page.goto('/auth');
    await page.getByRole('button', { name: /регистрация/i }).click();
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/пароль/i).fill('testpassword123');
    await page.getByLabel(/имя/i).fill('Test User');
    await page.getByRole('button', { name: /зарегистрироваться/i }).click();

    // Ждем успешной регистрации или подтверждения email
    await expect(page.getByText(/подтвердите|check your email/i)).toBeVisible({ timeout: 10000 });

    // 2. Создание поездки (после входа)
    await page.goto('/create-ride');
    
    await page.getByLabel(/откуда|from/i).fill('Москва');
    await page.getByLabel(/куда|to/i).fill('Санкт-Петербург');
    await page.getByLabel(/дата/i).fill('2025-02-15');
    await page.getByLabel(/время/i).fill('10:00');
    await page.getByLabel(/цена/i).fill('1500');
    await page.getByLabel(/мест|seats/i).fill('4');
    
    await page.getByRole('button', { name: /создать|create/i }).click();

    // Ждем успешного создания
    await expect(page.getByText(/создана|created/i)).toBeVisible({ timeout: 10000 });

    // 3. Бронирование (как другой пользователь)
    // Здесь нужна регистрация второго пользователя или использование существующей поездки
    await page.goto('/');
    
    // Находим созданную поездку
    const rideCard = page.getByText('Москва').first();
    await rideCard.click();

    // Бронируем место
    await page.getByRole('button', { name: /забронировать|book/i }).click();
    await page.getByLabel(/мест|seats/i).fill('2');
    await page.getByRole('button', { name: /подтвердить|confirm/i }).click();

    // Ждем успешного бронирования
    await expect(page.getByText(/забронировано|booked/i)).toBeVisible({ timeout: 10000 });

    // 4. Чат
    // Открываем чат в деталях поездки
    const chatButton = page.getByRole('button', { name: /чат|chat/i });
    if (await chatButton.isVisible()) {
      await chatButton.click();
      
      // Отправляем сообщение
      const chatInput = page.getByPlaceholderText(/сообщение|message/i);
      await chatInput.fill('Привет! Когда выезжаем?');
      await page.getByRole('button', { name: /отправить|send/i }).click();

      // Проверяем, что сообщение отобразилось
      await expect(page.getByText('Привет! Когда выезжаем?')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle authentication flow', async ({ page }) => {
    await page.goto('/auth');
    
    // Проверяем наличие формы входа
    await expect(page.getByRole('heading', { name: /войти/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/пароль/i)).toBeVisible();
    
    // Проверяем переключение на регистрацию
    await page.getByRole('button', { name: /регистрация/i }).click();
    await expect(page.getByRole('heading', { name: /регистрация/i })).toBeVisible();
  });

  test('should validate search form', async ({ page }) => {
    await page.goto('/search');
    
    // Проверяем наличие формы поиска
    const fromInput = page.getByPlaceholderText(/откуда|from/i);
    const toInput = page.getByPlaceholderText(/куда|to/i);
    
    await expect(fromInput.or(toInput)).toBeVisible();
    
    // Проверяем валидацию
    const searchButton = page.getByRole('button', { name: /найти|search/i });
    await searchButton.click();
    
    // Должны появиться ошибки валидации
    await expect(page.getByText(/обязательно|required/i).first()).toBeVisible({ timeout: 2000 });
  });

  test('should display ride details page', async ({ page }) => {
    // Переходим на страницу деталей поездки (даже если не авторизованы)
    await page.goto('/ride/test-ride-id');
    
    // Проверяем структуру страницы
    const pageContent = page.locator('main').or(page.locator('[role="main"]'));
    await expect(pageContent).toBeVisible();
    
    // Должна быть либо информация о поездке, либо сообщение об ошибке
    const rideInfo = page.getByText(/москва|санкт-петербург|поездка/i);
    const errorMessage = page.getByText(/не найдено|not found|ошибка/i);
    
    await expect(rideInfo.or(errorMessage)).toBeVisible();
  });
});

