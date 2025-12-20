#!/bin/bash
# Быстрое создание иконок и пересборка frontend

cd /Users/ahmeddevops/Desktop/ride/ride-together

echo "🔧 Создание иконок и пересборка frontend..."
echo ""

# Проверяем есть ли ImageMagick или другие инструменты для создания иконок
if command -v convert &> /dev/null; then
    echo "Создаём иконки из favicon.svg используя ImageMagick..."
    convert public/favicon.svg -resize 192x192 public/icon-192.png 2>/dev/null || echo "Не удалось создать icon-192.png"
    convert public/favicon.svg -resize 512x512 public/icon-512.png 2>/dev/null || echo "Не удалось создать icon-512.png"
elif [ -f "public/favicon.ico" ]; then
    echo "⚠️  ImageMagick не установлен, копируем favicon.ico как временное решение..."
    cp public/favicon.ico public/icon-192.png 2>/dev/null || true
    cp public/favicon.ico public/icon-512.png 2>/dev/null || true
    echo "✅ Иконки скопированы (временно, используйте favicon.io для создания правильных иконок)"
else
    echo "⚠️  Не удалось создать иконки автоматически"
    echo "Создайте их вручную на https://favicon.io/favicon-generator/"
fi

echo ""
echo "📦 Пересборка frontend..."
npm run build

echo ""
echo "✅ Frontend пересобран! Проверьте dist/ на наличие иконок:"
ls -la dist/*.png dist/*.ico 2>/dev/null | head -5

echo ""
echo "📤 Создание архива:"
cd dist
tar -czf ../frontend-fixed.tar.gz .
cd ..
ls -lh frontend-fixed.tar.gz

echo ""
echo "✅ Готово! Загрузите на сервер:"
echo "   scp frontend-fixed.tar.gz root@194.67.124.123:/tmp/"
echo ""
echo "Затем на сервере выполните команды из QUICK_DEPLOY_FRONTEND.md"

