#!/bin/bash
# Полное исправление всех проблем

set -e

cd /var/www/ride-together/server

echo "🔧 Полное исправление проблем..."
echo ""

# 1. Исправление ошибки req.headers.get в dist файлах
echo "1️⃣  Исправление req.headers.get в dist файлах..."
find dist/api -name "*.js" -type f -exec sed -i.bak 's/req\.headers\.get(/req.get(/g' {} \;
find dist/api -name "*.js" -type f -exec sed -i.bak 's/headers\.get(/req.get(/g' {} \;
find dist/api -name "*.js.bak" -delete 2>/dev/null || true
echo "✅ Исправлено"

# 2. Перекомпиляция TypeScript (если исходники есть)
echo ""
echo "2️⃣  Перекомпиляция TypeScript..."
if [ -f "tsconfig.json" ]; then
    rm -rf dist
    npx tsc --noEmitOnError false 2>&1 | grep -E "(error|Error)" | head -5 || echo "Компиляция завершена"
    
    # Снова исправляем импорты
    if [ -f "fix-imports.js" ]; then
        node fix-imports.js 2>/dev/null || echo "fix-imports завершился с ошибкой"
    fi
    
    # Исправляем __dirname в index.js
    if [ -f "dist/index.js" ]; then
        cd dist
        python3 << 'PYTHON'
import re

with open('index.js', 'r') as f:
    content = f.read()

# Исправляем path.join(__dirname на path.join(process.cwd()
if 'path.join(__dirname' in content:
    content = content.replace('path.join(__dirname,', 'path.join(process.cwd(),')
    with open('index.js', 'w') as f:
        f.write(content)
    print("✅ path.join(__dirname) исправлен")
else:
    print("✅ path.join(__dirname) уже исправлен")
PYTHON
        cd ..
    fi
else
    echo "⚠️  tsconfig.json не найден, пропускаем перекомпиляцию"
fi

# 3. Исправление Nginx proxy_pass (убираем завершающий слэш)
echo ""
echo "3️⃣  Исправление Nginx proxy_pass..."
sed -i.bak 's|proxy_pass http://127.0.0.1:3001/;|proxy_pass http://127.0.0.1:3001;|g' /etc/nginx/sites-available/ride-together-api
sed -i.bak 's|proxy_pass http://localhost:3001/;|proxy_pass http://localhost:3001;|g' /etc/nginx/sites-available/ride-together-api
rm -f /etc/nginx/sites-available/ride-together-api.bak
nginx -t && systemctl reload nginx
echo "✅ Nginx обновлен"

# 4. Восстановление frontend файлов (если есть dist на сервере)
echo ""
echo "4️⃣  Восстановление frontend файлов..."
if [ -d "/var/www/ride-together/server/../dist" ]; then
    mkdir -p /var/www/ride-together/frontend-dist
    cp -r /var/www/ride-together/server/../dist/* /var/www/ride-together/frontend-dist/ 2>/dev/null || echo "⚠️  Не удалось скопировать из dist"
    chown -R www-data:www-data /var/www/ride-together/frontend-dist
    chmod -R 755 /var/www/ride-together/frontend-dist
    echo "✅ Frontend файлы восстановлены"
else
    echo "⚠️  dist папка не найдена, frontend файлы не восстановлены"
fi

# 5. Перезапуск PM2
echo ""
echo "5️⃣  Перезапуск PM2..."
pm2 restart ride-backend --update-env
sleep 3

# 6. Проверка
echo ""
echo "6️⃣  Проверка работы..."
echo ""
echo "📋 Статус PM2:"
pm2 status | grep ride-backend || echo "⚠️  PM2 процесс не найден"
echo ""
echo "🏥 Health check:"
curl -s http://localhost:3001/health && echo "" || echo "❌ Сервер не отвечает"
echo ""
echo "📦 API тест:"
curl -s "http://localhost:3001/api/rides?limit=1" | head -c 200 && echo "..." || echo "❌ API не работает"

echo ""
echo "✅ Исправление завершено!"
