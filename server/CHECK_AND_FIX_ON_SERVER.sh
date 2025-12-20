#!/bin/bash
# Проверка и восстановление на сервере

cd /var/www/ride-together

echo "🔍 Поиск файлов проекта..."
echo ""

# Проверяем что есть на сервере
echo "1️⃣  Структура /var/www/ride-together:"
ls -la
echo ""

# Ищем исходники фронтенда
echo "2️⃣  Поиск исходников фронтенда:"
find . -name "package.json" -o -name "vite.config.ts" -o -name "src" -type d 2>/dev/null | head -10
echo ""

# Проверяем server/dist
echo "3️⃣  Проверка server/dist:"
if [ -d "server/dist" ]; then
  ls -la server/dist/ | head -10
  if [ -f "server/dist/index.html" ]; then
    echo "   ✅ index.html найден в server/dist"
    echo ""
    echo "📋 Копирую в frontend-dist..."
    cd frontend-dist
    rm -rf *
    cp -r ../server/dist/* .
    chown -R www-data:www-data .
    chmod -R 755 .
    echo "✅ Скопировано!"
    ls -la index.html
  fi
else
  echo "   ❌ server/dist не найден"
fi
echo ""

# Проверяем есть ли фронтенд где-то еще
echo "4️⃣  Поиск других мест с фронтендом:"
find /var/www -name "index.html" -type f 2>/dev/null | grep -v node_modules | head -5

