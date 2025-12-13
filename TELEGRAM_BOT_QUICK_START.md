# 🚀 Быстрый старт: Настройка Telegram бота

## ⚡ Краткая инструкция (5 минут)

### 1. Создайте бота
```
1. Откройте @BotFather в Telegram
2. Отправьте /newbot
3. Введите имя: RideConnect
4. Введите username: RideConnectBot
5. Сохраните токен бота
```

### 2. Создайте Mini App
```
1. Отправьте /newapp в BotFather
2. Выберите вашего бота
3. Title: RideConnect
4. Description: Платформа для совместных поездок
5. Short name: rideconnect
6. Web App URL: https://your-app.vercel.app
```

### 3. Деплой Edge Function
```bash
# Установите Supabase CLI (если еще не установлен)
brew install supabase/tap/supabase

# Войдите в Supabase
supabase login

# Свяжите проект
supabase link --project-ref your-project-ref

# Деплой функции
supabase functions deploy telegram-bot
```

### 4. Настройте переменные окружения

В Supabase Dashboard → `Project Settings` → `Edge Functions` → `Secrets`:

| Ключ | Значение |
|------|----------|
| `TELEGRAM_BOT_TOKEN` | Токен от BotFather |
| `APP_URL` | `https://your-app.vercel.app` |
| `SUPABASE_URL` | URL вашего проекта (уже есть) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role ключ (уже есть) |

### 5. Примените миграции
```bash
supabase db push
```

Или через Supabase Dashboard → `Database` → `Migrations` → `New migration`

### 6. Установите Webhook
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://<PROJECT_REF>.supabase.co/functions/v1/telegram-bot"}'
```

### 7. Проверьте
```
1. Найдите бота в Telegram
2. Отправьте /start
3. Проверьте, что бот отвечает
```

## ✅ Готово!

Для подробной инструкции см. `TELEGRAM_BOT_COMPLETE_GUIDE.md`

