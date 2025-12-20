#!/bin/bash
# Простое исправление __dirname - заменяем все использования на process.cwd()

cd /var/www/ride-together/server/dist || exit 1

echo "🔧 Исправление __dirname в dist/index.js..."

if [ ! -f index.js ]; then
    echo "❌ Файл dist/index.js не найден!"
    exit 1
fi

# Просто заменяем все path.join(__dirname на path.join(process.cwd()
sed -i 's/path\.join(__dirname,/path.join(process.cwd(),/g' index.js

# Проверяем синтаксис
if node --check index.js; then
    echo "✅ Исправлено! Синтаксис правильный."
else
    echo "❌ Ошибка синтаксиса после исправления"
    exit 1
fi

echo "✅ Готово!"

