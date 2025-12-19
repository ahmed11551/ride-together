#!/bin/bash
# Скрипт для исправления проблем с импортами на сервере

set -e

echo "🔧 Исправление проблем с импортами..."

cd /var/www/ride-together/server || exit 1

echo "📦 Установка зависимостей..."
npm install

echo "🔨 Пересборка проекта..."
npm run build

echo "🔄 Перезапуск PM2..."
pm2 restart ride-backend || pm2 start dist/index.js --name ride-backend

echo "✅ Готово! Проверьте логи:"
echo "pm2 logs ride-backend --lines 50"

