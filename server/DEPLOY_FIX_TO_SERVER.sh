#!/bin/bash
# Скрипт для создания fix скрипта на сервере через SSH

SERVER_IP="194.67.124.123"
SERVER_USER="root"
SERVER_PATH="/var/www/ride-together/server"

echo "📤 Создание fix скрипта на сервере..."

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /var/www/ride-together/server

cat > fix-server.sh << 'EOF'
#!/bin/bash
set -e
cd /var/www/ride-together/server

echo "=== ДИАГНОСТИКА ==="
echo ""
echo "1. Статус PM2:"
pm2 status
echo ""

echo "2. Процессы на порту 3001:"
ss -tlnp | grep 3001 || echo "Порт свободен"
echo ""

echo "3. Последние логи:"
pm2 logs ride-backend --lines 5 --nostream | tail -10
echo ""

echo "4. Проверка dist/index.js:"
if [ -f dist/index.js ]; then
    echo "✅ Файл существует"
    echo "Проверка __dirname:"
    if grep -q "path.join(__dirname" dist/index.js; then
        echo "⚠️ Найдено path.join(__dirname - нужно исправить"
    else
        echo "✅ path.join(__dirname не найдено"
    fi
else
    echo "❌ dist/index.js не найден!"
    exit 1
fi
echo ""

echo "=== ИСПРАВЛЕНИЕ ==="
echo ""

# Остановка
echo "🛑 Остановка сервера..."
pm2 stop ride-backend 2>/dev/null || true
pm2 delete ride-backend 2>/dev/null || true
sleep 2

# Убить процесс на порту 3001
echo "🔍 Освобождение порта 3001..."
PID=$(ss -tlnp | grep ":3001 " | grep -oP 'pid=\K\d+' | head -1)
if [ ! -z "$PID" ]; then
    echo "Убиваем процесс $PID"
    kill -9 $PID 2>/dev/null || true
    sleep 1
fi

# Исправление dist/index.js
echo "🔧 Исправление dist/index.js..."
cd dist
if grep -q "path.join(__dirname" index.js; then
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
    print("✅ Исправлено: path.join(__dirname -> process.cwd()")
else:
    print("ℹ️ Не найдено path.join(__dirname")
PYTHON
else
    echo "✅ path.join(__dirname не найдено, исправление не требуется"
fi
cd ..

# Проверка синтаксиса
echo ""
echo "✅ Проверка синтаксиса..."
if node --check dist/index.js 2>/dev/null; then
    echo "✅ Синтаксис правильный"
else
    echo "⚠️ Синтаксические ошибки:"
    node --check dist/index.js 2>&1 | head -10
fi

# Очистка логов
echo ""
echo "🧹 Очистка логов..."
pm2 flush 2>/dev/null || true

# Запуск
echo ""
echo "🚀 Запуск сервера..."
pm2 start ecosystem.config.cjs

# Ожидание
echo ""
echo "⏳ Ожидание запуска (5 сек)..."
sleep 5

# Проверка
echo ""
echo "=== РЕЗУЛЬТАТ ==="
pm2 status
echo ""

echo "🏥 Health check:"
for i in {1..3}; do
    if curl -s -f -m 3 http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Сервер работает!"
        curl -s http://localhost:3001/health
        echo ""
        break
    else
        if [ $i -lt 3 ]; then
            echo "Попытка $i/3... ждем 2 сек"
            sleep 2
        else
            echo "❌ Health check не работает"
            echo "Логи ошибок:"
            pm2 logs ride-backend --err --lines 10 --nostream | tail -10
        fi
    fi
done

echo ""
echo "📊 Статус порта:"
ss -tlnp | grep 3001 || echo "Порт не слушается"

echo ""
echo "✅ Готово!"
EOF

chmod +x fix-server.sh
echo "✅ Скрипт создан: ./fix-server.sh"
ENDSSH

echo ""
echo "✅ Скрипт создан на сервере!"
echo "Теперь выполните на сервере:"
echo "  cd /var/www/ride-together/server"
echo "  ./fix-server.sh"

