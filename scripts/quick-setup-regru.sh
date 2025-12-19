#!/bin/bash
# Быстрая первоначальная настройка VPS на REG.RU
# Использование: ./scripts/quick-setup-regru.sh <vps-ip> [ssh-user]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_section() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n${CYAN}$1${NC}\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }

if [ -z "$1" ]; then
    log_error "Использование: $0 <vps-ip> [ssh-user]"
    echo "Пример: $0 194.67.124.123 root"
    exit 1
fi

VPS_IP=$1
SSH_USER=${2:-root}
SSH_HOST="$SSH_USER@$VPS_IP"

log_section "🚀 Быстрая настройка VPS на REG.RU"
log_info "VPS: $VPS_IP"
log_info "Пользователь: $SSH_USER"

# Проверка SSH
log_section "Проверка SSH подключения"
log_info "Попытка подключения к $SSH_HOST..."
log_warning "Если запросит пароль - введите пароль от root (получите в панели REG.RU)"

if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_HOST" "echo 'OK'" 2>/dev/null; then
    log_success "SSH подключение работает"
else
    log_error "Не удается подключиться автоматически"
    log_info "Попробуйте подключиться вручную:"
    echo "  ssh $SSH_HOST"
    echo ""
    log_info "Если нужно, получите пароль в панели REG.RU:"
    echo "  https://cloud.reg.ru/panel/servers"
    echo ""
    read -p "Продолжить после ручного подключения? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Настройка VPS
log_section "Шаг 1: Настройка VPS сервера"
log_info "Установка необходимых пакетов (это займет 2-5 минут)..."

ssh "$SSH_HOST" <<'ENDSSH'
    set -e
    export DEBIAN_FRONTEND=noninteractive
    
    echo "📦 Обновление системы..."
    apt-get update -qq
    apt-get upgrade -y -qq
    
    echo "📦 Установка Node.js 20.x..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
        apt-get install -y nodejs -qq
    fi
    node --version
    npm --version
    
    echo "📦 Установка PostgreSQL..."
    if ! systemctl is-active --quiet postgresql 2>/dev/null; then
        apt-get install -y postgresql postgresql-contrib -qq
        systemctl start postgresql
        systemctl enable postgresql > /dev/null 2>&1
    fi
    
    echo "📦 Установка Nginx..."
    if ! systemctl is-active --quiet nginx 2>/dev/null; then
        apt-get install -y nginx -qq
        systemctl start nginx
        systemctl enable nginx > /dev/null 2>&1
    fi
    
    echo "📦 Установка PM2..."
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2 -q
    fi
    
    echo "📦 Установка Certbot..."
    if ! command -v certbot &> /dev/null; then
        apt-get install -y certbot python3-certbot-nginx -qq
    fi
    
    echo "📦 Настройка Firewall..."
    if command -v ufw &> /dev/null; then
        ufw --force enable > /dev/null 2>&1 || true
        ufw allow 22/tcp > /dev/null 2>&1
        ufw allow 80/tcp > /dev/null 2>&1
        ufw allow 443/tcp > /dev/null 2>&1
    fi
    
    echo "📦 Создание директорий..."
    mkdir -p /var/www/ride-together
    mkdir -p /var/www/html
    chmod -R 755 /var/www
    
    echo "✅ Все пакеты установлены!"
ENDSSH

log_success "VPS настроен"

# Создание базы данных
log_section "Шаг 2: Создание базы данных"
log_info "Создаю базу данных ride_together..."

# Генерация случайного пароля
DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DB_NAME="ride_together"
DB_USER="ride_user"

ssh "$SSH_HOST" <<ENDSSH
    sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
\q
EOF
ENDSSH

log_success "База данных создана"
log_info "База данных: $DB_NAME"
log_info "Пользователь: $DB_USER"
log_info "Пароль: $DB_PASS"
echo ""
log_warning "⚠️  СОХРАНИТЕ ПАРОЛЬ БД: $DB_PASS"

# Сохранение информации о БД и сети
cat > /tmp/regru-db-info.txt <<EOF
Database Information:
====================
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME

Network Information:
====================
PUBLIC_IP=194.67.124.123
PRIVATE_IP=192.168.0.107
PRIVATE_NETWORK=private_network_115049195
SUBNET=subnet_115049195
EOF

log_success "Информация о БД и сети сохранена в /tmp/regru-db-info.txt"

# Итоги
log_section "✅ Первоначальная настройка завершена!"
log_success "Сервер готов к деплою"
echo ""
log_info "Сетевые адреса:"
echo "  Публичный IP: 194.67.124.123"
echo "  Приватный IP: 192.168.0.107 (private_network_115049195)"
echo ""
log_info "Следующие шаги:"
echo "  1. Скопируйте проект на сервер:"
echo "     cd /Users/ahmeddevops/Desktop/ride/ride-together"
echo "     tar -czf ride-together.tar.gz --exclude='node_modules' --exclude='.git' ."
echo "     scp ride-together.tar.gz root@194.67.124.123:/var/www/"
echo ""
echo "  2. Следуйте инструкции:"
echo "     cat NEXT_STEPS.md"
echo ""
log_info "Информация о БД и сети:"
echo "  Файл: /tmp/regru-db-info.txt (на сервере)"
cat /tmp/regru-db-info.txt

