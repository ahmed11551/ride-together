#!/bin/bash
# Скрипт для обновления файлов на сервере через scp

SERVER_IP="194.67.124.123"
SERVER_USER="root"
SERVER_PATH="/var/www/ride-together/server"

echo "📦 Обновление файлов на сервере..."

# Обновляем только измененные TypeScript файлы
scp -r api/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
scp index.ts ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
scp tsconfig.json ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
scp package.json ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
scp fix-imports.js ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
scp fix-imports-simple.js ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/

echo "✅ Файлы загружены!"
echo ""
echo "Теперь подключитесь к серверу и выполните:"
echo "  ssh ${SERVER_USER}@${SERVER_IP}"
echo "  cd ${SERVER_PATH}"
echo "  npm install"
echo "  npm run build"
echo "  pm2 restart ride-backend"

