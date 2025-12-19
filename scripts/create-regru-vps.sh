#!/bin/bash
# Создание VPS на REG.RU через API и автоматическая настройка

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

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

# Загрузка токена
if [ -f ".env.regru.token" ]; then
    source .env.regru.token
elif [ -z "$REG_RU_API_TOKEN" ]; then
    log_error "Токен не найден"
    exit 1
fi

log_section "🚀 Создание VPS на REG.RU через API"

# Проверка API клиента
if [ ! -f "scripts/regru-api-client.sh" ]; then
    log_error "API клиент не найден"
    exit 1
fi

chmod +x scripts/regru-api-client.sh

# Шаг 1: Проверка авторизации
log_section "Шаг 1: Проверка авторизации"
if ./scripts/regru-api-client.sh check 2>&1 | grep -q "✅\|success\|200"; then
    log_success "Авторизация успешна"
else
    log_warning "Проверьте токен или попробуйте создать VPS вручную"
fi

# Шаг 2: Получение тарифов
log_section "Шаг 2: Получение доступных тарифов"
log_info "Получаю список тарифов..."
TARIFFS=$(./scripts/regru-api-client.sh tariffs 2>/dev/null)

if [ -n "$TARIFFS" ]; then
    echo "$TARIFFS" | head -30
    log_info "Найдите подходящий тариф и запишите его ID"
else
    log_warning "Не удалось получить тарифы через API"
fi

# Шаг 3: Получение образов
log_section "Шаг 3: Получение доступных образов (ОС)"
log_info "Получаю список образов..."
IMAGES=$(./scripts/regru-api-client.sh images 2>/dev/null)

if [ -n "$IMAGES" ]; then
    echo "$IMAGES" | head -30
    log_info "Найдите Ubuntu 22.04 и запишите его ID"
else
    log_warning "Не удалось получить образы через API"
fi

# Шаг 4: Создание сервера
log_section "Шаг 4: Создание VPS"

log_warning "ВНИМАНИЕ: Создание сервера требует оплаты!"
read -p "Продолжить? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    log_info "Отменено"
    exit 0
fi

read -p "Название сервера [ride-backend]: " SERVER_NAME
SERVER_NAME=${SERVER_NAME:-ride-backend}

read -p "ID тарифа: " TARIFF_ID
if [ -z "$TARIFF_ID" ]; then
    log_error "ID тарифа обязателен"
    exit 1
fi

read -p "ID образа (Ubuntu 22.04): " IMAGE_ID
if [ -z "$IMAGE_ID" ]; then
    log_error "ID образа обязателен"
    exit 1
fi

log_info "Создание сервера: $SERVER_NAME (тариф: $TARIFF_ID, образ: $IMAGE_ID)..."

SERVER_RESPONSE=$(./scripts/regru-api-client.sh create-server "$SERVER_NAME" "$TARIFF_ID" "$IMAGE_ID" 2>/dev/null)

if [ -n "$SERVER_RESPONSE" ]; then
    echo "$SERVER_RESPONSE"
    
    # Попытка извлечь IP (если jq доступен)
    if command -v jq &> /dev/null; then
        VPS_IP=$(echo "$SERVER_RESPONSE" | jq -r '.server.ip // .ip // empty' 2>/dev/null)
        SERVER_ID=$(echo "$SERVER_RESPONSE" | jq -r '.server.id // .id // empty' 2>/dev/null)
    fi
    
    if [ -z "$VPS_IP" ]; then
        log_warning "Не удалось получить IP автоматически из ответа API"
        read -p "Введите IP адрес сервера вручную: " VPS_IP
    else
        log_success "Сервер создан!"
        echo "  ID: $SERVER_ID"
        echo "  IP: $VPS_IP"
        echo "  Название: $SERVER_NAME"
    fi
else
    log_error "Ошибка создания сервера"
    log_info "Попробуйте создать VPS вручную через панель REG.RU"
    read -p "Введите IP адрес сервера (если уже создан): " VPS_IP
fi

if [ -z "$VPS_IP" ]; then
    log_error "IP адрес не указан"
    exit 1
fi

# Шаг 5: Ожидание готовности
log_section "Шаг 5: Ожидание готовности сервера"
log_info "Ожидание 60 секунд для инициализации сервера..."
sleep 60

# Проверка доступности
log_info "Проверка доступности сервера..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@"$VPS_IP" "echo 'OK'" &> /dev/null; then
    log_success "Сервер доступен!"
else
    log_warning "Сервер пока недоступен через SSH"
    log_info "Попробуйте подключиться позже"
    read -p "Продолжить настройку? (y/n): " continue_setup
    if [ "$continue_setup" != "y" ]; then
        log_info "Прервано. Запустите позже:"
        echo "  ./scripts/auto-setup-regru.sh $VPS_IP root"
        exit 0
    fi
fi

# Шаг 6: Автоматическая настройка
log_section "Шаг 6: Автоматическая настройка VPS"
log_info "Запуск автоматической настройки..."

if [ -f "scripts/auto-setup-regru.sh" ]; then
    ./scripts/auto-setup-regru.sh "$VPS_IP" root
else
    log_error "Скрипт автоматической настройки не найден"
    exit 1
fi

log_success "Готово! VPS создан и настроен!"

