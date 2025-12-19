#!/bin/bash
# Быстрая настройка домена ridetogether.ru на сервере

set -e

DOMAIN="ridetogether.ru"
API_DOMAIN="api.ridetogether.ru"

echo "🌐 Настройка домена: $DOMAIN"
echo "🔧 API будет на: https://$API_DOMAIN"

# Проверка root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Запустите от root: sudo $0"
    exit 1
fi

# Установка nginx и certbot
echo "📦 Установка nginx и certbot..."
apt update
apt install -y nginx certbot python3-certbot-nginx

# Создание конфигурации
echo "⚙️ Создание конфигурации nginx..."
cat > /etc/nginx/sites-available/ride-together-api << 'EOF'
# HTTP конфигурация (для получения SSL)
server {
    listen 80;
    server_name api.ridetogether.ru ridetogether.ru www.ridetogether.ru;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
EOF

# Активация
echo "🔗 Активация конфигурации..."
ln -sf /etc/nginx/sites-available/ride-together-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Проверка
echo "✅ Проверка конфигурации..."
nginx -t

# Перезагрузка
echo "🔄 Перезагрузка nginx..."
systemctl reload nginx

# SSL сертификат
echo "🔒 Получение SSL сертификата..."
echo "⚠️  Убедитесь что DNS записи обновлены перед получением SSL!"
read -p "DNS записи обновлены? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    certbot --nginx -d $API_DOMAIN -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || {
        echo "⚠️  Не удалось получить SSL. Проверьте DNS записи."
    }
else
    echo "⏭️  Пропускаем SSL. Выполните позже: certbot --nginx -d $API_DOMAIN -d $DOMAIN -d www.$DOMAIN"
fi

# Обновление PM2
echo "⚙️ Обновление переменных окружения PM2..."
cd /var/www/ride-together/server

if [ -f ecosystem.config.cjs ]; then
    cp ecosystem.config.cjs ecosystem.config.cjs.backup
    
    # Обновляем ALLOWED_ORIGINS
    sed -i "s|ALLOWED_ORIGINS.*|ALLOWED_ORIGINS: 'https://$DOMAIN,https://www.$DOMAIN,https://$API_DOMAIN',|" ecosystem.config.cjs
    
    # Перезапускаем
    pm2 restart ride-backend --update-env
fi

# Firewall
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
fi

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📋 Проверка:"
echo "  curl http://$API_DOMAIN/health"
echo "  curl https://$API_DOMAIN/health  # после SSL"
echo ""
echo "📝 Не забудьте обновить DNS записи в REG.RU!"
echo "   - A @ → 194.67.124.123"
echo "   - A www → 194.67.124.123"
echo "   - A api → 194.67.124.123"

