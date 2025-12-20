#!/bin/bash
# Сборка и загрузка frontend на сервер

set -e

cd /Users/ahmeddevops/Desktop/ride/ride-together

echo "🔨 Сборка frontend..."
echo ""

# 1. Проверка что есть dist или нужно собрать
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    echo "📦 Сборка frontend..."
    
    # Проверка .env.production
    if [ ! -f ".env.production" ]; then
        echo "⚠️  Создаю .env.production..."
        cat > .env.production << 'EOF'
VITE_API_URL=https://ridetogether.ru
VITE_WS_URL=wss://ridetogether.ru
EOF
    fi
    
    npm run build
fi

if [ ! -d "dist" ]; then
    echo "❌ Папка dist не найдена!"
    exit 1
fi

echo "✅ Frontend собран"
echo ""

# 2. Создание архива
echo "📦 Создание архива..."
cd dist
tar -czf ../frontend.tar.gz .
cd ..
ls -lh frontend.tar.gz

echo ""
echo "✅ Архив создан: frontend.tar.gz"
echo ""
echo "📤 Загрузите файл на сервер:"
echo "   scp frontend.tar.gz root@194.67.124.123:/tmp/"
echo ""
echo "📋 Затем на сервере выполните:"
echo "   cd /var/www/ride-together/frontend-dist"
echo "   rm -rf *"
echo "   tar -xzf /tmp/frontend.tar.gz"
echo "   chown -R www-data:www-data ."
echo "   chmod -R 755 ."

