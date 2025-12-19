#!/bin/bash
# Скрипт мониторинга инфраструктуры Ride Together

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Функции логирования
log_section() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

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

# Проверка twc
if ! command -v twc &> /dev/null; then
    log_error "twc не установлен"
    exit 1
fi

# Переменные для алертов
ALERTS=0

echo -e "${CYAN}📊 Мониторинг инфраструктуры Ride Together${NC}"
echo "$(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ============================================
# 1. МОНИТОРИНГ БАЗЫ ДАННЫХ
# ============================================
log_section "📊 БАЗА ДАННЫХ"

if [ -n "$TIMEWEB_DB_ID" ]; then
    DB_INFO=$(twc database get "$TIMEWEB_DB_ID" --output json 2>/dev/null || echo "")
    
    if [ -n "$DB_INFO" ]; then
        DB_NAME=$(echo "$DB_INFO" | jq -r '.db.name // "unknown"')
        DB_STATUS=$(echo "$DB_INFO" | jq -r '.db.status // "unknown"')
        DB_TYPE=$(echo "$DB_INFO" | jq -r '.db.type // "unknown"')
        DB_PRESET=$(echo "$DB_INFO" | jq -r '.db.preset_id // "unknown"')
        
        echo "  Название: $DB_NAME"
        echo "  Тип: $DB_TYPE"
        echo "  Preset ID: $DB_PRESET"
        
        if [ "$DB_STATUS" = "running" ]; then
            log_success "Статус: $DB_STATUS"
        else
            log_error "Статус: $DB_STATUS"
            ALERTS=$((ALERTS + 1))
        fi
        
        # Список бэкапов
        BACKUPS=$(twc database backup list "$TIMEWEB_DB_ID" --output json 2>/dev/null | jq -r '.backups | length' || echo "0")
        echo "  Бэкапов: $BACKUPS"
        
    else
        log_warning "Не удалось получить информацию о БД"
        log_info "Установите TIMEWEB_DB_ID или авторизуйтесь: twc auth"
    fi
else
    log_info "TIMEWEB_DB_ID не установлен. Список всех БД:"
    twc database list --output json 2>/dev/null | jq -r '.dbs[]? | "  \(.id) - \(.name) (\(.status))"' || log_warning "Требуется авторизация"
fi

# ============================================
# 2. МОНИТОРИНГ СЕРВЕРОВ
# ============================================
log_section "🖥️  СЕРВЕРЫ"

SERVERS_JSON=$(twc server list --output json 2>/dev/null || echo "")
if [ -n "$SERVERS_JSON" ]; then
    SERVER_COUNT=$(echo "$SERVERS_JSON" | jq -r '.servers | length' || echo "0")
    echo "Всего серверов: $SERVER_COUNT"
    echo ""
    
    echo "$SERVERS_JSON" | jq -r '.servers[]? | "  ID: \(.id)\n  Название: \(.name)\n  Статус: \(.status)\n  IP: \(.ip // "N/A")\n"' | while IFS= read -r line; do
        if [[ $line == *"Статус: running"* ]]; then
            log_success "$line"
        elif [[ $line == *"Статус:"* ]]; then
            log_warning "$line"
            if [[ ! $line == *"running"* ]]; then
                ALERTS=$((ALERTS + 1))
            fi
        else
            echo "  $line"
        fi
    done
else
    log_info "Серверы не найдены или требуется авторизация"
fi

# ============================================
# 3. ФИНАНСОВАЯ ИНФОРМАЦИЯ
# ============================================
log_section "💰 ФИНАНСЫ"

FINANCES=$(twc account finances --output json 2>/dev/null || echo "")
if [ -n "$FINANCES" ]; then
    BALANCE=$(echo "$FINANCES" | jq -r '.finances.balance // "unknown"')
    CURRENCY=$(echo "$FINANCES" | jq -r '.finances.currency // "RUB"')
    
    echo "  Баланс: $BALANCE $CURRENCY"
    
    # Проверка низкого баланса
    if command -v bc &> /dev/null; then
        if (( $(echo "$BALANCE < 100" | bc -l 2>/dev/null || echo 0) )); then
            log_warning "Низкий баланс! Рекомендуется пополнить счёт."
            ALERTS=$((ALERTS + 1))
        elif (( $(echo "$BALANCE < 500" | bc -l 2>/dev/null || echo 0) )); then
            log_warning "Баланс ниже 500 ₽"
        else
            log_success "Баланс достаточен"
        fi
    fi
    
    # Стоимость сервисов
    COSTS=$(twc account services cost --output json 2>/dev/null || echo "")
    if [ -n "$COSTS" ]; then
        TOTAL_COST=$(echo "$COSTS" | jq -r '[.costs[]?.price // 0 | tonumber] | add' || echo "0")
        echo "  Стоимость сервисов: $TOTAL_COST ₽/месяц"
        
        if command -v bc &> /dev/null; then
            if (( $(echo "$TOTAL_COST > 1000" | bc -l 2>/dev/null || echo 0) )); then
                log_warning "Высокая стоимость сервисов!"
                ALERTS=$((ALERTS + 1))
            fi
        fi
    fi
else
    log_warning "Не удалось получить финансовую информацию (требуется авторизация)"
fi

# ============================================
# 4. ПРОЕКТЫ
# ============================================
log_section "📁 ПРОЕКТЫ"

PROJECTS=$(twc project list --output json 2>/dev/null || echo "")
if [ -n "$PROJECTS" ]; then
    PROJECT_COUNT=$(echo "$PROJECTS" | jq -r '.projects | length' || echo "0")
    echo "Всего проектов: $PROJECT_COUNT"
    
    if [ "$PROJECT_COUNT" -gt 0 ]; then
        echo "$PROJECTS" | jq -r '.projects[]? | "  - \(.name) (ID: \(.id))"'
    fi
else
    log_info "Проекты не найдены"
fi

# ============================================
# 5. ИТОГОВАЯ СВОДКА
# ============================================
log_section "📋 СВОДКА"

echo "Время проверки: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

if [ $ALERTS -eq 0 ]; then
    log_success "Все системы работают нормально"
else
    log_warning "Обнаружено предупреждений: $ALERTS"
    echo ""
    log_info "Рекомендуется проверить указанные проблемы"
fi

echo ""
log_info "Для автоматической проверки добавьте в cron:"
echo "  */30 * * * * /path/to/scripts/monitor-infrastructure.sh"

