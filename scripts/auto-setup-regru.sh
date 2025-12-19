#!/bin/bash
# Автоматическая настройка Ride Together на REG.RU после создания ресурсов
# Требуется: VPS уже создан, база данных настроена

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
    log_error "Использование: $0 <vps-ip> [ssh-user]"
    echo "Пример: $0 123.45.67.89 root"
    echo ""
    echo "Перед запуском убедитесь:"
    echo "  1. VPS создан на REG.RU"
    echo "  2. База данных создана (или будет создана скриптом)"
    echo "  3. У вас есть SSH доступ к VPS"
    exit 1
fi

VPS_IP=$1
SSH_USER=${2:-root}
SSH_HOST="$SSH_USER@$VPS_IP"

log_section "🚀 Автоматическая настройка Ride Together на REG.RU"
log_info "VPS: $VPS_IP"
log_info "Пользователь: $SSH_USER"

# Проверка SSH
log_section "Проверка SSH подключения"
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$SSH_HOST" "echo 'OK'" &> /dev/null; then
    log_success "SSH подключение работает"
else
    log_error "Не удается подключиться к $SSH_HOST"
    log_info "Проверьте:"
    echo "  - IP адрес правильный"
    echo "  - SSH ключ добавлен или пароль известен"
    echo "  - Firewall разрешает SSH (порт 22)"
    exit 1
fi

# Шаг 1: Настройка VPS
log_section "Шаг 1: Настройка VPS сервера"
log_info "Установка необходимых пакетов..."

ssh "$SSH_HOST" <<'ENDSSH'
    set -e
    
    # Обновление системы
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get upgrade -y -qq
    
    # Установка Node.js 20.x
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
        apt-get install -y nodejs -qq
    fi
    echo "✅ Node.js $(node --version)"
    
    # Установка PostgreSQL
    if ! systemctl is-active --quiet postgresql 2>/dev/null; then
        apt-get install -y postgresql postgresql-contrib -qq
        systemctl start postgresql
        systemctl enable postgresql > /dev/null 2>&1
    fi
    echo "✅ PostgreSQL установлен"
    
    # Установка Nginx
    if ! systemctl is-active --quiet nginx 2>/dev/null; then
        apt-get install -y nginx -qq
        systemctl start nginx
        systemctl enable nginx > /dev/null 2>&1
    fi
    echo "✅ Nginx установлен"
    
    # Установка PM2
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2 -q
    fi
    echo "✅ PM2 установлен"
    
    # Установка Certbot
    if ! command -v certbot &> /dev/null; then
        apt-get install -y certbot python3-certbot-nginx -qq
    fi
    echo "✅ Certbot установлен"
    
    # Настройка Firewall
    if command -v ufw &> /dev/null; then
        ufw --force enable > /dev/null 2>&1 || true
        ufw allow 22/tcp > /dev/null 2>&1
        ufw allow 80/tcp > /dev/null 2>&1
        ufw allow 443/tcp > /dev/null 2>&1
    fi
    echo "✅ Firewall настроен"
    
    # Создание директорий
    mkdir -p /var/www/ride-together
    mkdir -p /var/www/html
    echo "✅ Директории созданы"
ENDSSH

log_success "VPS настроен"

# Шаг 2: Создание базы данных
log_section "Шаг 2: Настройка базы данных"
read -p "Создать базу данных автоматически? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Имя БД [ride_together]: " DB_NAME
    DB_NAME=${DB_NAME:-ride_together}
    
    read -p "Пользователь БД [ride_user]: " DB_USER
    DB_USER=${DB_USER:-ride_user}
    
    read -sp "Пароль БД: " DB_PASS
    echo
    
    ssh "$SSH_HOST" <<ENDSSH
        sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
EOF
ENDSSH
    
    log_success "База данных создана: $DB_NAME"
    DB_CONNECTION_STRING="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
else
    read -p "Введите строку подключения к БД: " DB_CONNECTION_STRING
fi

# Шаг 3: Клонирование репозитория
log_section "Шаг 3: Клонирование репозитория"
read -p "URL репозитория (GitHub/GitLab): " REPO_URL
if [ -z "$REPO_URL" ]; then
    log_warning "Репозиторий не указан, пропускаю..."
else
    ssh "$SSH_HOST" <<ENDSSH
        cd /var/www
        if [ -d "ride-together" ]; then
            cd ride-together
            git pull || echo "⚠️  Не удалось обновить"
        else
            git clone $REPO_URL ride-together || echo "⚠️  Ошибка клонирования"
        fi
ENDSSH
    log_success "Репозиторий готов"
fi

# Шаг 4: Настройка Backend
log_section "Шаг 4: Настройка Backend"
read -p "Домен для Backend API (например: api.your-domain.ru): " API_DOMAIN
read -p "JWT Secret (Enter для автогенерации): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    log_info "JWT Secret сгенерирован автоматически"
fi

ssh "$SSH_HOST" <<ENDSSH
    cd /var/www/ride-together/server
    
    # Создание .env.production
    cat > .env.production <<EOF
# Database
DATABASE_URL=$DB_CONNECTION_STRING

# JWT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# CORS
ALLOWED_ORIGINS=https://$API_DOMAIN
FRONTEND_URL=https://$API_DOMAIN

# WebSocket
WS_PORT=3001
EOF
    
    # Установка зависимостей
    npm install --production
    
    # Сборка
    npm run build
    
    # Запуск через PM2
    pm2 delete ride-backend 2>/dev/null || true
    pm2 start dist/index.js --name ride-backend
    pm2 save
    pm2 startup | tail -1 | bash || true
ENDSSH

log_success "Backend настроен и запущен"

# Шаг 5: Настройка Frontend
log_section "Шаг 5: Настройка Frontend"
read -p "Домен для Frontend (например: your-domain.ru): " FRONTEND_DOMAIN
read -p "Собрать Frontend? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh "$SSH_HOST" <<ENDSSH
        cd /var/www/ride-together
        
        # Создание .env.production
        cat > .env.production <<EOF
VITE_API_URL=https://$API_DOMAIN
VITE_WS_URL=wss://$API_DOMAIN
EOF
        
        # Установка и сборка
        npm install
        npm run build
        
        # Копирование файлов
        sudo cp -r dist/* /var/www/html/
        sudo chown -R www-data:www-data /var/www/html
ENDSSH
    log_success "Frontend собран и развернут"
fi

# Шаг 6: Настройка Nginx
log_section "Шаг 6: Настройка Nginx"
ssh "$SSH_HOST" <<ENDSSH
    cat > /tmp/nginx-config.conf <<'NGINXEOF'
server {
    listen 80;
    server_name $API_DOMAIN $FRONTEND_DOMAIN;
    root /var/www/html;
    index index.html;
    
    # Frontend
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
NGINXEOF
    
    sudo mv /tmp/nginx-config.conf /etc/nginx/sites-available/ride-together
    sudo ln -sf /etc/nginx/sites-available/ride-together /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
ENDSSH

log_success "Nginx настроен"

# Шаг 7: SSL сертификат
log_section "Шаг 7: Настройка SSL"
read -p "Получить SSL сертификат через Certbot? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh "$SSH_HOST" "sudo certbot --nginx -d $FRONTEND_DOMAIN -d $API_DOMAIN --non-interactive --agree-tos --redirect" <<EOF || log_warning "Ошибка получения сертификата"
EOF
    log_success "SSL настроен"
fi

# Итоги
log_section "✅ Настройка завершена!"
log_success "Приложение развернуто на REG.RU"
echo ""
log_info "Информация:"
echo "  Backend: https://$API_DOMAIN"
echo "  Frontend: https://$FRONTEND_DOMAIN"
echo "  База данных: $DB_NAME"
echo ""
log_info "Управление:"
echo "  PM2: ssh $SSH_HOST 'pm2 logs ride-backend'"
echo "  Nginx: ssh $SSH_HOST 'sudo systemctl status nginx'"
echo ""
log_info "Следующие шаги:"
echo "  1. Импортируйте схему БД: psql \$DATABASE_URL < TIMEWEB_FULL_SCHEMA.sql"
echo "  2. Проверьте работу приложения"
echo "  3. Настройте мониторинг (если нужно)"

