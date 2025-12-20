#!/bin/bash
# Исправление иконок и пересборка frontend с HTTPS

cd /Users/ahmeddevops/Desktop/ride/ride-together

echo "🔧 Исправление иконок и пересборка frontend..."
echo ""

# 1. Проверка .env.production
if [ -f ".env.production" ]; then
    echo "📋 Текущий .env.production:"
    cat .env.production
else
    echo "⚠️  .env.production не найден, создаём..."
    cat > .env.production << 'EOF'
VITE_API_URL=https://ridetogether.ru
VITE_WS_URL=wss://ridetogether.ru
EOF
fi

echo ""
echo "2️⃣  Проверка что VITE_API_URL правильный:"
grep VITE_API_URL .env.production

echo ""
echo "3️⃣  Пересборка frontend с правильным API URL..."
npm run build

echo ""
echo "4️⃣  Проверка что иконки в dist:"
ls -la dist/*.png dist/*.ico dist/*.svg 2>/dev/null | head -10

echo ""
echo "5️⃣  Создание архива:"
cd dist
tar -czf ../frontend-fixed.tar.gz .
cd ..
ls -lh frontend-fixed.tar.gz

echo ""
echo "✅ Готово! Загрузите frontend-fixed.tar.gz на сервер:"
echo "   scp frontend-fixed.tar.gz root@194.67.124.123:/tmp/"
echo ""
echo "Затем на сервере:"
echo "   cd /var/www/ride-together/frontend-dist"
echo "   rm -rf *"
echo "   tar -xzf /tmp/frontend-fixed.tar.gz"
echo "   chown -R www-data:www-data ."
echo "   chmod -R 755 ."

