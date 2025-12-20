#!/bin/bash
# Восстановление фронтенда на сервере

cd /var/www/ride-together

echo "🔧 Восстановление фронтенда..."

# Если есть server/dist с фронтендом - копируем оттуда
if [ -d "server/dist" ] && [ -f "server/dist/index.html" ]; then
  echo "📋 Копирую из server/dist..."
  cd frontend-dist
  rm -rf *
  cp -r ../server/dist/* .
  chown -R www-data:www-data .
  chmod -R 755 .
  echo "✅ Фронтенд скопирован из server/dist"
  ls -la index.html
  exit 0
fi

# Если есть старый фронтенд где-то еще
if [ -d "frontend" ] && [ -f "frontend/dist/index.html" ]; then
  echo "📋 Копирую из frontend/dist..."
  cd frontend-dist
  rm -rf *
  cp -r ../frontend/dist/* .
  chown -R www-data:www-data .
  chmod -R 755 .
  echo "✅ Фронтенд скопирован"
  exit 0
fi

echo "❌ Не найдено исходных файлов фронтенда"
echo ""
echo "📋 Доступные директории:"
ls -la /var/www/ride-together/
echo ""
echo "💡 Решение: Загрузите frontend.tar.gz через SCP или веб-консоль"

