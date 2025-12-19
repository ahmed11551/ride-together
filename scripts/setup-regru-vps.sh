#!/bin/bash
# Скрипт автоматической настройки VPS на REG.RU для Ride Together

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

# Проверка, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then
    log_error "Запустите скрипт от root: sudo $0"
    exit 1
fi

log_section "Настройка VPS на REG.RU для Ride Together"

# Шаг 1: Обновление системы
log_section "Шаг 1: Обновление системы"
log_info "Обновление пакетов..."
apt update && apt upgrade -y
log_success "Система обновлена"

# Шаг 2: Установка Node.js
log_section "Шаг 2: Установка Node.js"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_info "Node.js уже установлен: $NODE_VERSION"
else
    log_info "Установка Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    log_success "Node.js установлен: $(node --version)"
fi

# Шаг 3: Установка PostgreSQL
log_section "Шаг 3: Установка PostgreSQL"
if systemctl is-active --quiet postgresql; then
    log_info "PostgreSQL уже установлен и запущен"
else
    log_info "Установка PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    log_success "PostgreSQL установлен и запущен"
fi

# Шаг 4: Установка Nginx
log_section "Шаг 4: Установка Nginx"
if systemctl is-active --quiet nginx; then
    log_info "Nginx уже установлен и запущен"
else
    log_info "Установка Nginx..."
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    log_success "Nginx установлен и запущен"
fi

# Шаг 5: Установка PM2
log_section "Шаг 5: Установка PM2"
if command -v pm2 &> /dev/null; then
    log_info "PM2 уже установлен"
else
    log_info "Установка PM2..."
    npm install -g pm2
    log_success "PM2 установлен"
fi

# Шаг 6: Настройка Firewall
log_section "Шаг 6: Настройка Firewall"
if command -v ufw &> /dev/null; then
    log_info "Настройка UFW..."
    ufw --force enable
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    log_success "Firewall настроен"
else
    log_warning "UFW не установлен. Установите: apt install ufw"
fi

# Шаг 7: Создание пользователя для приложения
log_section "Шаг 7: Создание пользователя"
read -p "Создать пользователя ride? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if id "ride" &>/dev/null; then
        log_info "Пользователь ride уже существует"
    else
        useradd -m -s /bin/bash ride
        log_success "Пользователь ride создан"
    fi
fi

# Шаг 8: Создание директорий
log_section "Шаг 8: Создание директорий"
mkdir -p /var/www/ride-together
mkdir -p /var/www/html
log_success "Директории созданы"

# Шаг 9: Настройка PostgreSQL базы данных
log_section "Шаг 9: Настройка PostgreSQL"
read -p "Создать базу данных? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Имя базы данных [ride_together]: " DB_NAME
    DB_NAME=${DB_NAME:-ride_together}
    
    read -p "Имя пользователя БД [ride_user]: " DB_USER
    DB_USER=${DB_USER:-ride_user}
    
    read -sp "Пароль пользователя БД: " DB_PASS
    echo
    
    sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
EOF
    
    log_success "База данных $DB_NAME создана"
    log_info "DATABASE_URL: postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
fi

# Шаг 10: Установка Certbot (для SSL)
log_section "Шаг 10: Установка Certbot"
read -p "Установить Certbot для SSL? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    apt install -y certbot python3-certbot-nginx
    log_success "Certbot установлен"
    log_info "Для получения сертификата: certbot --nginx -d your-domain.ru"
fi

# Итоги
log_section "Итоги настройки"
log_success "Настройка VPS завершена!"
echo ""
log_info "Установлено:"
echo "  - Node.js $(node --version)"
echo "  - PostgreSQL $(psql --version | head -n1)"
echo "  - Nginx $(nginx -v 2>&1)"
echo "  - PM2 $(pm2 --version)"
echo ""
log_info "Следующие шаги:"
echo "  1. Клонируйте репозиторий: git clone <repo> /var/www/ride-together"
echo "  2. Установите зависимости: cd /var/www/ride-together/server && npm install"
echo "  3. Настройте .env.production"
echo "  4. Соберите проект: npm run build"
echo "  5. Запустите: pm2 start dist/index.js --name ride-backend"
echo "  6. Настройте Nginx конфигурацию"
echo "  7. Получите SSL сертификат: certbot --nginx -d your-domain.ru"

