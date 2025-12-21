#!/bin/bash

# Применение схемы базы данных

set -e

# Проверяем наличие DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL не установлен"
    echo "   Установите: export DATABASE_URL='postgresql://user:pass@localhost:5432/dbname'"
    exit 1
fi

echo "🗄️  Применение схемы базы данных..."
echo "   Database: $DATABASE_URL"
echo ""

# Проверяем подключение
if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ Не удалось подключиться к базе данных"
    echo "   Проверьте DATABASE_URL и права доступа"
    exit 1
fi

echo "✅ Подключение к базе данных успешно"

# Применяем миграции по порядку
if [ -f "migrations/add_notifications_table.sql" ]; then
    echo "📄 Применяем миграцию: add_notifications_table.sql"
    psql "$DATABASE_URL" < migrations/add_notifications_table.sql
fi

if [ -f "migrations/add_saved_searches_table.sql" ]; then
    echo "📄 Применяем миграцию: add_saved_searches_table.sql"
    psql "$DATABASE_URL" < migrations/add_saved_searches_table.sql
fi

if [ -f "migrations/add_location_tables.sql" ]; then
    echo "📄 Применяем миграцию: add_location_tables.sql"
    psql "$DATABASE_URL" < migrations/add_location_tables.sql
fi

echo ""
echo "✅ Миграции применены"

# Показываем список таблиц
echo ""
echo "📋 Таблицы в базе данных:"
psql "$DATABASE_URL" -c "\dt"

echo ""
echo "✅ Готово!"

