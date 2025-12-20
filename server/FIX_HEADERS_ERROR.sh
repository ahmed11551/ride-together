#!/bin/bash
# Исправление ошибки req.headers.get

cd /var/www/ride-together/server

echo "🔧 Исправление ошибки req.headers.get..."
echo ""

# Исправляем все файлы в dist/api
echo "1️⃣  Поиск файлов с ошибкой:"
find dist/api -name "*.js" -exec grep -l "headers\.get\|req\.headers\.get" {} \; 2>/dev/null

echo ""
echo "2️⃣  Исправление..."
find dist/api -name "*.js" -exec sed -i 's/req\.headers\.get(/req.get(/g' {} \;
find dist/api -name "*.js" -exec sed -i 's/headers\.get(/req.get(/g' {} \;

echo "✅ Исправлено"
echo ""

# Перезапуск
echo "3️⃣  Перезапуск PM2..."
pm2 restart ride-backend --update-env
sleep 3

# Проверка
echo ""
echo "4️⃣  Проверка:"
curl -s http://localhost:3001/api/rides?limit=1 && echo "" || echo "Ошибка"

