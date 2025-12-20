#!/bin/bash
# Исправление 404 ошибок для API

cd /var/www/ride-together/server

echo "🔧 Исправление API 404 ошибок..."
echo ""

# Проверяем текущую конфигурацию proxy_pass
echo "1️⃣  Проверка proxy_pass в Nginx:"
grep -A 2 "location /api/" /etc/nginx/sites-available/ride-together-api

# Исправляем proxy_pass - убираем завершающий слэш или добавляем правильно
echo ""
echo "2️⃣  Исправление конфигурации..."

# Создаем правильную конфигурацию
sed -i 's|proxy_pass http://127.0.0.1:3001/;|proxy_pass http://127.0.0.1:3001;|g' /etc/nginx/sites-available/ride-together-api
sed -i 's|proxy_pass http://localhost:3001/;|proxy_pass http://127.0.0.1:3001;|g' /etc/nginx/sites-available/ride-together-api

# Проверяем результат
echo "   После исправления:"
grep -A 2 "location /api/" /etc/nginx/sites-available/ride-together-api

# Проверяем конфигурацию
echo ""
echo "3️⃣  Проверка конфигурации:"
if nginx -t; then
  echo "   ✅ Конфигурация правильная"
  systemctl reload nginx
  echo "   ✅ Nginx перезагружен"
else
  echo "   ❌ Ошибка конфигурации"
  exit 1
fi

# Проверка API
echo ""
echo "4️⃣  Проверка API:"
curl -s https://ridetogether.ru/api/health && echo " ✅" || echo " ❌"
curl -s https://ridetogether.ru/api/rides?limit=1 2>&1 | head -1

