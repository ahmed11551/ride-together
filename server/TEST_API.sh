#!/bin/bash
# Проверка работы API после пересборки

cd /var/www/ride-together/server

echo "🔍 Проверка работы API..."
echo ""

echo "1️⃣  Исправление __dirname (правильный способ)..."
cd dist
python3 -c "
with open('index.js', 'r') as f:
    content = f.read()
if 'path.join(__dirname' in content:
    content = content.replace('path.join(__dirname,', 'path.join(process.cwd(),')
    with open('index.js', 'w') as f:
        f.write(content)
    print('✅ Исправлено')
else:
    print('✅ Уже исправлено')
"
cd ..

echo ""
echo "2️⃣  Перезапуск PM2..."
pm2 restart ride-backend --update-env
sleep 4

echo ""
echo "3️⃣  Проверка статуса..."
pm2 status | grep ride-backend

echo ""
echo "4️⃣  Health check:"
curl -s http://localhost:3001/health
echo ""
echo ""

echo "5️⃣  API тест (/api/rides):"
curl -s "http://localhost:3001/api/rides?limit=1"
echo ""
echo ""

echo "6️⃣  Последние ошибки (если есть):"
pm2 logs ride-backend --err --lines 10 --nostream | tail -10

