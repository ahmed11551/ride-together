#!/bin/bash

# Скрипт для настройки локальной PostgreSQL базы данных

set -e

echo "🗄️  Настройка локальной PostgreSQL базы данных..."

# Переменные (можно изменить)
DB_NAME="ride_together"
DB_USER="ride_user"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo ""
echo "📋 Параметры базы данных:"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo ""

# Проверяем что PostgreSQL установлен
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL не установлен. Установите:"
    echo "   sudo apt update && sudo apt install postgresql postgresql-contrib -y"
    exit 1
fi

# Проверяем что PostgreSQL запущен
if ! systemctl is-active --quiet postgresql; then
    echo "⚠️  PostgreSQL не запущен. Запускаем..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

echo "✅ PostgreSQL установлен и запущен"

# Переключаемся на пользователя postgres
sudo -u postgres psql << EOF

-- Создаем пользователя (если не существует)
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    RAISE NOTICE 'Пользователь $DB_USER создан';
  ELSE
    RAISE NOTICE 'Пользователь $DB_USER уже существует';
    ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;

-- Создаем базу данных (если не существует)
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Даем права пользователю
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;

\q
EOF

echo "✅ База данных и пользователь созданы"

# Подключаемся к новой базе и создаем расширения
sudo -u postgres psql -d $DB_NAME << EOF
-- Создаем необходимые расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\q
EOF

echo "✅ Расширения созданы"

# Сохраняем DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

echo ""
echo "📝 DATABASE_URL для ecosystem.config.cjs:"
echo "   $DATABASE_URL"
echo ""

# Предлагаем обновить ecosystem.config.cjs
echo "📝 Обновить ecosystem.config.cjs? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    # Обновляем ecosystem.config.cjs
    sed -i "s|DATABASE_URL: '.*'|DATABASE_URL: '${DATABASE_URL}'|" ecosystem.config.cjs
    echo "✅ ecosystem.config.cjs обновлен"
    
    # Перезапускаем PM2 с новыми переменными
    echo ""
    echo "🔄 Перезапускаем PM2 с новыми переменными..."
    pm2 restart ride-backend --update-env
    echo "✅ PM2 перезапущен"
fi

echo ""
echo "📋 Следующие шаги:"
echo "   1. Применить миграции:"
echo "      psql $DATABASE_URL < migrations/..."
echo ""
echo "   2. Или импортировать полную схему если есть"
echo ""
echo "✅ Настройка завершена!"

