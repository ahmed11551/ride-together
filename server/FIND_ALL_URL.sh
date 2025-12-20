#!/bin/bash
# Поиск всех использований URL в файле

cd /var/www/ride-together/server/dist/api/rides

echo "=== Все использования URL (с номерами строк) ==="
grep -n "URL" list.js

echo ""
echo "=== Полный файл (первые 100 строк) ==="
head -100 list.js | cat -n

