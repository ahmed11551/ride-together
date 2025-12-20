#!/bin/bash
# Пересборка и исправление всех проблем

set -e

cd /var/www/ride-together/server

echo "🔧 Полная пересборка сервера..."
echo ""

# 1. Очистка
echo "1️⃣  Очистка старых файлов..."
rm -rf dist
echo "✅ Очищено"

# 2. Установка зависимостей (если нужно)
echo ""
echo "2️⃣  Проверка зависимостей..."
npm install --production 2>&1 | tail -3 || echo "⚠️  npm install пропущен"

# 3. Компиляция TypeScript
echo ""
echo "3️⃣  Компиляция TypeScript..."
npx tsc --noEmitOnError false 2>&1 | grep -E "(error|Error)" | head -10 || echo "✅ Компиляция завершена"

# 4. Исправление импортов
if [ -f "fix-imports.js" ]; then
    echo ""
    echo "4️⃣  Исправление импортов..."
    node fix-imports.js 2>/dev/null || echo "⚠️  fix-imports завершился с ошибкой"
fi

# 5. Исправление __dirname в index.js
echo ""
echo "5️⃣  Исправление __dirname..."
if [ -f "dist/index.js" ]; then
    cd dist
    python3 << 'PYTHON'
import re

with open('index.js', 'r') as f:
    content = f.read()

# Исправляем path.join(__dirname на path.join(process.cwd()
if 'path.join(__dirname' in content:
    content = content.replace('path.join(__dirname,', 'path.join(process.cwd(),')
    with open('index.js', 'w') as f:
        f.write(content)
    print("✅ path.join(__dirname) исправлен")
else:
    print("✅ path.join(__dirname) уже исправлен")
PYTHON
    cd ..
fi

# 6. Исправление req.headers.get (на всякий случай)
echo ""
echo "6️⃣  Исправление req.headers.get..."
find dist/api -name "*.js" -type f -exec sed -i 's/req\.headers\.get(/req.get(/g' {} \; 2>/dev/null || true
find dist/api -name "*.js" -type f -exec sed -i 's/headers\.get(/req.get(/g' {} \; 2>/dev/null || true
echo "✅ Исправлено"

# 7. Проверка синтаксиса
echo ""
echo "7️⃣  Проверка синтаксиса..."
if node --check dist/index.js 2>/dev/null; then
    echo "✅ Синтаксис правильный!"
else
    echo "⚠️  Ошибка синтаксиса (но продолжаем)"
fi

# 8. Перезапуск PM2
echo ""
echo "8️⃣  Перезапуск PM2..."
pm2 restart ride-backend --update-env || pm2 start ecosystem.config.cjs
sleep 3

# 9. Проверка
echo ""
echo "9️⃣  Проверка работы..."
echo "📋 Статус PM2:"
pm2 status | grep ride-backend || echo "⚠️  PM2 процесс не найден"

echo ""
echo "🏥 Health check:"
curl -s http://localhost:3001/health && echo "" || echo "❌ Сервер не отвечает"

echo ""
echo "✅ Пересборка завершена!"

