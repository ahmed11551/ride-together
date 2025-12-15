#!/bin/bash

# Полная автоматическая миграция из Supabase в Timeweb Cloud
# Использование: ./migrate-to-timeweb.sh

set -e

echo "🚀 Начало полной миграции из Supabase в Timeweb Cloud"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка наличия необходимых инструментов
check_requirements() {
    echo "📋 Проверка требований..."
    
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}❌ psql не установлен${NC}"
        echo "Установите PostgreSQL клиент:"
        echo "  macOS: brew install postgresql"
        echo "  Ubuntu: sudo apt-get install postgresql-client"
        exit 1
    fi
    
    if [ ! -f "../ca.crt" ]; then
        echo -e "${RED}❌ Сертификат ca.crt не найден${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Все требования выполнены${NC}"
    echo ""
}

# Запрос паролей
get_passwords() {
    echo "🔐 Введите пароли для подключения:"
    echo ""
    
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        read -sp "Пароль Supabase: " SUPABASE_DB_PASSWORD
        echo ""
        export SUPABASE_DB_PASSWORD
    else
        echo -e "${GREEN}✅ Пароль Supabase уже установлен${NC}"
    fi
    
    if [ -z "$TIMEWEB_DB_PASSWORD" ]; then
        read -sp "Пароль Timeweb Cloud: " TIMEWEB_DB_PASSWORD
        echo ""
        export TIMEWEB_DB_PASSWORD
    else
        echo -e "${GREEN}✅ Пароль Timeweb уже установлен${NC}"
    fi
    
    echo ""
}

# Экспорт данных из Supabase
export_from_supabase() {
    echo "📤 Шаг 1: Экспорт данных из Supabase..."
    
    SUPABASE_DB_HOST="db.vcjnvkdqjrqymnmqdvfr.supabase.co"
    SUPABASE_DB_PORT="5432"
    SUPABASE_DB_NAME="postgres"
    SUPABASE_DB_USER="postgres"
    
    BACKUP_FILE="supabase_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    echo "Создание backup: $BACKUP_FILE"
    
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
        echo -e "${GREEN}✅ Экспорт завершен: $BACKUP_FILE${NC}"
        echo "Размер: $(du -h "$BACKUP_FILE" | cut -f1)"
        echo "$BACKUP_FILE" > .last_backup_file
    else
        echo -e "${RED}❌ Ошибка при экспорте${NC}"
        exit 1
    fi
    
    echo ""
}

# Импорт данных в Timeweb
import_to_timeweb() {
    echo "📥 Шаг 2: Импорт данных в Timeweb Cloud..."
    
    if [ ! -f .last_backup_file ]; then
        echo -e "${RED}❌ Файл backup не найден${NC}"
        exit 1
    fi
    
    BACKUP_FILE=$(cat .last_backup_file)
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Файл $BACKUP_FILE не найден${NC}"
        exit 1
    fi
    
    TIMEWEB_DB_HOST="9d497bc2bf9dd679bd9834af.twc1.net"
    TIMEWEB_DB_PORT="5432"
    TIMEWEB_DB_NAME="default_db"
    TIMEWEB_DB_USER="gen_user"
    CERT_FILE="../ca.crt"
    
    echo "Импорт из: $BACKUP_FILE"
    echo "Подключение к: $TIMEWEB_DB_HOST:$TIMEWEB_DB_PORT/$TIMEWEB_DB_NAME"
    
    if PGPASSWORD="$TIMEWEB_DB_PASSWORD" psql \
        -h "$TIMEWEB_DB_HOST" \
        -p "$TIMEWEB_DB_PORT" \
        -U "$TIMEWEB_DB_USER" \
        -d "$TIMEWEB_DB_NAME" \
        --set=sslmode=verify-full \
        --set=sslrootcert="$CERT_FILE" \
        < "$BACKUP_FILE" 2>&1; then
        echo -e "${GREEN}✅ Импорт завершен${NC}"
    else
        echo -e "${YELLOW}⚠️  Возможны предупреждения, но импорт может быть успешным${NC}"
        echo "Проверьте подключение вручную"
    fi
    
    echo ""
}

# Применение миграций
apply_migrations() {
    echo "🔄 Шаг 3: Применение миграций..."
    
    TIMEWEB_DB_HOST="9d497bc2bf9dd679bd9834af.twc1.net"
    TIMEWEB_DB_PORT="5432"
    TIMEWEB_DB_NAME="default_db"
    TIMEWEB_DB_USER="gen_user"
    CERT_FILE="../ca.crt"
    
    MIGRATIONS_DIR="../supabase/migrations"
    
    # Список миграций в порядке применения
    MIGRATIONS=(
        "20250131000002_create_auth_tables.sql"
    )
    
    for migration in "${MIGRATIONS[@]}"; do
        MIGRATION_FILE="$MIGRATIONS_DIR/$migration"
        
        if [ -f "$MIGRATION_FILE" ]; then
            echo "Применение: $migration"
            
            if PGPASSWORD="$TIMEWEB_DB_PASSWORD" psql \
                -h "$TIMEWEB_DB_HOST" \
                -p "$TIMEWEB_DB_PORT" \
                -U "$TIMEWEB_DB_USER" \
                -d "$TIMEWEB_DB_NAME" \
                --set=sslmode=verify-full \
                --set=sslrootcert="$CERT_FILE" \
                -f "$MIGRATION_FILE" 2>&1; then
                echo -e "${GREEN}✅ $migration применена${NC}"
            else
                echo -e "${YELLOW}⚠️  Предупреждения при применении $migration${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Файл $migration не найден, пропускаем${NC}"
        fi
    done
    
    echo ""
}

# Проверка подключения
verify_connection() {
    echo "✅ Шаг 4: Проверка подключения..."
    
    TIMEWEB_DB_HOST="9d497bc2bf9dd679bd9834af.twc1.net"
    TIMEWEB_DB_PORT="5432"
    TIMEWEB_DB_NAME="default_db"
    TIMEWEB_DB_USER="gen_user"
    CERT_FILE="../ca.crt"
    
    if PGPASSWORD="$TIMEWEB_DB_PASSWORD" psql \
        -h "$TIMEWEB_DB_HOST" \
        -p "$TIMEWEB_DB_PORT" \
        -U "$TIMEWEB_DB_USER" \
        -d "$TIMEWEB_DB_NAME" \
        --set=sslmode=verify-full \
        --set=sslrootcert="$CERT_FILE" \
        -c "\dt" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Подключение успешно${NC}"
        
        # Показываем список таблиц
        echo ""
        echo "📊 Таблицы в базе данных:"
        PGPASSWORD="$TIMEWEB_DB_PASSWORD" psql \
            -h "$TIMEWEB_DB_HOST" \
            -p "$TIMEWEB_DB_PORT" \
            -U "$TIMEWEB_DB_USER" \
            -d "$TIMEWEB_DB_NAME" \
            --set=sslmode=verify-full \
            --set=sslrootcert="$CERT_FILE" \
            -c "\dt" 2>/dev/null || true
    else
        echo -e "${RED}❌ Ошибка подключения${NC}"
        exit 1
    fi
    
    echo ""
}

# Главная функция
main() {
    check_requirements
    get_passwords
    export_from_supabase
    import_to_timeweb
    apply_migrations
    verify_connection
    
    echo ""
    echo -e "${GREEN}🎉 Миграция завершена успешно!${NC}"
    echo ""
    echo "📋 Следующие шаги:"
    echo "1. Настройте backend сервер (см. server/)"
    echo "2. Обновите Auth систему"
    echo "3. Настройте Realtime"
    echo ""
}

# Запуск
main
