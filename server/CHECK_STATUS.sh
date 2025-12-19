#!/bin/bash
# Проверка текущего состояния сервера

cd /var/www/ride-together/server/dist

echo "=== Проверка строки 10 в index.js ==="
sed -n '10p' index.js

echo ""
echo "=== Строки 8-15 ==="
sed -n '8,15p' index.js

echo ""
echo "=== Проверка синтаксиса ==="
node --check index.js 2>&1

echo ""
echo "=== Полные логи ошибок (последние 10 строк) ==="
pm2 logs ride-backend --err --lines 10 --nostream

echo ""
echo "=== Полные логи успешного запуска (последние 10 строк) ==="
pm2 logs ride-backend --out --lines 10 --nostream

echo ""
echo "=== Статус PM2 ==="
pm2 status

echo ""
echo "=== Проверка что сервер слушает порт ==="
netstat -tlnp 2>/dev/null | grep 3001 || ss -tlnp 2>/dev/null | grep 3001

echo ""
echo "=== Попытка подключиться к серверу ==="
timeout 2 curl -v http://localhost:3001/health 2>&1 || echo "Не удалось подключиться"

echo ""
echo "=== Проверка что процесс работает ==="
ps aux | grep node | grep -v grep

