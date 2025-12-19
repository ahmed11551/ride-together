#!/bin/bash
# Скрипт для быстрой настройки домена на REG.RU VPS
# Использование: ./setup-domain.sh yourdomain.com

set -e

if [ -z "$1" ]; then
    echo "❌ Укажите домен: ./setup-domain.sh yourdomain.com"
    exit 1
fi

DOMAIN=$1
API_DOMAIN="api.$DOMAIN"

echo "🌐 Настройка домена: $DOMAIN"
echo "🔧 API будет доступен на: https://$API_DOMAIN"

# Проверка root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Запустите скрипт от root: sudo ./setup-domain.sh $DOMAIN"
    exit 1
fi

# Установка nginx и certbot
echo "📦 Установка nginx и certbot..."
apt update
apt install -y nginx certbot python3-certbot-nginx

# Создание конфигурации nginx
echo "⚙️ Создание конфигурации nginx..."
cat > /etc/nginx/sites-available/ride-together-api << EOF
# Редирект HTTP на HTTPS
server {
    listen 80;
    server_name $API_DOMAIN $DOMAIN;

    # Для получения SSL сертификата
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Временно оставляем HTTP для получения SSL
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Активация конфигурации
echo "🔗 Активация конфигурации..."
ln -sf /etc/nginx/sites-available/ride-together-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Проверка конфигурации
echo "✅ Проверка конфигурации nginx..."
nginx -t

# Перезагрузка nginx
echo "🔄 Перезагрузка nginx..."
systemctl reload nginx

# Получение SSL сертификата
echo "🔒 Получение SSL сертификата от Let's Encrypt..."
certbot --nginx -d $API_DOMAIN -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || {
    echo "⚠️  Не удалось получить SSL сертификат автоматически"
    echo "Попробуйте вручную: certbot --nginx -d $API_DOMAIN -d $DOMAIN"
}

# Обновление переменных окружения PM2
echo "⚙️ Обновление переменных окружения..."
cd /var/www/ride-together/server

# Обновляем ecosystem.config.cjs
if [ -f ecosystem.config.cjs ]; then
    # Бэкап
    cp ecosystem.config.cjs ecosystem.config.cjs.backup
    
    # Обновляем ALLOWED_ORIGINS
    sed -i "s|ALLOWED_ORIGINS.*|ALLOWED_ORIGINS: 'https://$DOMAIN,https://www.$DOMAIN,https://$API_DOMAIN',|" ecosystem.config.cjs
    
    # Перезапускаем PM2
    pm2 restart ride-backend --update-env
fi

# Обновление .env.production если есть
if [ -f .env.production ]; then
    sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN,https://$API_DOMAIN|" .env.production
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|" .env.production
fi

# Проверка firewall
echo "🔥 Проверка firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "✅ Порты 80 и 443 открыты в firewall"
fi

# Финальная проверка
echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📋 Проверка работы:"
echo "  curl https://$API_DOMAIN/health"
echo ""
echo "📝 Что дальше:"
echo "  1. Обновите DNS записи в REG.RU:"
echo "     A запись: @ → 194.67.124.123"
echo "     A запись: api → 194.67.124.123"
echo ""
echo "  2. Обновите VITE_API_URL во фронтенде:"
echo "     VITE_API_URL=https://$API_DOMAIN"
echo ""
echo "  3. Проверьте работу:"
echo "     curl https://$API_DOMAIN/health"
echo "     curl https://$API_DOMAIN/api/rides"
echo ""

