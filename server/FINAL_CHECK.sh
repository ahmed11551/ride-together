#!/bin/bash
# Финальная проверка состояния

cd /var/www/ride-together/server/dist

echo "=== Строки 1-20 в index.js ==="
head -20 index.js

echo ""
echo "=== Все использования __dirname ==="
grep -n "__dirname" index.js

echo ""
echo "=== Проверка синтаксиса ==="
node --check index.js 2>&1

echo ""
echo "=== Полные логи ошибок (последние 10) ==="
pm2 logs ride-backend --err --lines 10 --nostream

echo ""
echo "=== Полные логи успешного запуска (последние 10) ==="
pm2 logs ride-backend --out --lines 10 --nostream

echo ""
echo "=== Статус процесса ==="
pm2 status

echo ""
echo "=== Health check ==="
curl -v http://localhost:3001/health 2>&1 | head -15

echo ""
echo "=== Процессы Node ==="
ps aux | grep node | grep -v grep

