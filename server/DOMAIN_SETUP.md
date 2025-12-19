# Настройка домена для сервера на REG.RU VPS

## Шаги для настройки домена:

### 1. Настройка DNS в REG.RU

1. Зайдите в панель REG.RU
2. Перейдите в раздел "Домены" → выберите ваш домен
3. Добавьте DNS записи:
   - **A запись**: `@` → `194.67.124.123`
   - **A запись**: `api` → `194.67.124.123` (для поддомена api.yourdomain.com)
   - (опционально) **A запись**: `www` → `194.67.124.123`

### 2. Установка и настройка Nginx на сервере

```bash
# Установка nginx
apt update
apt install -y nginx certbot python3-certbot-nginx

# Создаем конфигурацию для домена
nano /etc/nginx/sites-available/ride-together-api
```

### 3. Конфигурация Nginx (с SSL через Let's Encrypt)

```nginx
# /etc/nginx/sites-available/ride-together-api
server {
    listen 80;
    server_name api.yourdomain.com yourdomain.com;

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com yourdomain.com;

    # SSL сертификаты (будут установлены certbot)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Логи
    access_log /var/log/nginx/ride-together-api-access.log;
    error_log /var/log/nginx/ride-together-api-error.log;

    # Максимальный размер тела запроса
    client_max_body_size 10M;

    # Проксирование на Node.js сервер
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        # Заголовки для WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Заголовки для правильной работы
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
```

### 4. Активация конфигурации и получение SSL

```bash
# Создаем симлинк
ln -s /etc/nginx/sites-available/ride-together-api /etc/nginx/sites-enabled/

# Проверяем конфигурацию
nginx -t

# Если все OK, перезагружаем nginx
systemctl reload nginx

# Получаем SSL сертификат от Let's Encrypt
certbot --nginx -d api.yourdomain.com -d yourdomain.com

# Certbot автоматически обновит конфигурацию nginx
```

### 5. Обновление переменных окружения сервера

```bash
cd /var/www/ride-together/server

# Обновляем .env.production или переменные PM2
nano .env.production
```

Обновите:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### 6. Обновление PM2 конфигурации

```bash
cd /var/www/ride-together/server
nano ecosystem.config.cjs
```

Обновите переменные окружения в PM2 конфигурации.

### 7. Перезапуск сервера

```bash
# Перезапуск PM2
pm2 restart ride-backend

# Проверка статуса
pm2 status

# Проверка логов
pm2 logs ride-backend --lines 20
```

### 8. Проверка работы

```bash
# Проверка health check
curl https://api.yourdomain.com/health

# Проверка основного API
curl https://api.yourdomain.com/api/rides
```

### 9. Настройка автоматического обновления SSL

```bash
# Проверка автообновления
certbot renew --dry-run

# Убедитесь что cron job установлен (обычно устанавливается автоматически)
systemctl status certbot.timer
```

## Альтернативный вариант: Без Nginx (прямой доступ)

Если не хотите использовать Nginx, можно:
1. Открыть порт 3001 в firewall
2. Настроить домен на прямой доступ к IP:3001
3. НО это НЕ рекомендуется для production - нет SSL и дополнительной защиты

## Важные моменты:

1. **Firewall**: Убедитесь что порт 80 и 443 открыты:
   ```bash
   ufw allow 80/tcp
   ufw allow 443/tcp
   ```

2. **CORS**: Обновите `ALLOWED_ORIGINS` в переменных окружения

3. **Frontend**: Обновите `VITE_API_URL` во фронтенде на новый домен

4. **WebSocket**: Убедитесь что WebSocket работает через nginx прокси

