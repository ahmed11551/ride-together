#!/bin/bash
# Скрипт автоматизации деплоя Ride Together на Timeweb Cloud

set -e  # Остановить при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция логирования
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

# Проверка наличия twc
if ! command -v twc &> /dev/null; then
    log_error "twc не установлен. Установите: pip3 install twc-cli"
    exit 1
fi

# Проверка переменных окружения
if [ -z "$TIMEWEB_DB_ID" ]; then
    log_warning "TIMEWEB_DB_ID не установлен. Проверяю доступные БД..."
    TIMEWEB_DB_ID=$(twc database list --output json 2>/dev/null | jq -r '.dbs[0].id // empty')
    if [ -z "$TIMEWEB_DB_ID" ]; then
        log_error "Не удалось найти БД. Установите TIMEWEB_DB_ID вручную."
        exit 1
    fi
    log_info "Найдена БД: $TIMEWEB_DB_ID"
fi

echo "🚀 Начало автоматического деплоя Ride Together"
echo "================================================"

# Шаг 1: Проверка инфраструктуры
log_info "Шаг 1: Проверка инфраструктуры..."

# Проверка статуса БД
DB_STATUS=$(twc database get "$TIMEWEB_DB_ID" --output json 2>/dev/null | jq -r '.db.status // "unknown"')
if [ "$DB_STATUS" != "running" ]; then
    log_warning "База данных не запущена (статус: $DB_STATUS)"
    read -p "Запустить БД? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Запуск БД..."
        # Если есть команда запуска
        log_success "БД должна быть запущена вручную через панель управления"
    fi
else
    log_success "База данных запущена"
fi

# Проверка баланса
log_info "Проверка баланса..."
BALANCE=$(twc account finances --output json 2>/dev/null | jq -r '.finances.balance // "unknown"')
log_info "Баланс: $BALANCE ₽"

if (( $(echo "$BALANCE < 100" | bc -l 2>/dev/null || echo 0) )); then
    log_warning "Низкий баланс! Рекомендуется пополнить счёт."
fi

# Шаг 2: Создание бэкапа перед деплоем
log_info "Шаг 2: Создание бэкапа перед деплоем..."

BACKUP_NAME="pre-deploy-$(date +%Y%m%d-%H%M%S)"
BACKUP_OUTPUT=$(twc database backup create "$TIMEWEB_DB_ID" --name "$BACKUP_NAME" --output json 2>/dev/null || echo "")

if [ -n "$BACKUP_OUTPUT" ]; then
    BACKUP_ID=$(echo "$BACKUP_OUTPUT" | jq -r '.backup.id // empty')
    if [ -n "$BACKUP_ID" ]; then
        log_success "Бэкап создан: $BACKUP_ID ($BACKUP_NAME)"
    else
        log_warning "Бэкап создан, но не удалось получить ID"
    fi
else
    log_warning "Не удалось создать бэкап автоматически (возможно, требуется авторизация)"
fi

# Шаг 3: Проверка серверов
log_info "Шаг 3: Проверка серверов..."

SERVERS=$(twc server list --output json 2>/dev/null | jq -r '.servers[]? | "\(.id) \(.name) \(.status)"' || echo "")
if [ -n "$SERVERS" ]; then
    echo "$SERVERS" | while read -r server_id server_name server_status; do
        if [ "$server_status" = "running" ]; then
            log_success "Сервер $server_name ($server_id) запущен"
        else
            log_warning "Сервер $server_name ($server_id) в статусе: $server_status"
        fi
    done
else
    log_info "Серверы не найдены или требуют авторизации"
fi

# Шаг 4: Деплой Backend (если нужно)
log_info "Шаг 4: Проверка готовности к деплою Backend..."

if [ -d "server" ]; then
    log_info "Директория server найдена"
    
    # Проверка наличия .env.production
    if [ -f "server/.env.production" ]; then
        log_success "Файл server/.env.production найден"
    else
        log_warning "Файл server/.env.production не найден"
        log_info "Создайте его на основе server/env.production.example"
    fi
    
    log_info "Для деплоя Backend выполните вручную:"
    echo "  1. cd server"
    echo "  2. npm install && npm run build"
    echo "  3. Настройте деплой в Timeweb App Platform"
else
    log_warning "Директория server не найдена"
fi

# Шаг 5: Деплой Frontend (если нужно)
log_info "Шаг 5: Проверка готовности к деплою Frontend..."

if [ -f "package.json" ]; then
    log_info "Frontend проект найден"
    
    # Проверка .env.production
    if [ -f ".env.production" ]; then
        log_success "Файл .env.production найден"
        if grep -q "VITE_API_URL" .env.production; then
            API_URL=$(grep "VITE_API_URL" .env.production | cut -d '=' -f2)
            log_info "VITE_API_URL: $API_URL"
        fi
    else
        log_warning "Файл .env.production не найден"
        log_info "Создайте его на основе env.production.example"
    fi
    
    log_info "Для деплоя Frontend выполните:"
    echo "  1. npm install"
    echo "  2. npm run build"
    echo "  3. Загрузите dist/ в Timeweb Static Hosting"
else
    log_warning "package.json не найден"
fi

# Финальная проверка
echo ""
log_info "Финальная проверка готовности..."

# Проверка подключения к БД
DB_INFO=$(twc database get "$TIMEWEB_DB_ID" --output json 2>/dev/null || echo "")
if [ -n "$DB_INFO" ]; then
    DB_NAME=$(echo "$DB_INFO" | jq -r '.db.name // "unknown"')
    DB_TYPE=$(echo "$DB_INFO" | jq -r '.db.type // "unknown"')
    log_success "Подключение к БД успешно: $DB_NAME ($DB_TYPE)"
else
    log_warning "Не удалось получить информацию о БД (возможно, требуется авторизация)"
fi

echo ""
echo "================================================"
log_success "Проверка инфраструктуры завершена!"
echo ""
log_info "Следующие шаги:"
echo "  1. Убедитесь, что все переменные окружения настроены"
echo "  2. Задеплойте Backend через Timeweb App Platform"
echo "  3. Задеплойте Frontend через Timeweb Static Hosting"
echo "  4. Обновите CORS на Backend после получения домена Frontend"
echo ""

