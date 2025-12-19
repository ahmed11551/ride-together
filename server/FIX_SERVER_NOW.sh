#!/bin/bash
# Срочное исправление сервера

set -e

echo "🔧 Диагностика и исправление сервера..."
cd /var/www/ride-together/server

# 1. Проверка текущего состояния
echo ""
echo "=== ТЕКУЩЕЕ СОСТОЯНИЕ ==="
pm2 status
echo ""

# 2. Остановка сервера
echo "🛑 Остановка сервера..."
pm2 stop ride-backend || true
pm2 delete ride-backend || true
sleep 2

# 3. Проверка что порт свободен
echo ""
echo "🔍 Проверка порта 3001:"
if ss -tlnp | grep -q ":3001 "; then
    echo "⚠️ Порт 3001 занят! Убиваем процесс..."
    PID=$(ss -tlnp | grep ":3001 " | grep -oP 'pid=\K\d+' | head -1)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null || true
        sleep 1
    fi
fi

# 4. Очистка старых логов
echo ""
echo "🧹 Очистка старых логов..."
pm2 flush || true

# 5. Проверка файлов
echo ""
echo "📁 Проверка файлов:"
if [ ! -f dist/index.js ]; then
    echo "❌ dist/index.js не найден! Пересобираем..."
    npm run build
else
    echo "✅ dist/index.js существует"
fi

# 6. Проверка __dirname в dist/index.js
echo ""
echo "🔍 Проверка __dirname..."
if grep -q 'path.join(__dirname' dist/index.js; then
    echo "⚠️ Найдено path.join(__dirname, нужно исправить..."
    cd dist
    python3 << 'PYTHON'
import re
with open('index.js', 'r') as f:
    content = f.read()

# Заменяем path.join(__dirname, на path.join(process.cwd(),
old_pattern = r'path\.join\(__dirname,'
new_replacement = r'path.join(process.cwd(),'

if re.search(old_pattern, content):
    content = re.sub(old_pattern, new_replacement, content)
    with open('index.js', 'w') as f:
        f.write(content)
    print("✅ Исправлено path.join(__dirname")
else:
    print("✅ path.join(__dirname не найден (хорошо)")
PYTHON
    cd ..
fi

# 7. Проверка синтаксиса
echo ""
echo "✅ Проверка синтаксиса..."
node --check dist/index.js && echo "✅ Синтаксис правильный!" || {
    echo "❌ Синтаксическая ошибка"
    node --check dist/index.js 2>&1 | head -10
    exit 1
}

# 8. Запуск сервера
echo ""
echo "🚀 Запуск сервера..."
pm2 start ecosystem.config.cjs

# 9. Ожидание запуска
echo ""
echo "⏳ Ожидание запуска (5 сек)..."
sleep 5

# 10. Проверка
echo ""
echo "=== ПРОВЕРКА ==="
pm2 status
echo ""

echo "📋 Логи (последние 10 строк):"
pm2 logs ride-backend --lines 10 --nostream | tail -15
echo ""

echo "🏥 Health check:"
for i in {1..3}; do
    echo "Попытка $i/3..."
    if curl -s -f http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Сервер работает!"
        curl -s http://localhost:3001/health | jq . || curl -s http://localhost:3001/health
        break
    else
        echo "❌ Не отвечает, ждем 2 сек..."
        sleep 2
    fi
done

echo ""
echo "📊 Статус порта 3001:"
ss -tlnp | grep 3001 || echo "⚠️ Порт не слушается"

echo ""
echo "✅ Готово!"

