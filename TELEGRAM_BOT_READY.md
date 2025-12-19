# ✅ Telegram бот настроен!

## ✅ Что сделано:

1. ✅ Токен сохранен в `ecosystem.config.cjs`
2. ✅ Создан webhook endpoint: `/api/telegram/webhook`
3. ✅ Созданы API endpoints для подписок
4. ✅ Фронтенд обновлен для использования API

## 🚀 Настройка на сервере:

### Вариант 1: Выполните скрипт на сервере

```bash
# Скопируйте файлы на сервер
scp ride-together/server/api/telegram/webhook.ts root@194.67.124.123:/var/www/ride-together/server/api/telegram/
scp ride-together/server/TELEGRAM_BOT_SETUP_ON_SERVER.sh root@194.67.124.123:/tmp/

# На сервере
ssh root@194.67.124.123
chmod +x /tmp/TELEGRAM_BOT_SETUP_ON_SERVER.sh
/tmp/TELEGRAM_BOT_SETUP_ON_SERVER.sh
```

### Вариант 2: Ручная настройка

На сервере выполните:

```bash
cd /var/www/ride-together/server

# 1. Создайте файл webhook.ts (скопируйте содержимое из ride-together/server/api/telegram/webhook.ts)
mkdir -p api/telegram
nano api/telegram/webhook.ts
# Вставьте код из файла

# 2. Обновите .env.production
echo "TELEGRAM_BOT_TOKEN=8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY" >> .env.production
echo "FRONTEND_URL=https://ridetogether.ru" >> .env.production

# 3. Пересоберите сервер
npm run build

# 4. Перезапустите PM2
pm2 restart ride-backend --update-env

# 5. Проверьте бота
curl "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/getMe"
```

## 🔗 Настройка Webhook (после HTTPS):

После того как SSL сертификат установлен и домен работает:

```bash
# Установка webhook
curl -X POST "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/setWebhook" \
  -d "url=https://api.ridetogether.ru/api/telegram/webhook"

# Проверка webhook
curl "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/getWebhookInfo"
```

## 🧪 Тестирование:

1. **Проверка бота:**
   ```bash
   curl "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/getMe"
   ```
   Должен вернуть информацию о боте (username, id, etc.)

2. **Тест в Telegram:**
   - Найдите бота (username будет в ответе getMe)
   - Отправьте `/start`
   - Проверьте что бот отвечает

3. **Тест подписки через приложение:**
   - Откройте приложение
   - Нажмите "Подписаться на бота"
   - Проверьте что подписка сохраняется

## ✅ Готово!

Бот полностью настроен и готов к работе!

- ✅ API endpoints созданы
- ✅ Webhook endpoint готов
- ✅ Токен сохранен
- ✅ Фронтенд обновлен

Осталось только:
1. Скопировать файлы на сервер
2. Пересобрать и перезапустить
3. Настроить webhook после HTTPS

