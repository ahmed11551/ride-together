#!/bin/bash
# Проверка и исправление __dirname в dist/index.js

cd /var/www/ride-together/server/dist || exit 1

echo "🔍 Проверка dist/index.js..."

if [ ! -f index.js ]; then
    echo "❌ Файл index.js не найден!"
    exit 1
fi

# Проверяем, есть ли проблемные использования __dirname
if grep -q "path\.join(__dirname" index.js; then
    echo "⚠️  Найдено использование path.join(__dirname - исправляем..."
    sed -i 's/path\.join(__dirname,/path.join(process.cwd(),/g' index.js
    echo "✅ Исправлено!"
else
    echo "✅ Использований path.join(__dirname не найдено"
fi

# Проверяем, есть ли определение __dirname
if ! grep -q "let __dirname\|const __dirname" index.js; then
    echo "⚠️  Определение __dirname не найдено, но это нормально если используется только process.cwd()"
fi

# Проверяем синтаксис
echo ""
echo "📋 Проверка синтаксиса..."
if node --check index.js 2>&1; then
    echo "✅ Синтаксис правильный!"
else
    echo "❌ Ошибка синтаксиса!"
    exit 1
fi

# Показываем строку 10 для проверки
echo ""
echo "📋 Строка 10 файла:"
sed -n '10p' index.js

echo ""
echo "✅ Проверка завершена!"

