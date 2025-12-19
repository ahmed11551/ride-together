#!/bin/bash
# Скрипт деплоя Ride Together на REG.RU VPS

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

# Проверка параметров
if [ -z "$1" ]; then
    log_error "Использование: $0 <user@vps-ip> [путь_к_репозиторию]"
    echo "Пример: $0 root@123.45.67.89"
    exit 1
fi

VPS_HOST=$1
REPO_PATH=${2:-/var/www/ride-together}

log_section "Деплой Ride Together на REG.RU VPS"
log_info "VPS: $VPS_HOST"
log_info "Путь: $REPO_PATH"

# Проверка SSH подключения
log_section "Проверка SSH подключения"
if ssh -o ConnectTimeout=5 "$VPS_HOST" "echo 'OK'" &> /dev/null; then
    log_success "SSH подключение работает"
else
    log_error "Не удается подключиться к $VPS_HOST"
    exit 1
fi

# Проверка наличия необходимых инструментов на VPS
log_section "Проверка окружения на VPS"
ssh "$VPS_HOST" <<'ENDSSH'
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js не установлен"
        exit 1
    fi
    if ! command -v pm2 &> /dev/null; then
        echo "❌ PM2 не установлен"
        exit 1
    fi
    if ! systemctl is-active --quiet postgresql; then
        echo "⚠️  PostgreSQL не запущен"
    fi
    if ! systemctl is-active --quiet nginx; then
        echo "⚠️  Nginx не запущен"
    fi
    echo "✅ Окружение проверено"
ENDSSH

# Деплой Backend
log_section "Деплой Backend"

log_info "Клонирование/обновление репозитория..."
ssh "$VPS_HOST" <<ENDSSH
    if [ -d "$REPO_PATH" ]; then
        cd $REPO_PATH
        git pull || echo "⚠️  Не удалось обновить через git"
    else
        log_error "Репозиторий не найден. Клонируйте вручную: git clone <repo> $REPO_PATH"
        exit 1
    fi
ENDSSH

log_info "Установка зависимостей Backend..."
ssh "$VPS_HOST" "cd $REPO_PATH/server && npm ci --production"

log_info "Проверка .env.production..."
if ssh "$VPS_HOST" "[ -f $REPO_PATH/server/.env.production ]"; then
    log_success ".env.production найден"
else
    log_warning ".env.production не найден"
    log_info "Создайте его на основе server/env.regru.example"
fi

log_info "Сборка Backend..."
ssh "$VPS_HOST" "cd $REPO_PATH/server && npm run build"

log_info "Запуск через PM2..."
ssh "$VPS_HOST" <<'ENDSSH'
    cd /var/www/ride-together/server
    
    # Останавливаем старый процесс если есть
    pm2 delete ride-backend 2>/dev/null || true
    
    # Запускаем новый
    pm2 start dist/index.js --name ride-backend
    pm2 save
    
    # Показываем статус
    pm2 status ride-backend
ENDSSH

log_success "Backend задеплоен"

# Деплой Frontend (опционально, если на VPS)
log_section "Деплой Frontend"

read -p "Развернуть Frontend на VPS? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Установка зависимостей Frontend..."
    ssh "$VPS_HOST" "cd $REPO_PATH && npm ci"
    
    log_info "Проверка .env.production..."
    if ssh "$VPS_HOST" "[ -f $REPO_PATH/.env.production ]"; then
        log_success ".env.production найден"
    else
        log_warning ".env.production не найден"
        log_info "Создайте его на основе env.regru.example"
    fi
    
    log_info "Сборка Frontend..."
    ssh "$VPS_HOST" "cd $REPO_PATH && npm run build"
    
    log_info "Копирование файлов..."
    ssh "$VPS_HOST" "sudo cp -r $REPO_PATH/dist/* /var/www/html/"
    ssh "$VPS_HOST" "sudo chown -R www-data:www-data /var/www/html"
    
    log_success "Frontend задеплоен"
fi

# Перезагрузка Nginx
log_section "Перезагрузка Nginx"
ssh "$VPS_HOST" "sudo nginx -t && sudo systemctl reload nginx" && \
    log_success "Nginx перезагружен" || \
    log_warning "Ошибка перезагрузки Nginx"

# Итоги
log_section "Деплой завершен"
log_success "Приложение развернуто на $VPS_HOST"
echo ""
log_info "Проверьте:"
echo "  - Backend: ssh $VPS_HOST 'pm2 logs ride-backend'"
echo "  - Nginx: ssh $VPS_HOST 'sudo systemctl status nginx'"
echo "  - Health: curl http://$VPS_HOST:3001/health"

