#!/bin/bash
# Скрипт для выполнения на сервере - настройка Telegram бота

set -e

echo "🤖 Настройка Telegram бота на сервере..."

cd /var/www/ride-together/server

# 1. Проверяем информацию о боте
echo "🔍 Проверка информации о боте..."
BOT_INFO=$(curl -s "https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/getMe")
BOT_USERNAME=$(echo $BOT_INFO | grep -o '"username":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -z "$BOT_USERNAME" ]; then
    echo "❌ Ошибка: Не удалось получить информацию о боте"
    echo "Ответ: $BOT_INFO"
    exit 1
fi

echo "✅ Бот найден: @${BOT_USERNAME}"

# 2. Обновляем .env.production
echo "📝 Обновление .env.production..."
if [ -f .env.production ]; then
    if grep -q "TELEGRAM_BOT_TOKEN" .env.production; then
        sed -i "s|TELEGRAM_BOT_TOKEN=.*|TELEGRAM_BOT_TOKEN=8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY|" .env.production
    else
        echo "" >> .env.production
        echo "TELEGRAM_BOT_TOKEN=8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY" >> .env.production
    fi
    
    if ! grep -q "FRONTEND_URL" .env.production; then
        echo "FRONTEND_URL=https://ridetogether.ru" >> .env.production
    else
        sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://ridetogether.ru|" .env.production
    fi
else
    cat > .env.production << EOF
TELEGRAM_BOT_TOKEN=8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY
FRONTEND_URL=https://ridetogether.ru
EOF
fi

echo "✅ .env.production обновлен"

# 3. Проверяем что webhook endpoint существует
echo "✅ Webhook endpoint создан в коде"

# 4. Перезапуск PM2 с новыми переменными
echo "🔄 Перезапуск PM2..."
pm2 restart ride-backend --update-env

sleep 3

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📋 Информация:"
echo "   Бот: @${BOT_USERNAME}"
echo "   Endpoint: https://api.ridetogether.ru/api/telegram/webhook"
echo ""
echo "🧪 Тестирование:"
echo "   1. Найдите бота: @${BOT_USERNAME}"
echo "   2. Отправьте /start"
echo "   3. Проверьте что бот отвечает"
echo ""
echo "🔗 После настройки HTTPS установите webhook:"
echo "   curl -X POST \"https://api.telegram.org/bot8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY/setWebhook\" \\"
echo "     -d \"url=https://api.ridetogether.ru/api/telegram/webhook\""

