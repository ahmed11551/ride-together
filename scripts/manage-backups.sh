#!/bin/bash
# Скрипт управления бэкапами базы данных Ride Together

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Функции
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_section() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Проверка twc
if ! command -v twc &> /dev/null; then
    log_error "twc не установлен"
    exit 1
fi

# Проверка jq (для парсинга JSON)
if ! command -v jq &> /dev/null; then
    log_warning "jq не установлен. Установите: brew install jq"
    log_info "Скрипт будет работать, но с ограниченной функциональностью"
fi

# Меню
show_menu() {
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  Управление бэкапами Ride Together    ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "1. Создать бэкап"
    echo "2. Список бэкапов"
    echo "3. Информация о бэкапе"
    echo "4. Удалить старые бэкапы (старше N дней)"
    echo "5. Автоматический бэкап (с уведомлением)"
    echo "6. Выход"
    echo ""
}

# Функция создания бэкапа
create_backup() {
    if [ -z "$TIMEWEB_DB_ID" ]; then
        log_error "TIMEWEB_DB_ID не установлен"
        log_info "Доступные БД:"
        twc database list --output json 2>/dev/null | jq -r '.dbs[]? | "  \(.id) - \(.name)"' || echo "Требуется авторизация"
        read -p "Введите ID БД: " DB_ID
        TIMEWEB_DB_ID=$DB_ID
    fi
    
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    log_info "Создание бэкапа: $BACKUP_NAME"
    
    BACKUP_OUTPUT=$(twc database backup create "$TIMEWEB_DB_ID" --name "$BACKUP_NAME" --output json 2>/dev/null || echo "")
    
    if [ -n "$BACKUP_OUTPUT" ] && command -v jq &> /dev/null; then
        BACKUP_ID=$(echo "$BACKUP_OUTPUT" | jq -r '.backup.id // empty')
        if [ -n "$BACKUP_ID" ]; then
            log_success "Бэкап создан успешно!"
            echo "  ID: $BACKUP_ID"
            echo "  Имя: $BACKUP_NAME"
            echo "  БД: $TIMEWEB_DB_ID"
        else
            log_warning "Бэкап создан, но не удалось получить ID"
        fi
    else
        log_info "Бэкап создан: $BACKUP_NAME"
    fi
}

# Функция списка бэкапов
list_backups() {
    if [ -z "$TIMEWEB_DB_ID" ]; then
        log_error "TIMEWEB_DB_ID не установлен"
        return 1
    fi
    
    log_section "Список бэкапов для БД: $TIMEWEB_DB_ID"
    
    BACKUPS_JSON=$(twc database backup list "$TIMEWEB_DB_ID" --output json 2>/dev/null || echo "")
    
    if [ -n "$BACKUPS_JSON" ] && command -v jq &> /dev/null; then
        BACKUP_COUNT=$(echo "$BACKUPS_JSON" | jq -r '.backups | length' || echo "0")
        echo "Всего бэкапов: $BACKUP_COUNT"
        echo ""
        
        echo "$BACKUPS_JSON" | jq -r '.backups[]? | "ID: \(.id)\nИмя: \(.name // "unnamed")\nРазмер: \(.size // "unknown")\nСоздан: \(.created_at // "unknown")\n"' | \
        while IFS= read -r line; do
            if [[ $line == "ID:"* ]]; then
                echo -e "${CYAN}$line${NC}"
            else
                echo "  $line"
            fi
        done
    else
        twc database backup list "$TIMEWEB_DB_ID" 2>/dev/null || log_error "Не удалось получить список бэкапов"
    fi
}

# Функция удаления старых бэкапов
delete_old_backups() {
    if [ -z "$TIMEWEB_DB_ID" ]; then
        log_error "TIMEWEB_DB_ID не установлен"
        return 1
    fi
    
    read -p "Удалить бэкапы старше (дней): " DAYS
    
    if ! [[ "$DAYS" =~ ^[0-9]+$ ]]; then
        log_error "Некорректное количество дней"
        return 1
    fi
    
    log_warning "ВНИМАНИЕ: Будут удалены все бэкапы старше $DAYS дней!"
    read -p "Продолжить? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        log_info "Операция отменена"
        return 0
    fi
    
    # Получаем список бэкапов и фильтруем по дате
    BACKUPS_JSON=$(twc database backup list "$TIMEWEB_DB_ID" --output json 2>/dev/null || echo "")
    
    if [ -n "$BACKUPS_JSON" ] && command -v jq &> /dev/null && command -v date &> /dev/null; then
        CUTOFF_DATE=$(date -u -v-${DAYS}d +%s 2>/dev/null || date -d "-$DAYS days" +%s 2>/dev/null || echo "")
        
        if [ -n "$CUTOFF_DATE" ]; then
            echo "$BACKUPS_JSON" | jq -r ".backups[]? | select(.created_at != null) | select((.created_at | fromdateiso8601) < $CUTOFF_DATE) | .id" | \
            while read -r backup_id; do
                log_info "Удаление бэкапа: $backup_id"
                twc database backup remove "$TIMEWEB_DB_ID" "$backup_id" 2>/dev/null && \
                    log_success "Удалён: $backup_id" || \
                    log_error "Ошибка удаления: $backup_id"
            done
        else
            log_error "Не удалось вычислить дату отсечения"
        fi
    else
        log_warning "Автоматическое удаление требует jq. Удаляйте бэкапы вручную через панель управления."
    fi
}

# Функция автоматического бэкапа
auto_backup() {
    if [ -z "$TIMEWEB_DB_ID" ]; then
        log_error "TIMEWEB_DB_ID не установлен"
        return 1
    fi
    
    BACKUP_NAME="auto-backup-$(date +%Y%m%d-%H%M%S)"
    log_info "Создание автоматического бэкапа: $BACKUP_NAME"
    
    BACKUP_OUTPUT=$(twc database backup create "$TIMEWEB_DB_ID" --name "$BACKUP_NAME" --output json 2>/dev/null || echo "")
    
    if [ -n "$BACKUP_OUTPUT" ] && command -v jq &> /dev/null; then
        BACKUP_ID=$(echo "$BACKUP_OUTPUT" | jq -r '.backup.id // empty')
        if [ -n "$BACKUP_ID" ]; then
            log_success "Автоматический бэкап создан!"
            echo "  ID: $BACKUP_ID"
            echo "  Имя: $BACKUP_NAME"
            echo "  Время: $(date '+%Y-%m-%d %H:%M:%S')"
            
            # Здесь можно добавить отправку уведомления
            # Например, через email, Telegram, Slack и т.д.
            
        else
            log_warning "Бэкап создан, но не удалось получить ID"
        fi
    else
        log_info "Автоматический бэкап создан: $BACKUP_NAME"
    fi
}

# Главный цикл
if [ "$1" = "--auto" ]; then
    # Автоматический режим (для cron)
    auto_backup
elif [ "$1" = "--list" ]; then
    # Быстрый список
    list_backups
elif [ "$1" = "--create" ]; then
    # Быстрое создание
    create_backup
else
    # Интерактивный режим
    while true; do
        show_menu
        read -p "Выберите действие: " choice
        
        case $choice in
            1)
                create_backup
                ;;
            2)
                list_backups
                ;;
            3)
                if [ -z "$TIMEWEB_DB_ID" ]; then
                    log_error "TIMEWEB_DB_ID не установлен"
                else
                    read -p "Введите ID бэкапа: " BACKUP_ID
                    twc database backup get "$TIMEWEB_DB_ID" "$BACKUP_ID" 2>/dev/null || log_error "Бэкап не найден"
                fi
                ;;
            4)
                delete_old_backups
                ;;
            5)
                auto_backup
                ;;
            6)
                log_info "Выход..."
                exit 0
                ;;
            *)
                log_error "Неверный выбор"
                ;;
        esac
        
        echo ""
        read -p "Нажмите Enter для продолжения..."
    fi
fi

