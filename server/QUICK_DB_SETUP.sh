#!/bin/bash
# Упрощенная настройка базы данных на сервере
# Выполнить на сервере: bash QUICK_DB_SETUP.sh

set -e

DB_NAME="ride_together"
DB_USER="ride_user"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo "🗄️  Настройка PostgreSQL"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Password: $DB_PASSWORD"
echo ""

# Установка PostgreSQL
if ! command -v psql &> /dev/null; then
    sudo apt update && sudo apt install postgresql postgresql-contrib -y
fi
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Создание базы
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
sudo -u postgres psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"

# Обновление ecosystem.config.cjs
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
cp ecosystem.config.cjs ecosystem.config.cjs.backup
sed -i "s|DATABASE_URL: '.*'|DATABASE_URL: '${DATABASE_URL}'|" ecosystem.config.cjs

echo "✅ База создана"
echo "DATABASE_URL: $DATABASE_URL"
echo ""
echo "⚠️  Сохраните пароль!"
echo ""
echo "📋 Применить схему? (y/n)"
read -r apply_schema

if [ "$apply_schema" = "y" ]; then
    if [ -f "../TIMEWEB_FULL_SCHEMA.sql" ]; then
        echo "📄 Применяем схему..."
        grep -v -E "^(BEGIN|COMMIT|ROLLBACK);?\$" ../TIMEWEB_FULL_SCHEMA.sql | PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" 2>&1 | grep -v "ERROR:" || true
    fi
fi

pm2 restart ride-backend --update-env
echo "✅ Готово!"

