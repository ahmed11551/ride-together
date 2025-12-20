#!/bin/bash
# Исправление req.headers.get после компиляции

cd /var/www/ride-together/server

echo "🔧 Исправление req.headers.get..."
echo ""

# Находим и исправляем все использования req.headers.get
find dist/api -name "*.js" -type f -exec sed -i 's/req\.headers\.get(/req.get(/g' {} \;
find dist/api -name "*.js" -type f -exec sed -i 's/headers\.get(/req.get(/g' {} \;

echo "✅ Исправлено в файлах:"
find dist/api -name "*.js" -type f -exec grep -l "req\.get\|req.headers\['authorization'\]" {} \; | head -5

echo ""
echo "🔍 Проверка что исправлено:"
if grep -r "req\.headers\.get\|headers\.get" dist/api 2>/dev/null; then
    echo "⚠️  Всё ещё есть headers.get, проверяем детально:"
    grep -rn "headers\.get" dist/api 2>/dev/null | head -3
else
    echo "✅ Все headers.get исправлены"
fi

echo ""
echo "🔄 Перезапуск PM2..."
pm2 restart ride-backend --update-env
sleep 3

echo ""
echo "📦 Тест API:"
curl -s "http://localhost:3001/api/rides?limit=1" | head -c 200
echo ""

