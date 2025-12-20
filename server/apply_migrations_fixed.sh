#!/bin/bash
# Применение миграций с правильным подключением к PostgreSQL

set -e

DB_USER="ride_user"
DB_NAME="ride_together"
DB_HOST="localhost"
SERVER_DIR="/var/www/ride-together/server"

echo "🗄️  Применение миграций БД..."
echo ""

cd "$SERVER_DIR" || exit 1

# Запрос пароля один раз
echo "Введите пароль для пользователя $DB_USER:"
read -s DB_PASSWORD

export PGPASSWORD="$DB_PASSWORD"

# Миграция 1: Уведомления
echo "Применение миграции: notifications..."
if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/add_notifications_table.sql 2>&1 | grep -q "ERROR\|FATAL"; then
    if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/add_notifications_table.sql 2>&1 | grep -q "already exists"; then
        echo "✅ Таблица notifications уже существует"
    else
        echo "❌ Ошибка при применении миграции notifications"
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/add_notifications_table.sql
    fi
else
    echo "✅ Миграция notifications применена"
fi

# Миграция 2: Сохранённые поиски
echo "Применение миграции: saved_searches..."
if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/add_saved_searches_table.sql 2>&1 | grep -q "ERROR\|FATAL"; then
    if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/add_saved_searches_table.sql 2>&1 | grep -q "already exists"; then
        echo "✅ Таблица saved_searches уже существует"
    else
        echo "❌ Ошибка при применении миграции saved_searches"
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/add_saved_searches_table.sql
    fi
else
    echo "✅ Миграция saved_searches применена"
fi

# Миграция 3: Геолокация
echo "Применение миграции: locations..."
if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/add_location_tables.sql 2>&1 | grep -q "ERROR\|FATAL"; then
    if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/add_location_tables.sql 2>&1 | grep -q "already exists"; then
        echo "✅ Таблицы locations уже существуют"
    else
        echo "❌ Ошибка при применении миграции locations"
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f migrations/add_location_tables.sql
    fi
else
    echo "✅ Миграция locations применена"
fi

unset PGPASSWORD

echo ""
echo "✅ Все миграции применены!"

