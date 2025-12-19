#!/bin/bash
# Быстрое исправление - заменяем __dirname на process.cwd() везде где используется до определения

cd /var/www/ride-together/server/dist

echo "=== Текущие строки 1-20 ==="
head -20 index.js

echo ""
echo "=== Заменяем __dirname на process.cwd() в path.join ==="

# Заменяем все использования __dirname в path.join на process.cwd()
sed -i 's/path\.join(__dirname,/path.join(process.cwd(),/g' index.js

# Также заменяем если используется без path.join
sed -i 's/__dirname/process.cwd()/g' index.js

echo "✅ Замена выполнена"

echo ""
echo "=== Результат (строки 1-20) ==="
head -20 index.js

echo ""
echo "=== Проверка синтаксиса ==="
node --check index.js && echo "✅ Синтаксис правильный!" || {
    echo "❌ Ошибка синтаксиса"
    node --check index.js 2>&1 | head -5
}

echo ""
echo "🔄 Перезапуск PM2..."
cd /var/www/ride-together/server
pm2 restart ride-backend

sleep 5

echo ""
echo "📋 Логи ошибок:"
pm2 logs ride-backend --err --lines 5 --nostream

echo ""
echo "📋 Логи успешного запуска:"
pm2 logs ride-backend --out --lines 5 --nostream | tail -5

echo ""
echo "📋 Health check:"
curl -s http://localhost:3001/health && echo -e "\n✅✅✅ СЕРВЕР РАБОТАЕТ!" || echo "❌ Не отвечает"

