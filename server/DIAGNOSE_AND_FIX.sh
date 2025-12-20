#!/bin/bash
# Диагностика и исправление ошибки URL

cd /var/www/ride-together/server

echo "🔍 Диагностика ошибки..."
echo ""

echo "1️⃣  Проверка проблемной строки 12 в list.js:"
head -30 dist/api/rides/list.js | cat -n
echo ""

echo "2️⃣  Поиск использования URL в файле:"
grep -n "new URL\|URL(" dist/api/rides/list.js | head -5
echo ""

echo "3️⃣  Контекст вокруг строки 12:"
sed -n '5,20p' dist/api/rides/list.js | cat -n
echo ""

echo "4️⃣  Перекомпиляция TypeScript..."
rm -rf dist
npx tsc --noEmitOnError false 2>&1 | tail -10
echo ""

echo "5️⃣  Проверка что получилось:"
head -20 dist/api/rides/list.js | cat -n
echo ""

echo "6️⃣  Исправление импортов и __dirname..."
if [ -f "fix-imports.js" ]; then
    node fix-imports.js 2>/dev/null || echo "fix-imports пропущен"
fi

# Исправление __dirname
cd dist
python3 << 'PYTHON'
with open('index.js', 'r') as f:
    content = f.read()
if 'path.join(__dirname' in content:
    content = content.replace('path.join(__dirname,', 'path.join(process.cwd(),')
    with open('index.js', 'w') as f:
        f.write(content)
    print("✅ __dirname исправлен")
PYTHON
cd ..

echo ""
echo "7️⃣  Перезапуск PM2..."
pm2 restart ride-backend --update-env
sleep 3

echo ""
echo "8️⃣  Тест API:"
curl -s "http://localhost:3001/api/rides?limit=1" | head -c 300
echo ""

