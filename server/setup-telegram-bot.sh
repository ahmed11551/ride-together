#!/bin/bash
# Настройка Telegram бота на сервере

set -e

BOT_TOKEN="8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY"
API_URL="https://api.ridetogether.ru"  # Или ваш домен когда будет настроен

echo "🤖 Настройка Telegram бота..."

# 1. Обновляем переменные окружения
echo "📝 Обновление переменных окружения..."
cd /var/www/ride-together/server

# Обновляем ecosystem.config.cjs если токен еще не добавлен
if ! grep -q "TELEGRAM_BOT_TOKEN" ecosystem.config.cjs; then
    echo "⚠️  Обновите ecosystem.config.cjs вручную, добавив TELEGRAM_BOT_TOKEN"
fi

# Обновляем .env.production
if [ -f .env.production ]; then
    if grep -q "TELEGRAM_BOT_TOKEN" .env.production; then
        sed -i "s|TELEGRAM_BOT_TOKEN=.*|TELEGRAM_BOT_TOKEN=$BOT_TOKEN|" .env.production
    else
        echo "TELEGRAM_BOT_TOKEN=$BOT_TOKEN" >> .env.production
    fi
else
    echo "TELEGRAM_BOT_TOKEN=$BOT_TOKEN" > .env.production
fi

# 2. Проверка информации о боте
echo "🔍 Проверка информации о боте..."
BOT_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe")
BOT_USERNAME=$(echo $BOT_INFO | grep -o '"username":"[^"]*' | cut -d'"' -f4)

if [ -z "$BOT_USERNAME" ]; then
    echo "❌ Ошибка: Не удалось получить информацию о боте. Проверьте токен."
    exit 1
fi

echo "✅ Бот найден: @${BOT_USERNAME}"

# 3. Настройка webhook (если используете webhook вместо polling)
echo "🔗 Настройка webhook..."
WEBHOOK_URL="${API_URL}/api/telegram/webhook"

# Удаляем старый webhook (если есть)
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook" > /dev/null

# Устанавливаем новый webhook
WEBHOOK_RESULT=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -d "url=${WEBHOOK_URL}")

if echo "$WEBHOOK_RESULT" | grep -q '"ok":true'; then
    echo "✅ Webhook установлен: ${WEBHOOK_URL}"
else
    echo "⚠️  Webhook не установлен (возможно endpoint еще не создан)"
    echo "   Результат: $WEBHOOK_RESULT"
fi

# 4. Перезапуск PM2
echo "🔄 Перезапуск PM2..."
pm2 restart ride-backend --update-env

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📋 Информация о боте:"
echo "   Username: @${BOT_USERNAME}"
echo "   Token: ${BOT_TOKEN:0:10}...${BOT_TOKEN: -4}"
echo ""
echo "🧪 Тестирование:"
echo "   1. Найдите бота в Telegram: @${BOT_USERNAME}"
echo "   2. Отправьте /start"
echo "   3. Проверьте что бот отвечает"
echo ""
echo "📝 Следующие шаги:"
echo "   - Если используете Supabase Edge Function, настройте webhook отдельно"
echo "   - Если используете свой webhook endpoint, создайте /api/telegram/webhook"
echo "   - Обновите VITE_TELEGRAM_BOT_NAME во фронтенде"

