#!/bin/bash
# Проверка ошибок после исправления

cd /var/www/ride-together/server

echo "🔍 Проверка последних ошибок..."
echo ""

echo "📋 Последние 30 строк ошибок:"
pm2 logs ride-backend --err --lines 30 --nostream | tail -30

echo ""
echo "📋 Последние 10 строк всех логов:"
pm2 logs ride-backend --lines 10 --nostream | tail -10

