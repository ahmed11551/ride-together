#!/bin/bash

# Скрипт для сборки фронтенда с правильными переменными для Timeweb

set -e

echo "🏗️  Сборка фронтенда для Timeweb"
echo "=================================="
echo ""

# Проверка наличия .env
if [ ! -f ".env" ]; then
  echo "⚠️  Файл .env не найден"
  echo "Создаю из примера..."
  cp env.example .env
  echo ""
  echo "❌ ВАЖНО: Отредактируйте .env и укажите:"
  echo "   VITE_API_URL=https://your-backend-url.twc1.net"
  echo "   VITE_WS_URL=wss://your-backend-url.twc1.net"
  echo ""
  read -p "Нажмите Enter после редактирования .env..."
fi

# Проверка переменных
source .env 2>/dev/null || true

if [ -z "$VITE_API_URL" ]; then
  echo "❌ VITE_API_URL не установлен в .env"
  echo "   Установите: VITE_API_URL=https://your-backend-url.twc1.net"
  exit 1
fi

echo "✅ VITE_API_URL: $VITE_API_URL"

if [ -n "$VITE_WS_URL" ]; then
  echo "✅ VITE_WS_URL: $VITE_WS_URL"
else
  echo "ℹ️  VITE_WS_URL не установлен (будет использован VITE_API_URL)"
fi

echo ""
echo "📦 Установка зависимостей..."
npm install

echo ""
echo "🔨 Сборка проекта..."
npm run build

echo ""
echo "✅ Сборка завершена!"
echo ""
echo "📁 Файлы готовы в папке dist/"
echo ""
echo "📤 Следующие шаги:"
echo "1. Загрузите содержимое папки dist/ на Timeweb Static Hosting"
echo "2. Или используйте App Platform с Start Command: npx serve -s dist -l 3000"
echo ""
