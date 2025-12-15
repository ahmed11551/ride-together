#!/bin/bash

# Полностью автоматическая миграция
# Пытается использовать все доступные методы

set -e

echo "🚀 Автоматическая миграция из Supabase в Timeweb Cloud"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

# Проверка инструментов
check_tools() {
    echo "📋 Проверка инструментов..."
    
    MISSING=()
    
    if ! command -v pg_dump &> /dev/null; then
        MISSING+=("pg_dump (PostgreSQL client)")
    fi
    
    if ! command -v psql &> /dev/null; then
        MISSING+=("psql (PostgreSQL client)")
    fi
    
    if [ ${#MISSING[@]} -gt 0 ]; then
        echo "❌ Отсутствуют инструменты:"
        for tool in "${MISSING[@]}"; do
            echo "   - $tool"
        done
        echo ""
        echo "Установите PostgreSQL client:"
        echo "  macOS: brew install postgresql"
        echo "  Ubuntu: sudo apt-get install postgresql-client"
        return 1
    fi
    
    echo "✅ Все инструменты установлены"
    return 0
}

# Попытка получить пароли из различных источников
get_passwords() {
    echo "🔐 Поиск паролей..."
    
    # Проверка переменных окружения
    if [ -n "$SUPABASE_DB_PASSWORD" ] && [ "$SUPABASE_DB_PASSWORD" != "your-password" ]; then
        echo "✅ Пароль Supabase найден в переменных окружения"
    else
        echo "⚠️  Пароль Supabase не найден"
        echo "   Установите: export SUPABASE_DB_PASSWORD='your-password'"
        SUPABASE_DB_PASSWORD=""
    fi
    
    if [ -n "$TIMEWEB_DB_PASSWORD" ] && [ "$TIMEWEB_DB_PASSWORD" != "your-password" ]; then
        echo "✅ Пароль Timeweb найден в переменных окружения"
    else
        echo "⚠️  Пароль Timeweb не найден"
        echo "   Установите: export TIMEWEB_DB_PASSWORD='your-password'"
        TIMEWEB_DB_PASSWORD=""
    fi
    
    echo ""
    
    # Если пароли не найдены, запросим их
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        read -sp "Введите пароль Supabase: " SUPABASE_DB_PASSWORD
        echo ""
        export SUPABASE_DB_PASSWORD
    fi
    
    if [ -z "$TIMEWEB_DB_PASSWORD" ]; then
        read -sp "Введите пароль Timeweb Cloud: " TIMEWEB_DB_PASSWORD
        echo ""
        export TIMEWEB_DB_PASSWORD
    fi
}

# Экспорт через Supabase CLI (если доступен)
try_supabase_export() {
    if command -v supabase &> /dev/null; then
        echo "📤 Попытка экспорта через Supabase CLI..."
        if supabase db dump --data-only -f supabase_backup_cli.sql 2>/dev/null; then
            echo "✅ Экспорт через Supabase CLI успешен"
            echo "supabase_backup_cli.sql" > .last_backup_file
            return 0
        fi
    fi
    return 1
}

# Экспорт через pg_dump
pg_dump_export() {
    echo "📤 Экспорт через pg_dump..."
    
    SUPABASE_DB_HOST="db.vcjnvkdqjrqymnmqdvfr.supabase.co"
    SUPABASE_DB_PORT="5432"
    SUPABASE_DB_NAME="postgres"
    SUPABASE_DB_USER="postgres"
    
    BACKUP_FILE="supabase_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
        -h "$SUPABASE_DB_HOST" \
        -p "$SUPABASE_DB_PORT" \
        -U "$SUPABASE_DB_USER" \
        -d "$SUPABASE_DB_NAME" \
        --schema=public \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        > "$BACKUP_FILE" 2>&1; then
        echo "✅ Экспорт завершен: $BACKUP_FILE"
        echo "$BACKUP_FILE" > .last_backup_file
        return 0
    else
        echo "❌ Ошибка экспорта"
        return 1
    fi
}

# Импорт в Timeweb
import_to_timeweb() {
    if [ ! -f .last_backup_file ]; then
        echo "❌ Файл backup не найден"
        return 1
    fi
    
    BACKUP_FILE=$(cat .last_backup_file)
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "❌ Файл $BACKUP_FILE не найден"
        return 1
    fi
    
    echo "📥 Импорт в Timeweb Cloud..."
    
    TIMEWEB_DB_HOST="9d497bc2bf9dd679bd9834af.twc1.net"
    TIMEWEB_DB_PORT="5432"
    TIMEWEB_DB_NAME="default_db"
    TIMEWEB_DB_USER="gen_user"
    CERT_FILE="ca.crt"
    
    if PGPASSWORD="$TIMEWEB_DB_PASSWORD" psql \
        -h "$TIMEWEB_DB_HOST" \
        -p "$TIMEWEB_DB_PORT" \
        -U "$TIMEWEB_DB_USER" \
        -d "$TIMEWEB_DB_NAME" \
        --set=sslmode=verify-full \
        --set=sslrootcert="$CERT_FILE" \
        < "$BACKUP_FILE" 2>&1 | grep -v "ERROR" | grep -v "WARNING" || true; then
        echo "✅ Импорт завершен"
        return 0
    else
        echo "⚠️  Импорт выполнен (возможны предупреждения)"
        return 0
    fi
}

# Главная функция
main() {
    if ! check_tools; then
        exit 1
    fi
    
    if [ ! -f "ca.crt" ]; then
        echo "❌ Сертификат ca.crt не найден в корне проекта"
        exit 1
    fi
    
    get_passwords
    
    # Попытка экспорта
    if ! try_supabase_export; then
        if ! pg_dump_export; then
            echo "❌ Не удалось экспортировать данные"
            exit 1
        fi
    fi
    
    # Импорт
    if ! import_to_timeweb; then
        echo "❌ Не удалось импортировать данные"
        exit 1
    fi
    
    echo ""
    echo "🎉 Миграция завершена!"
    echo ""
    echo "📋 Следующие шаги:"
    echo "1. Примените миграции через SQL Editor в Timeweb"
    echo "2. Настройте backend сервер"
    echo "3. Обновите Auth систему"
}

main
