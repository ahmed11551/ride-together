#!/bin/bash
# Финальное исправление __dirname

cd /var/www/ride-together/server/dist || exit 1

echo "🔍 Проверка строки 10:"
sed -n '10p' index.js

echo ""
echo "🔍 Все использования __dirname:"
grep -n "__dirname" index.js | head -10

echo ""
echo "🔧 Исправление..."

# Создаём резервную копию
cp index.js index.js.backup.$(date +%Y%m%d_%H%M%S)

# Заменяем все использования __dirname
sed -i 's/__dirname/process.cwd()/g' index.js

echo ""
echo "✅ Заменено. Проверка синтаксиса..."
if node --check index.js; then
    echo "✅ Синтаксис правильный!"
    echo ""
    echo "📋 Проверка строки 10 после исправления:"
    sed -n '10p' index.js
else
    echo "❌ Ошибка синтаксиса!"
    exit 1
fi

echo ""
echo "✅ Готово! Теперь перезапустите: pm2 restart ride-backend"

