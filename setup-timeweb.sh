#!/bin/bash

# Автоматическая настройка для Timeweb
# Этот скрипт создаст все необходимые .env файлы

echo "🚀 Настройка для Timeweb..."

# Генерация JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "CHANGE_THIS_TO_YOUR_SECRET_KEY_$(date +%s)")

# Создание server/.env.production
echo "📝 Создание server/.env.production..."
cat > server/.env.production << EOF
# Production Environment Variables для Timeweb
# Автоматически создано скриптом setup-timeweb.sh

# Database Connection
DATABASE_URL=postgresql://gen_user:fn)un5%40K2oLrBJ@9d497bc2bf9dd679bd9834af.twc1.net:5432/default_db?sslmode=verify-full

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
# ВАЖНО: Замените на ваш реальный frontend домен!
ALLOWED_ORIGINS=https://your-frontend-domain.twc1.net
FRONTEND_URL=https://your-frontend-domain.twc1.net

# WebSocket
WS_PORT=3001
EOF

echo "✅ server/.env.production создан"
echo "⚠️  ВАЖНО: Замените 'your-frontend-domain.twc1.net' на ваш реальный домен!"

# Создание .env.production для frontend
echo "📝 Создание .env.production для frontend..."
cat > .env.production << EOF
# Production Environment Variables для Frontend на Timeweb
# Автоматически создано скриптом setup-timeweb.sh

# Backend API
# ВАЖНО: Замените на ваш реальный backend URL!
VITE_API_URL=https://your-backend-domain.twc1.net
VITE_WS_URL=wss://your-backend-domain.twc1.net

# Опциональные API ключи
VITE_YANDEX_MAPS_API_KEY=
VITE_MAPBOX_TOKEN=
VITE_GEOAPIFY_API_KEY=

# Telegram Bot (опционально)
VITE_TELEGRAM_BOT_TOKEN=

# Мониторинг (опционально)
VITE_SENTRY_DSN=
VITE_GA_MEASUREMENT_ID=
EOF

echo "✅ .env.production создан"
echo "⚠️  ВАЖНО: Замените 'your-backend-domain.twc1.net' на ваш реальный backend домен!"

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Отредактируйте server/.env.production - укажите ваш frontend домен"
echo "2. Отредактируйте .env.production - укажите ваш backend домен"
echo "3. Примените SQL схему: скопируйте TIMEWEB_FULL_SCHEMA.sql в SQL Editor Timeweb"
echo "4. Задеплойте backend и frontend на Timeweb"
echo ""
