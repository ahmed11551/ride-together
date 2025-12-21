#!/bin/bash

# Полная настройка локальной базы данных

set -e

echo "🗄️  Настройка локальной PostgreSQL базы данных"
echo ""

# Параметры
DB_NAME="ride_together"
DB_USER="ride_user"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo "📋 Параметры:"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo ""

# Проверка PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL не установлен. Устанавливаем..."
    sudo apt update
    sudo apt install postgresql postgresql-contrib -y
fi

# Запуск PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    echo "🔄 Запускаем PostgreSQL..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

echo "✅ PostgreSQL готов"

# Создание пользователя и базы
echo ""
echo "📝 Создаем пользователя и базу данных..."

sudo -u postgres psql << SQL
-- Создаем пользователя
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  ELSE
    ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;

-- Создаем базу
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL

echo "✅ База данных создана"

# Создание расширений
echo ""
echo "📝 Создаем расширения..."

sudo -u postgres psql -d $DB_NAME << SQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
SQL

echo "✅ Расширения созданы"

# DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

echo ""
echo "📝 Обновляем ecosystem.config.cjs..."

# Бэкап
cp ecosystem.config.cjs ecosystem.config.cjs.backup

# Обновляем DATABASE_URL
sed -i "s|DATABASE_URL: '.*'|DATABASE_URL: '${DATABASE_URL}'|" ecosystem.config.cjs

echo "✅ ecosystem.config.cjs обновлен (бэкап: ecosystem.config.cjs.backup)"

echo ""
echo "📋 DATABASE_URL:"
echo "   $DATABASE_URL"
echo ""
echo "⚠️  Сохраните этот пароль в безопасном месте!"
echo ""

# Спрашиваем про схему
echo "📋 Применить схему базы данных?"
echo "   1) Да, из TIMEWEB_FULL_SCHEMA.sql (если есть)"
echo "   2) Да, из миграций"
echo "   3) Нет, применю позже"
read -p "Выберите (1/2/3): " choice

case $choice in
    1)
        if [ -f "../TIMEWEB_FULL_SCHEMA.sql" ]; then
            echo "📄 Применяем полную схему..."
            PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -f ../TIMEWEB_FULL_SCHEMA.sql
            echo "✅ Схема применена"
        else
            echo "❌ Файл TIMEWEB_FULL_SCHEMA.sql не найден"
        fi
        ;;
    2)
        echo "📄 Применяем миграции..."
        for migration in migrations/*.sql; do
            if [ -f "$migration" ]; then
                echo "   Применяем: $(basename $migration)"
                PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -f "$migration"
            fi
        done
        echo "✅ Миграции применены"
        ;;
    3)
        echo "⏭️  Пропускаем применение схемы"
        ;;
esac

echo ""
echo "🔄 Перезапускаем PM2 с новыми переменными..."
pm2 restart ride-backend --update-env

echo ""
echo "⏳ Ждём 3 секунды..."
sleep 3

echo ""
echo "📋 Проверяем логи..."
pm2 logs ride-backend --lines 15 --nostream

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📋 Параметры подключения:"
echo "   DATABASE_URL: $DATABASE_URL"
echo "   (Сохраните пароль в безопасном месте!)"

