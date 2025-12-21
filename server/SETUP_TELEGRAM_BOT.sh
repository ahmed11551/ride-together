#!/bin/bash

# Настройка Telegram бота: Mini App и команды
# Выполнить на сервере: bash SETUP_TELEGRAM_BOT.sh

set -e

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY}"
FRONTEND_URL="${FRONTEND_URL:-https://ridetogether.ru}"
WEBHOOK_URL="https://api.ridetogether.ru/api/telegram/webhook"

echo "🤖 Настройка Telegram бота..."
echo "Token: ${TELEGRAM_BOT_TOKEN:0:10}..."
echo "Frontend: $FRONTEND_URL"
echo "Webhook: $WEBHOOK_URL"
echo ""

# 1. Устанавливаем webhook
echo "1️⃣ Устанавливаем webhook..."
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"allowed_updates\": [\"message\", \"callback_query\"]
  }" | python3 -m json.tool

echo ""
echo ""

# 2. Настраиваем Menu Button (Mini App)
echo "2️⃣ Настраиваем Menu Button (Mini App)..."
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d "{
    \"menu_button\": {
      \"type\": \"web_app\",
      \"text\": \"🚗 Ride Together\",
      \"web_app\": {
        \"url\": \"${FRONTEND_URL}\"
      }
    }
  }" | python3 -m json.tool

echo ""
echo ""

# 3. Устанавливаем команды бота
echo "3️⃣ Устанавливаем команды бота..."
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "🚀 Начать работу с ботом"},
      {"command": "help", "description": "❓ Помощь и инструкции"},
      {"command": "rides", "description": "🔍 Найти поездку"},
      {"command": "myrides", "description": "📊 Мои поездки"},
      {"command": "support", "description": "💬 Поддержка"}
    ]
  }' | python3 -m json.tool

echo ""
echo ""

# 4. Проверяем webhook
echo "4️⃣ Проверяем webhook..."
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool

echo ""
echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📋 Проверьте:"
echo "   1. Webhook установлен и работает"
echo "   2. Menu Button появился в боте"
echo "   3. Команды доступны в /menu"

