#!/usr/bin/env bash
# Локальная проверка перед деплоем

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🔍 Проверка Ride Together перед деплоем"
echo "========================================"

for f in server/package.json package.json database/schema.sql deploy/nginx.conf; do
  [ -f "$f" ] && echo "✅ $f" || { echo "❌ $f"; exit 1; }
done

[ -f server/.env.production ] && echo "✅ server/.env.production" || echo "⚠️  server/.env.production — создайте из deploy/env.server.example"
[ -f .env.production ]        && echo "✅ .env.production"        || echo "⚠️  .env.production — создайте из deploy/env.frontend.example"

echo ""
echo "📦 Backend..."
cd server && npm ci 2>/dev/null || npm install
npm run build
cd ..

echo ""
echo "📦 Frontend..."
npm ci 2>/dev/null || npm install
npm run build

echo ""
echo "✅ Сборка успешна. Для деплоя на сервер:"
echo "   DOMAIN=yourdomain.ru ./scripts/deploy-server.sh"
