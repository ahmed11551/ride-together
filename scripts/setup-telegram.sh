#!/usr/bin/env bash
# Настройка Telegram Mini App и webhook
# Использование:
#   TELEGRAM_BOT_TOKEN=xxx FRONTEND_URL=https://domain.ru DOMAIN=https://domain.ru ./scripts/setup-telegram.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ -f "$ROOT/server/.env.production" ]; then
  TELEGRAM_BOT_TOKEN=$(grep -m1 '^TELEGRAM_BOT_TOKEN=' "$ROOT/server/.env.production" | cut -d= -f2- | tr -d '"' | tr -d "'")
  FRONTEND_URL=$(grep -m1 '^FRONTEND_URL=' "$ROOT/server/.env.production" | cut -d= -f2- | tr -d '"' | tr -d "'")
  export TELEGRAM_BOT_TOKEN FRONTEND_URL
fi

TOKEN="${TELEGRAM_BOT_TOKEN:-}"
FRONTEND="${FRONTEND_URL:-}"
WEBHOOK_BASE="${DOMAIN:-$FRONTEND}"

if [ -z "$TOKEN" ] || [ -z "$FRONTEND" ]; then
  echo "❌ Нужны TELEGRAM_BOT_TOKEN и FRONTEND_URL"
  exit 1
fi

WEBHOOK_URL="${WEBHOOK_BASE%/}/api/telegram/webhook"

echo "🤖 Webhook: $WEBHOOK_URL"
echo "🌐 Mini App: $FRONTEND"

curl -fsS -X POST "https://api.telegram.org/bot${TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"${WEBHOOK_URL}\",\"allowed_updates\":[\"message\",\"callback_query\"]}" | python3 -m json.tool

echo ""
curl -fsS -X POST "https://api.telegram.org/bot${TOKEN}/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d "{\"menu_button\":{\"type\":\"web_app\",\"text\":\"🚗 Ride Together\",\"web_app\":{\"url\":\"${FRONTEND}\"}}}" | python3 -m json.tool

echo ""
curl -fsS -X POST "https://api.telegram.org/bot${TOKEN}/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{"commands":[{"command":"start","description":"Открыть приложение"},{"command":"help","description":"Помощь"}]}' | python3 -m json.tool

echo ""
echo "✅ Telegram настроен"
