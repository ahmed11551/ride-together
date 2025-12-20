#!/bin/bash
# Проверка подключения к БД и свежих ошибок

cd /var/www/ride-together/server

echo "🔍 Проверка подключения к БД..."
echo ""

# 1. Проверка DATABASE_URL
echo "1️⃣  DATABASE_URL в PM2:"
pm2 show ride-backend | grep DATABASE_URL || echo "Не найдено"

echo ""
echo "2️⃣  Тест подключения к БД через health:"
curl -s http://localhost:3001/health
echo ""

echo ""
echo "3️⃣  Делаем новый запрос и смотрим логи:"
curl -s "http://localhost:3001/api/rides?limit=1" > /dev/null &
sleep 2

echo ""
echo "4️⃣  Свежие ошибки (последние 10 строк):"
pm2 logs ride-backend --err --lines 10 --nostream | tail -10

echo ""
echo "5️⃣  Проверка что сервер запущен:"
pm2 status | grep ride-backend

