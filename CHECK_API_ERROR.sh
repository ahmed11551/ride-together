#!/bin/bash
# Проверка ошибок API на сервере

echo "🔍 Проверка ошибок API..."
echo ""

# Выполнить на сервере
ssh root@194.67.124.123 << 'EOF'
cd /var/www/ride-together/server

echo "📋 Последние ошибки PM2:"
pm2 logs ride-backend --err --lines 30 --nostream | tail -30

echo ""
echo "🔍 Проверка исправления req.headers.get:"
grep -n "headers.get\|req.headers.get" dist/api/rides/list.js | head -5 || echo "✅ Не найдено (исправлено)"

echo ""
echo "🏥 Тест API напрямую:"
curl -s "http://localhost:3001/api/rides?limit=1" | head -c 500
echo ""

echo ""
echo "🔍 Проверка подключения к БД:"
curl -s http://localhost:3001/health | jq . 2>/dev/null || curl -s http://localhost:3001/health
echo ""
EOF

