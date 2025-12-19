# Быстрая настройка Telegram бота

## ✅ Токен получен:
`8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY`

## 🚀 Быстрая настройка на сервере:

### Вариант 1: Автоматический скрипт

```bash
# Скопируйте скрипт на сервер
scp ride-together/server/setup-telegram-bot.sh root@194.67.124.123:/tmp/

# На сервере
ssh root@194.67.124.123
chmod +x /tmp/setup-telegram-bot.sh
/tmp/setup-telegram-bot.sh
```

### Вариант 2: Ручная настройка

На сервере выполните:

```bash
cd /var/www/ride-together/server

# 1. Обновите ecosystem.config.cjs
nano ecosystem.config.cjs
# Добавьте в env: TELEGRAM_BOT_TOKEN: '8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY'

# 2. Обновите .env.production (если есть)
echo "TELEGRAM_BOT_TOKEN=8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY" >> .env.production

# 3. Скопируйте новые файлы API (webhook.ts)
# Убедитесь что файл api/telegram/webhook.ts создан

# 4. Пересоберите сервер
npm run build

# 5. Перезапустите PM2
pm2 restart ride-backend --update-env

# 6. Проверьте информацию о боте
curl "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/getMe"
```

## 🔗 Настройка Webhook:

После того как сервер запущен и доступен по HTTPS:

```bash
# Установка webhook
curl -X POST "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/setWebhook" \
  -d "url=https://api.ridetogether.ru/api/telegram/webhook"

# Проверка webhook
curl "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/getWebhookInfo"
```

## 🧪 Тестирование:

1. Найдите вашего бота в Telegram (имя будет показано после выполнения getMe)
2. Отправьте `/start`
3. Проверьте что бот отвечает
4. Нажмите кнопки в меню

## 📋 Проверка работы:

```bash
# Информация о боте
curl "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/getMe"

# Статус webhook
curl "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/getWebhookInfo"

# Проверка что endpoint работает
curl -X POST https://api.ridetogether.ru/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id": 1, "message": {"message_id": 1, "from": {"id": 123, "first_name": "Test"}, "chat": {"id": 123}, "text": "/start", "date": 1234567890}}'
```

## ⚠️ Важно:

- Токен уже сохранен в `ecosystem.config.cjs` и `env.production.example`
- Webhook будет работать только после настройки HTTPS
- Убедитесь что endpoint `/api/telegram/webhook` доступен

## ✅ Готово!

После выполнения этих шагов бот будет полностью настроен и готов к работе!

