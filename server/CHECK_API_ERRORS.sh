#!/bin/bash
# Проверка ошибок API

cd /var/www/ride-together/server

echo "🔍 Диагностика API ошибок..."
echo ""

# 1. Проверка маршрута напрямую через Express
echo "1️⃣  Проверка напрямую через Express:"
curl -s http://localhost:3001/api/rides?limit=1
echo ""
echo ""

# 2. Проверка логов PM2
echo "2️⃣  Последние ошибки в логах:"
pm2 logs ride-backend --err --lines 20 --nostream | tail -20 | grep -i "error\|ride\|api" | head -10
echo ""

# 3. Проверка что файлы API существуют
echo "3️⃣  Проверка файлов API:"
if [ -f "api/rides/list.ts" ]; then
  echo "   ✅ api/rides/list.ts существует"
else
  echo "   ❌ api/rides/list.ts НЕ найден!"
fi

if [ -f "dist/api/rides/list.js" ]; then
  echo "   ✅ dist/api/rides/list.js скомпилирован"
  ls -lh dist/api/rides/list.js
else
  echo "   ❌ dist/api/rides/list.js НЕ скомпилирован!"
fi
echo ""

# 4. Проверка базы данных
echo "4️⃣  Проверка подключения к БД:"
# Если есть способ проверить БД через API
curl -s http://localhost:3001/health | jq 2>/dev/null || curl -s http://localhost:3001/health
echo ""

# 5. Проверка переменных окружения
echo "5️⃣  Проверка DATABASE_URL:"
pm2 show ride-backend | grep DATABASE_URL || echo "   Не найдено в PM2"
echo ""

echo "✅ Диагностика завершена"

