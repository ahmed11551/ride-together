#!/bin/bash
# Скрипт для загрузки исходников на сервер и сборки там

echo "📦 Создание архива с исходниками..."
cd "$(dirname "$0")"

# Создаем архив с исходниками
tar -czf /tmp/server-sources.tar.gz \
  server/*.ts \
  server/api \
  server/utils \
  server/websocket \
  server/tsconfig.json \
  server/package.json \
  server/package-lock.json \
  server/.env.production 2>/dev/null || \
tar -czf /tmp/server-sources.tar.gz \
  server/*.ts \
  server/api \
  server/utils \
  server/websocket \
  server/tsconfig.json \
  server/package.json \
  server/package-lock.json

echo "📤 Загрузка на сервер..."
scp /tmp/server-sources.tar.gz root@194.67.124.123:/tmp/

echo "✅ Загружено! Теперь на сервере выполните:"
echo ""
echo "cd /var/www/ride-together/server"
echo "pm2 stop ride-backend"
echo "tar -xzf /tmp/server-sources.tar.gz"
echo "npm install"
echo "npm run build"
echo "pm2 restart ride-backend || pm2 start dist/index.js --name ride-backend"
echo "pm2 logs ride-backend --lines 50"

