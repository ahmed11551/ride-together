# Настройка мониторинга и аналитики

## Sentry (Мониторинг ошибок)

### 1. Создание проекта в Sentry

1. Перейдите на [sentry.io](https://sentry.io)
2. Создайте аккаунт или войдите
3. Создайте новый проект:
   - Выберите **React** как платформу
   - Назовите проект (например, "Ride Together")
4. Скопируйте **DSN** (Data Source Name)

### 2. Настройка переменных окружения

Добавьте в `.env` или в настройках Vercel:

```bash
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_APP_VERSION=1.0.0  # Опционально, для отслеживания версий
```

### 3. Проверка работы

1. Откройте приложение в продакшене
2. Создайте тестовую ошибку (например, в консоли браузера)
3. Проверьте в Sentry Dashboard, что ошибка появилась

### 4. Настройка алертов (опционально)

В Sentry Dashboard:
1. Перейдите в **Alerts** → **Create Alert Rule**
2. Настройте условия (например, > 10 ошибок за 5 минут)
3. Добавьте уведомления (Email, Slack, Discord)

---

## Google Analytics

### 1. Создание свойства в Google Analytics

1. Перейдите на [analytics.google.com](https://analytics.google.com)
2. Создайте аккаунт или выберите существующий
3. Создайте новое свойство:
   - Название: "Ride Together"
   - Часовой пояс: ваш часовой пояс
   - Валюта: RUB (или другая)
4. Выберите **Web** как тип платформы
5. Скопируйте **Measurement ID** (формат: `G-XXXXXXXXXX`)

### 2. Настройка переменных окружения

Добавьте в `.env` или в настройках Vercel:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Проверка работы

1. Откройте приложение в продакшене
2. Перейдите в Google Analytics → **Reports** → **Realtime**
3. Вы должны увидеть активных пользователей

### 4. Настройка событий

События уже настроены в коде:
- `sign_up` - регистрация
- `login` - вход
- `logout` - выход
- `create_ride` - создание поездки
- `search_rides` - поиск поездок
- `create_booking` - создание бронирования
- `send_message` - отправка сообщения
- `create_review` - создание отзыва

Проверьте события в Google Analytics → **Events**.

---

## Переменные окружения

### Полный список переменных

```bash
# Supabase (обязательно)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Maps (опционально)
VITE_YANDEX_MAPS_API_KEY=your-yandex-key
VITE_MAPBOX_TOKEN=your-mapbox-token
VITE_GEOAPIFY_API_KEY=your-geoapify-key

# Telegram (опционально)
VITE_TELEGRAM_BOT_TOKEN=your-bot-token

# Push Notifications (опционально)
VITE_VAPID_PUBLIC_KEY=your-vapid-key

# Monitoring (опционально)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_APP_VERSION=1.0.0
```

### Настройка в Vercel

1. Перейдите в проект на [vercel.com](https://vercel.com)
2. Откройте **Settings** → **Environment Variables**
3. Добавьте все необходимые переменные
4. Выберите окружения (Production, Preview, Development)
5. Нажмите **Save**
6. Пересоберите проект

---

## Тестирование

### Тест Sentry

Откройте консоль браузера и выполните:

```javascript
// Тестовая ошибка
throw new Error('Test Sentry integration');
```

Проверьте в Sentry Dashboard, что ошибка появилась.

### Тест Google Analytics

1. Откройте приложение
2. Выполните действия (войти, создать поездку и т.д.)
3. Проверьте в Google Analytics → **Realtime** → **Events**

---

## Дополнительные ресурсы

- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Google Analytics Documentation](https://developers.google.com/analytics/devguides/collection/gtagjs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

