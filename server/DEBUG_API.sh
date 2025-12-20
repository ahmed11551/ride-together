#!/bin/bash
# Детальная диагностика API

cd /var/www/ride-together/server

echo "🔍 Детальная диагностика API..."
echo ""

echo "1️⃣  Последние ошибки PM2:"
pm2 logs ride-backend --err --lines 50 --nostream | grep -A 5 "List rides error" | tail -20
echo ""

echo "2️⃣  Проверка исправления headers.get:"
if grep -q "req.headers.get\|headers.get" dist/api/rides/list.js 2>/dev/null; then
    echo "❌ Всё ещё есть headers.get в коде!"
    grep -n "headers.get" dist/api/rides/list.js | head -3
else
    echo "✅ headers.get исправлен"
fi
echo ""

echo "3️⃣  Проверка структуры файла list.js:"
head -20 dist/api/rides/list.js | grep -E "import|export|function|req\." | head -10
echo ""

echo "4️⃣  Тест подключения к БД (через health):"
curl -s http://localhost:3001/health
echo ""
echo ""

echo "5️⃣  Прямой тест API с подробностями:"
curl -v "http://localhost:3001/api/rides?limit=1" 2>&1 | grep -E "< HTTP|error|Error" | head -5
echo ""

echo "6️⃣  Проверка что сервер вообще работает:"
ps aux | grep "node.*dist/index.js" | grep -v grep || echo "❌ Процесс не найден"
echo ""

echo "7️⃣  Проверка порта 3001:"
ss -tlnp | grep 3001 || echo "❌ Порт не слушается"
echo ""

echo "✅ Диагностика завершена"

