#!/bin/bash
# Полное исправление после перекомпиляции

cd /var/www/ride-together/server

echo "5️⃣  Исправление __dirname в index.js..."
cd dist
python3 << 'PYTHON'
with open('index.js', 'r') as f:
    content = f.read()
if 'path.join(__dirname' in content:
    content = content.replace('path.join(__dirname,', 'path.join(process.cwd(),')
    with open('index.js', 'w') as f:
        f.write(content)
    print("✅ __dirname исправлен")
else:
    print("✅ __dirname уже исправлен")
PYTHON
cd ..

echo ""
echo "6️⃣  Проверка синтаксиса..."
if node --check dist/index.js 2>/dev/null; then
    echo "✅ Синтаксис правильный"
else
    echo "⚠️  Ошибка синтаксиса (но продолжаем)"
    node --check dist/index.js 2>&1 | head -3
fi

echo ""
echo "7️⃣  Перезапуск PM2..."
pm2 restart ride-backend --update-env
sleep 3

echo ""
echo "8️⃣  Проверка работы..."
echo "📋 Статус PM2:"
pm2 status | grep ride-backend

echo ""
echo "🏥 Health check:"
curl -s http://localhost:3001/health
echo ""

echo ""
echo "📦 API тест (/api/rides):"
curl -s "http://localhost:3001/api/rides?limit=1" | head -c 300
echo ""

echo ""
echo "✅ Готово!"

