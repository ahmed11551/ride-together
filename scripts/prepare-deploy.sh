#!/bin/bash

# Скрипт подготовки к деплою
# Проверяет готовность всех файлов и создает необходимые конфигурации

set -e

echo "🚀 Подготовка к деплою Ride Together"
echo "===================================="
echo ""

# Проверка наличия необходимых файлов
echo "📋 Проверка файлов..."

REQUIRED_FILES=(
  "server/package.json"
  "server/index.ts"
  "server/tsconfig.json"
  "server/env.example"
  "vercel.json"
  "package.json"
  "vite.config.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Отсутствует файл: $file"
    exit 1
  else
    echo "✅ $file"
  fi
done

echo ""
echo "✅ Все необходимые файлы на месте"
echo ""

# Проверка структуры server
echo "📁 Проверка структуры server/..."

REQUIRED_SERVER_FILES=(
  "server/api/auth/signup.ts"
  "server/api/auth/signin.ts"
  "server/api/auth/signout.ts"
  "server/api/auth/me.ts"
  "server/utils/database.ts"
  "server/utils/jwt.ts"
  "server/utils/profile.ts"
  "server/websocket/server.ts"
)

for file in "${REQUIRED_SERVER_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Отсутствует файл: $file"
    exit 1
  else
    echo "✅ $file"
  fi
done

echo ""
echo "✅ Структура server/ корректна"
echo ""

# Проверка наличия ca.crt
if [ ! -f "ca.crt" ]; then
  echo "⚠️  Внимание: файл ca.crt не найден в корне проекта"
  echo "   Убедитесь, что он будет доступен на сервере Timeweb"
else
  echo "✅ ca.crt найден"
fi

echo ""
echo "📝 Создание .env файлов (если не существуют)..."

# Создание server/.env из примера, если не существует
if [ ! -f "server/.env" ]; then
  if [ -f "server/env.example" ]; then
    cp server/env.example server/.env
    echo "✅ Создан server/.env из server/env.example"
    echo "   ⚠️  ВАЖНО: Отредактируйте server/.env и заполните все значения!"
  else
    echo "❌ server/env.example не найден"
    exit 1
  fi
else
  echo "ℹ️  server/.env уже существует"
fi

echo ""
echo "🔍 Проверка зависимостей..."

# Проверка node_modules в server
if [ ! -d "server/node_modules" ]; then
  echo "📦 Установка зависимостей для бэкенда..."
  cd server
  npm install
  cd ..
else
  echo "✅ Зависимости бэкенда установлены"
fi

# Проверка node_modules в корне
if [ ! -d "node_modules" ]; then
  echo "📦 Установка зависимостей для фронтенда..."
  npm install
else
  echo "✅ Зависимости фронтенда установлены"
fi

echo ""
echo "🏗️  Проверка сборки..."

# Тестовая сборка бэкенда
echo "🔨 Тестовая сборка бэкенда..."
cd server
if npm run build > /dev/null 2>&1; then
  echo "✅ Бэкенд собирается успешно"
else
  echo "❌ Ошибка сборки бэкенда"
  echo "   Запустите: cd server && npm run build"
  exit 1
fi
cd ..

# Тестовая сборка фронтенда
echo "🔨 Тестовая сборка фронтенда..."
if npm run build > /dev/null 2>&1; then
  echo "✅ Фронтенд собирается успешно"
else
  echo "❌ Ошибка сборки фронтенда"
  echo "   Запустите: npm run build"
  exit 1
fi

echo ""
echo "===================================="
echo "✅ Подготовка завершена успешно!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Отредактируйте server/.env с данными вашей БД Timeweb"
echo "2. Следуйте инструкциям в КОПИРУЙ_В_TIMEWEB.txt"
echo "3. После деплоя бэкенда следуйте КОПИРУЙ_В_VERCEL.txt"
echo "4. После деплоя Vercel обновите CORS (ОБНОВИ_CORS.txt)"
echo ""
echo "📚 Подробные инструкции: START_HERE_DEPLOY.md"
echo ""
