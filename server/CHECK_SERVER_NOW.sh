#!/bin/bash
# Скрипт полной проверки сервера

echo "=== ПРОВЕРКА СЕРВЕРА ==="
echo ""

echo "1. Статус PM2:"
pm2 status
echo ""

echo "2. Процессы на порту 3001:"
ss -tlnp | grep 3001 || netstat -tlnp 2>/dev/null | grep 3001 || echo "Порт 3001 не найден"
echo ""

echo "3. Последние 5 строк логов (out):"
pm2 logs ride-backend --lines 5 --nostream | tail -10
echo ""

echo "4. Последние 5 строк ошибок:"
pm2 logs ride-backend --err --lines 5 --nostream | tail -10
echo ""

echo "5. Попытка подключения к серверу:"
timeout 3 curl -v http://localhost:3001/health 2>&1 || echo "❌ Не удалось подключиться"
echo ""

echo "6. Проверка Node.js процесса:"
ps aux | grep node | grep -v grep | head -5
echo ""

echo "7. Переменные окружения PM2:"
pm2 env 0 | grep -E "PORT|HOST|DATABASE|JWT|TELEGRAM" | head -10
echo ""

echo "8. Проверка файла dist/index.js:"
if [ -f dist/index.js ]; then
    echo "✅ Файл существует"
    echo "Первые 15 строк:"
    head -15 dist/index.js
else
    echo "❌ Файл не найден!"
fi
echo ""

echo "9. Проверка __dirname в dist/index.js:"
if grep -q "__dirname" dist/index.js; then
    echo "⚠️ Найдено __dirname в dist/index.js (строки с ним):"
    grep -n "__dirname" dist/index.js | head -5
else
    echo "✅ __dirname не найден (хорошо, если используется process.cwd())"
fi
echo ""

echo "=== КОНЕЦ ПРОВЕРКИ ==="

