#!/bin/bash
# Скопируйте и выполните ЭТУ команду НА СЕРВЕРЕ:

# ============================================================
# ВСТАВЬТЕ ВСЁ ЭТО В SSH СЕССИЮ НА СЕРВЕРЕ:
# ============================================================

cat > /var/www/ride-together/server/fix-server.sh << 'EOF'
#!/bin/bash
set -e
cd /var/www/ride-together/server

echo "=== ДИАГНОСТИКА ==="
pm2 status
echo ""

echo "🛑 Остановка сервера..."
pm2 stop ride-backend 2>/dev/null || true
pm2 delete ride-backend 2>/dev/null || true
sleep 2

echo "🔍 Освобождение порта 3001..."
PID=$(ss -tlnp 2>/dev/null | grep ":3001 " | grep -oP 'pid=\K\d+' | head -1 || echo "")
if [ ! -z "$PID" ]; then
    kill -9 $PID 2>/dev/null || true
    sleep 1
fi

echo "🔧 Исправление dist/index.js..."
cd dist
if grep -q "path.join(__dirname" index.js 2>/dev/null; then
    python3 << 'PYTHON'
import re
with open('index.js', 'r') as f:
    content = f.read()
old_pattern = r'path\.join\(__dirname,'
new_replacement = r'path.join(process.cwd(),'
if re.search(old_pattern, content):
    content = re.sub(old_pattern, new_replacement, content)
    with open('index.js', 'w') as f:
        f.write(content)
    print("✅ Исправлено: path.join(__dirname -> process.cwd()")
else:
    print("ℹ️ Не найдено path.join(__dirname")
PYTHON
else
    echo "✅ path.join(__dirname не найдено"
fi
cd ..

echo "✅ Проверка синтаксиса..."
node --check dist/index.js && echo "✅ OK" || echo "⚠️ Ошибки"

echo "🧹 Очистка логов..."
pm2 flush 2>/dev/null || true

echo "🚀 Запуск сервера..."
pm2 start ecosystem.config.cjs

echo "⏳ Ожидание (5 сек)..."
sleep 5

echo "=== РЕЗУЛЬТАТ ==="
pm2 status
echo ""

echo "🏥 Health check:"
if curl -s -f -m 3 http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Сервер работает!"
    curl -s http://localhost:3001/health
    echo ""
else
    echo "❌ Health check не работает"
    echo "Логи ошибок:"
    pm2 logs ride-backend --err --lines 10 --nostream 2>/dev/null | tail -10
fi
EOF

chmod +x /var/www/ride-together/server/fix-server.sh
echo "✅ Скрипт создан! Теперь выполните:"
echo "   cd /var/www/ride-together/server"
echo "   ./fix-server.sh"

