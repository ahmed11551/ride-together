#!/bin/bash

# Полное исправление __dirname в dist/index.js

cd /var/www/ride-together/server

echo "🔍 Проверяем dist/index.js строки 1-20..."
head -20 dist/index.js

echo ""
echo "🔧 Применяем исправления..."

# Сначала заменяем все path.join(__dirname на path.join(process.cwd()
sed -i 's/path\.join(__dirname/path.join(process.cwd()/g' dist/index.js

# Удаляем все варианты определения __dirname
sed -i '/const __filename = fileURLToPath(import\.meta\.url);/d' dist/index.js
sed -i '/const __dirname = dirname(__filename);/d' dist/index.js
sed -i '/let __filename = fileURLToPath(import\.meta\.url);/d' dist/index.js
sed -i '/let __dirname = dirname(__filename);/d' dist/index.js
sed -i '/const __dirname = dirname(fileURLToPath(import\.meta\.url));/d' dist/index.js
sed -i '/let __dirname = dirname(fileURLToPath(import\.meta\.url));/d' dist/index.js

# Заменяем использование __dirname на process.cwd()
sed -i 's/__dirname/process.cwd()/g' dist/index.js

echo ""
echo "🔍 Проверяем результат (строки 1-20)..."
head -20 dist/index.js

echo ""
echo "🔍 Ищем оставшиеся __dirname..."
if grep -n "__dirname" dist/index.js; then
  echo "⚠️  Найдены оставшиеся __dirname!"
else
  echo "✅ __dirname полностью удалён"
fi

echo ""
echo "🔄 Перезапускаем PM2..."
pm2 restart ride-backend

echo ""
echo "⏳ Ждём 3 секунды..."
sleep 3

echo ""
echo "📋 Проверяем логи..."
pm2 logs ride-backend --err --lines 10 --nostream

