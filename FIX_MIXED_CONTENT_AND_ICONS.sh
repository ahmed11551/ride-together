#!/bin/bash
# Исправление Mixed Content и иконок

cd /var/www/ride-together

echo "🔍 Проверка проблем..."
echo ""

# 1. Проверка frontend файлов
echo "1️⃣  Проверка frontend файлов:"
ls -la frontend-dist/ | head -15
echo ""

# 2. Проверка иконок
echo "2️⃣  Проверка иконок:"
ls -la frontend-dist/*.png frontend-dist/*.ico frontend-dist/*.svg 2>/dev/null | head -10

echo ""
echo "3️⃣  Проверка Nginx конфигурации:"
grep -n "listen\|ssl\|http2" /etc/nginx/sites-available/ride-together-api | head -10

echo ""
echo "💡 Решения:"
echo "1. Убедитесь что все ресурсы загружаются по HTTPS"
echo "2. Проверьте что frontend собран с правильным VITE_API_URL=https://ridetogether.ru"
echo "3. Скопируйте недостающие иконки в frontend-dist"

