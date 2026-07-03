# Деплой Ride Together

## Быстрый старт (VPS)

### 1. Подготовка сервера (один раз)

```bash
sudo apt update && sudo apt install -y git nginx certbot python3-certbot-nginx postgresql-client
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Клонирование

```bash
sudo mkdir -p /var/www
sudo git clone https://github.com/ahmed11551/ride-together.git /var/www/ride-together
sudo chown -R $USER:$USER /var/www/ride-together
cd /var/www/ride-together
```

### 3. Настройка переменных

```bash
cp deploy/env.server.example server/.env.production
cp deploy/env.frontend.example .env.production
nano server/.env.production   # DATABASE_URL, JWT_SECRET, TELEGRAM_BOT_TOKEN...
nano .env.production          # VITE_API_URL, VITE_YANDEX_MAPS_API_KEY
```

**JWT_SECRET:** `openssl rand -base64 32`

### 4. База данных

Локальный PostgreSQL на сервере:
```bash
sudo -u postgres createdb ride_together
sudo -u postgres psql -c "CREATE USER ride_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ride_together TO ride_user;"
# DATABASE_URL=postgresql://ride_user:your_password@localhost:5432/ride_together
```

Или облачная БД (Timeweb) — вставьте `DATABASE_URL` из панели.

```bash
chmod +x scripts/*.sh
./scripts/setup-database.sh
```

### 5. Деплой

```bash
chmod +x scripts/*.sh
DOMAIN=ridetogether.ru ./scripts/deploy-server.sh
```

Скрипт: сборка → PM2 → nginx → SSL → Telegram webhook.

### 6. Обновление после изменений

```bash
cd /var/www/ride-together
git pull
DOMAIN=ridetogether.ru ./scripts/deploy-server.sh
```

---

## Файлы

| Файл | Назначение |
|------|------------|
| `deploy/nginx.conf` | Nginx: SPA + /api + WebSocket |
| `deploy/env.server.example` | Backend `.env.production` |
| `deploy/env.frontend.example` | Frontend `.env.production` |
| `scripts/deploy-server.sh` | Полный деплой |
| `scripts/setup-database.sh` | Применить `database/schema.sql` |
| `scripts/setup-telegram.sh` | Webhook + Mini App кнопка |
| `scripts/prepare-deploy.sh` | Локальная проверка сборки |

---

## Проверка

```bash
curl http://127.0.0.1:3001/health          # backend
curl https://YOUR_DOMAIN/health           # через nginx
pm2 logs ride-backend
sudo tail -f /var/log/nginx/ride-together-error.log
```

---

## Telegram Mini App

1. BotFather → `/newbot` или существующий бот
2. BotFather → `/newapp` → URL: `https://YOUR_DOMAIN`
3. Токен → `TELEGRAM_BOT_TOKEN` в `server/.env.production`
4. `./scripts/setup-telegram.sh`

---

## Частые проблемы

| Проблема | Решение |
|----------|---------|
| CORS error | `ALLOWED_ORIGINS` и `FRONTEND_URL` в server/.env.production |
| API 502 | `pm2 logs ride-backend`, проверьте DATABASE_URL |
| Карта не грузится | `VITE_YANDEX_MAPS_API_KEY` + пересобрать фронт |
| WebSocket не работает | nginx `location /socket.io/` — см. deploy/nginx.conf |
| SSL | `sudo certbot --nginx -d domain.ru` |
