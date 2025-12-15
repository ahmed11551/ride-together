#!/bin/bash

# Создание новой БД в Timeweb с нуля (без экспорта из Supabase)
# Использование: ./create-fresh-db-timeweb.sh

set -e

echo "🚀 Создание новой БД в Timeweb Cloud с нуля"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

# Проверка сертификата
if [ ! -f "ca.crt" ]; then
    echo "❌ Сертификат ca.crt не найден"
    exit 1
fi

# Получение пароля
if [ -z "$TIMEWEB_DB_PASSWORD" ]; then
    read -sp "Введите пароль Timeweb Cloud: " TIMEWEB_DB_PASSWORD
    echo ""
    export TIMEWEB_DB_PASSWORD
fi

TIMEWEB_DB_HOST="9d497bc2bf9dd679bd9834af.twc1.net"
TIMEWEB_DB_PORT="5432"
TIMEWEB_DB_NAME="default_db"
TIMEWEB_DB_USER="gen_user"
CERT_FILE="ca.crt"

echo "📋 Применение миграций..."

# Список миграций в порядке применения
MIGRATIONS=(
    "supabase/migrations/20251213021331_7a00ec87-3392-4efa-8263-d4d1fe272d41.sql"
    "supabase/migrations/20251213021356_a5c9a937-87f4-46c5-8704-a93d5b858511.sql"
    "supabase/migrations/20250127000000_add_reports_and_admin.sql"
    "supabase/migrations/20250128000000_add_telegram_fields.sql"
    "supabase/migrations/20250129000000_add_subscriptions.sql"
    "supabase/migrations/20250129000001_add_support_tickets.sql"
    "supabase/migrations/20250130000000_cleanup_old_rides.sql"
    "supabase/migrations/20250130000001_fix_profile_creation_trigger.sql"
    "supabase/migrations/20250130000002_fix_security_and_performance.sql"
    "supabase/migrations/20250131000000_improve_database_stability.sql"
    "supabase/migrations/20250131000001_add_passenger_rating.sql"
    "supabase/migrations/20250131000002_create_auth_tables.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo "Применение: $(basename $migration)"
        
        if PGPASSWORD="$TIMEWEB_DB_PASSWORD" psql \
            -h "$TIMEWEB_DB_HOST" \
            -p "$TIMEWEB_DB_PORT" \
            -U "$TIMEWEB_DB_USER" \
            -d "$TIMEWEB_DB_NAME" \
            --set=sslmode=verify-full \
            --set=sslrootcert="$CERT_FILE" \
            -f "$migration" 2>&1 | grep -v "ERROR" | grep -v "WARNING" || true; then
            echo "✅ $(basename $migration) применена"
        else
            echo "⚠️  Предупреждения при применении $(basename $migration)"
        fi
    else
        echo "⚠️  Файл $migration не найден, пропускаем"
    fi
done

echo ""
echo "✅ Схема БД создана!"
echo ""
echo "📋 Проверка таблиц:"
PGPASSWORD="$TIMEWEB_DB_PASSWORD" psql \
    -h "$TIMEWEB_DB_HOST" \
    -p "$TIMEWEB_DB_PORT" \
    -U "$TIMEWEB_DB_USER" \
    -d "$TIMEWEB_DB_NAME" \
    --set=sslmode=verify-full \
    --set=sslrootcert="$CERT_FILE" \
    -c "\dt" 2>/dev/null || true

echo ""
echo "🎉 Готово! БД создана с нуля."
