#!/bin/bash
# Проверка и развёртывание frontend на сервере

# Этот скрипт выполняется на СЕРВЕРЕ

echo "🔍 Проверка наличия архива..."
if [ -f "/tmp/frontend-fixed.tar.gz" ]; then
    echo "✅ Архив найден в /tmp/"
    ls -lh /tmp/frontend-fixed.tar.gz
else
    echo "❌ Архив не найден в /tmp/"
    echo "Загрузите файл с вашего Mac:"
    echo "  cd /Users/ahmeddevops/Desktop/ride/ride-together"
    echo "  scp frontend-fixed.tar.gz root@194.67.124.123:/tmp/"
    exit 1
fi

echo ""
echo "📦 Распаковка frontend..."
cd /var/www/ride-together/frontend-dist
rm -rf *
tar -xzf /tmp/frontend-fixed.tar.gz
chown -R www-data:www-data .
chmod -R 755 .

echo ""
echo "✅ Frontend развёрнут! Проверка файлов:"
ls -la *.png *.ico *.html 2>/dev/null | head -10

echo ""
echo "✅ Готово! Проверьте сайт в браузере: https://ridetogether.ru"

