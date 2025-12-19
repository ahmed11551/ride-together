#!/bin/bash
# Команды для выполнения на сервере после загрузки файлов

cd /var/www/ride-together/server

echo "📦 Установка зависимостей..."
npm install

echo "🔨 Сборка проекта..."
npm run build

echo "🔄 Перезапуск PM2..."
pm2 restart ride-backend

echo "📋 Проверка статуса..."
pm2 status

echo "📝 Последние логи:"
pm2 logs ride-backend --lines 20 --nostream

echo ""
echo "✅ Готово! Проверьте логи:"
echo "pm2 logs ride-backend --lines 50"

