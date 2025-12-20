#!/bin/bash
# Финальный перезапуск с правильной БД

cd /var/www/ride-together/server

echo "🔄 Финальный перезапуск PM2..."
echo ""

# Проверяем DATABASE_URL в конфиге
echo "1️⃣  DATABASE_URL в ecosystem.config.cjs:"
grep DATABASE_URL ecosystem.config.cjs

echo ""
echo "2️⃣  Перезапуск PM2 с обновлением переменных окружения..."
pm2 delete ride-backend
pm2 start ecosystem.config.cjs
sleep 4

echo ""
echo "3️⃣  Статус PM2:"
pm2 status

echo ""
echo "4️⃣  Health check:"
curl -s http://localhost:3001/health
echo ""

echo ""
echo "5️⃣  Тест API /api/rides:"
curl -s "http://localhost:3001/api/rides?limit=1"
echo ""

echo ""
echo "6️⃣  Последние ошибки (если есть):"
pm2 logs ride-backend --err --lines 5 --nostream | tail -5

echo ""
echo "✅ Готово!"

