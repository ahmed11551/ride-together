#!/bin/bash
# Комплексное исправление всех проблем на сервере

set -e

echo "🔧 Начало комплексного исправления..."
echo ""

cd /var/www/ride-together/server

# 1. Исправление ошибки req.headers.get
echo "1️⃣  Исправление req.headers.get в API..."
find dist/api -name "*.js" -type f -exec sed -i 's/req\.headers\.get(/req.get(/g' {} \; 2>/dev/null || echo "⚠️  Файлы не найдены"
find dist/api -name "*.js" -type f -exec sed -i 's/headers\.get(/req.get(/g' {} \; 2>/dev/null || echo "⚠️  Файлы не найдены"
echo "✅ Исправлено"

# 2. Исправление Nginx proxy_pass
echo ""
echo "2️⃣  Исправление Nginx proxy_pass..."
if [ -f "/etc/nginx/sites-available/ride-together-api" ]; then
    sed -i.bak 's|proxy_pass http://127.0.0.1:3001/;|proxy_pass http://127.0.0.1:3001;|g' /etc/nginx/sites-available/ride-together-api
    sed -i.bak 's|proxy_pass http://localhost:3001/;|proxy_pass http://localhost:3001;|g' /etc/nginx/sites-available/ride-together-api
    rm -f /etc/nginx/sites-available/ride-together-api.bak 2>/dev/null || true
    
    if nginx -t 2>/dev/null; then
        systemctl reload nginx
        echo "✅ Nginx обновлен и перезагружен"
    else
        echo "⚠️  Ошибка в конфигурации Nginx, проверьте вручную"
    fi
else
    echo "⚠️  Файл конфигурации Nginx не найден"
fi

# 3. Восстановление frontend файлов
echo ""
echo "3️⃣  Восстановление frontend файлов..."
if [ -f "/tmp/frontend.tar.gz" ]; then
    mkdir -p /var/www/ride-together/frontend-dist
    cd /var/www/ride-together/frontend-dist
    rm -rf * 2>/dev/null || true
    tar -xzf /tmp/frontend.tar.gz
    chown -R www-data:www-data .
    chmod -R 755 .
    echo "✅ Frontend файлы восстановлены из /tmp/frontend.tar.gz"
elif [ -d "/var/www/ride-together/server/../dist" ]; then
    mkdir -p /var/www/ride-together/frontend-dist
    cp -r /var/www/ride-together/server/../dist/* /var/www/ride-together/frontend-dist/ 2>/dev/null || true
    chown -R www-data:www-data /var/www/ride-together/frontend-dist
    chmod -R 755 /var/www/ride-together/frontend-dist
    echo "✅ Frontend файлы скопированы из dist"
else
    echo "⚠️  Архив frontend не найден в /tmp/frontend.tar.gz и dist не найден"
    echo "   Загрузите frontend.tar.gz на сервер: scp frontend.tar.gz root@194.67.124.123:/tmp/"
fi

# 4. Перезапуск PM2
echo ""
echo "4️⃣  Перезапуск PM2..."
cd /var/www/ride-together/server
pm2 restart ride-backend --update-env || pm2 start ecosystem.config.cjs
sleep 3
echo "✅ PM2 перезапущен"

# 5. Проверка
echo ""
echo "5️⃣  Проверка работы..."
echo ""

echo "📋 Статус PM2:"
pm2 status | grep ride-backend || echo "⚠️  PM2 процесс не найден"

echo ""
echo "🏥 Health check:"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Сервер отвечает"
    curl -s http://localhost:3001/health | head -c 100
    echo ""
else
    echo "❌ Сервер не отвечает"
fi

echo ""
echo "📦 API тест (/api/rides):"
if curl -s "http://localhost:3001/api/rides?limit=1" > /dev/null 2>&1; then
    echo "✅ API работает"
    curl -s "http://localhost:3001/api/rides?limit=1" | head -c 200
    echo "..."
else
    echo "❌ API не работает"
fi

echo ""
echo "📁 Frontend файлы:"
if [ -f "/var/www/ride-together/frontend-dist/index.html" ]; then
    echo "✅ index.html найден"
    ls -lh /var/www/ride-together/frontend-dist/index.html | awk '{print "   Размер:", $5}'
else
    echo "❌ index.html не найден"
fi

echo ""
echo "✅ Исправление завершено!"

