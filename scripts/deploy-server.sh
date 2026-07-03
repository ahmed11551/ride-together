#!/usr/bin/env bash
# Полный деплой Ride Together на VPS (Ubuntu/Debian)
#
# Первый запуск на чистом сервере:
#   sudo apt update && sudo apt install -y git nginx certbot python3-certbot-nginx postgresql-client
#   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
#   sudo apt install -y nodejs
#   sudo npm install -g pm2
#
# Затем:
#   git clone https://github.com/ahmed11551/ride-together.git /var/www/ride-together
#   cd /var/www/ride-together
#   cp deploy/env.server.example server/.env.production   # заполнить!
#   cp deploy/env.frontend.example .env.production        # заполнить!
#   chmod +x scripts/*.sh
#   DOMAIN=ridetogether.ru ./scripts/deploy-server.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="${APP_DIR:-$ROOT}"
DOMAIN="${DOMAIN:-}"

log()  { echo -e "\033[0;34m▶ $*\033[0m"; }
ok()   { echo -e "\033[0;32m✅ $*\033[0m"; }
warn() { echo -e "\033[1;33m⚠️  $*\033[0m"; }
err()  { echo -e "\033[0;31m❌ $*\033[0m"; exit 1; }

cd "$APP_DIR"

# --- Проверки ---
command -v node  &>/dev/null || err "Node.js не установлен"
command -v npm   &>/dev/null || err "npm не установлен"
command -v pm2   &>/dev/null || warn "pm2 не найден — установите: npm install -g pm2"

[ -f server/.env.production ] || err "Создайте server/.env.production из deploy/env.server.example"
[ -f .env.production ]        || err "Создайте .env.production из deploy/env.frontend.example"

if [ -z "$DOMAIN" ]; then
  DOMAIN=$(grep -E '^FRONTEND_URL=' server/.env.production | cut -d= -f2- | sed 's|https\?://||' | tr -d '/')
  [ -n "$DOMAIN" ] || err "Укажите DOMAIN=yourdomain.ru или FRONTEND_URL в server/.env.production"
fi

log "Деплой Ride Together → $DOMAIN"
log "Директория: $APP_DIR"

# --- Обновление кода ---
if [ -d .git ]; then
  log "git pull..."
  git pull --ff-only origin main || warn "git pull не удался — продолжаем с текущей версией"
fi

# --- Backend ---
log "Сборка backend..."
cd server
npm ci 2>/dev/null || npm install
npm run build
mkdir -p logs
cd ..

# --- Frontend ---
log "Сборка frontend..."
npm ci 2>/dev/null || npm install
npm run build
ok "Frontend собран → dist/"

# --- База данных ---
if command -v psql &>/dev/null; then
  log "Применение схемы БД..."
  if bash scripts/setup-database.sh; then
    ok "База данных OK"
  else
    warn "Схема БД не применена — проверьте DATABASE_URL"
  fi
else
  warn "psql не найден — пропускаем setup-database.sh"
fi

# --- PM2 ---
log "Запуск backend через PM2..."
cd server
if pm2 describe ride-backend &>/dev/null; then
  pm2 restart ride-backend --update-env
else
  pm2 start ecosystem.config.cjs --env production
fi
pm2 save
cd ..
ok "Backend запущен"

# --- Health check ---
sleep 2
if curl -sf http://127.0.0.1:3001/health | grep -q '"status":"ok"'; then
  ok "Health check: OK"
else
  warn "Backend не отвечает на :3001 — проверьте: pm2 logs ride-backend"
fi

# --- Nginx ---
if command -v nginx &>/dev/null; then
  log "Настройка nginx..."
  NGINX_CONF="/etc/nginx/sites-available/ride-together"
  sed "s/YOUR_DOMAIN/$DOMAIN/g" deploy/nginx.conf | sudo tee "$NGINX_CONF" > /dev/null
  sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/ride-together
  sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  sudo nginx -t && sudo systemctl reload nginx
  ok "Nginx настроен"
else
  warn "nginx не найден — настройте вручную: deploy/nginx.conf"
fi

# --- SSL ---
if command -v certbot &>/dev/null; then
  log "SSL (certbot)..."
  sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" 2>/dev/null \
    || warn "certbot не выполнен — запустите вручную: sudo certbot --nginx -d $DOMAIN"
fi

# --- Telegram ---
if grep -qE '^TELEGRAM_BOT_TOKEN=.+$' server/.env.production 2>/dev/null; then
  log "Настройка Telegram..."
  bash scripts/setup-telegram.sh || warn "Telegram setup не удался"
fi

echo ""
echo "============================================"
ok "Деплой завершён!"
echo ""
echo "  Сайт:    https://$DOMAIN"
echo "  API:     https://$DOMAIN/api/health → через nginx"
echo "  Логи:    pm2 logs ride-backend"
echo ""
echo "Проверьте:"
echo "  1. Откройте https://$DOMAIN"
echo "  2. Зарегистрируйтесь / войдите"
echo "  3. Создайте тестовую поездку"
echo "  4. Откройте бота в Telegram"
echo "============================================"
