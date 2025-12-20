#!/bin/bash
# Проверка строки 12

cd /var/www/ride-together/server/dist/api/rides

echo "=== Строки 1-20 с номерами ==="
cat -n list.js | head -20

echo ""
echo "=== Поиск new URL ==="
grep -n "new URL\|URL(" list.js | head -5

echo ""
echo "=== Контекст строки 12 ==="
sed -n '10,15p' list.js | cat -n

