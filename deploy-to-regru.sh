#!/bin/bash

# Скрипт для развертывания проекта на REG.RU VPS
# Использование: ./deploy-to-regru.sh

set -e

SERVER_IP="194.67.124.123"
SERVER_USER="root"
SERVER_PATH="/var/www/ride-together"
PROJECT_DIR="ride-together"

echo "🚀 Начинаем развертывание на REG.RU сервер..."

# Проверяем, что мы в правильной директории
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Директория $PROJECT_DIR не найдена!"
    exit 1
fi

cd "$PROJECT_DIR"

echo "📦 Собираем проект..."
cd server
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Ошибка: директория dist не создана!"
    exit 1
fi

echo "📤 Копируем файлы на сервер..."

# Создаем архив с проектом
cd ..
tar -czf ../ride-together-deploy.tar.gz \
    server/dist \
    server/package.json \
    server/package-lock.json \
    server/.env.production \
    server/tsconfig.json

# Копируем на сервер
scp ../ride-together-deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/

echo "🔧 Распаковываем на сервере..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    set -e
    cd /var/www/ride-together
    
    # Останавливаем PM2
    pm2 stop ride-backend || true
    
    # Делаем бэкап
    if [ -d "server-backup" ]; then
        rm -rf server-backup
    fi
    if [ -d "server" ]; then
        mv server server-backup-$(date +%Y%m%d-%H%M%S)
    fi
    
    # Распаковываем новый архив
    cd /var/www/ride-together
    tar -xzf /tmp/ride-together-deploy.tar.gz
    
    # Переименовываем dist в server (если нужно)
    if [ -d "server/dist" ]; then
        cd server
        mv dist/* .
        rmdir dist
        cd ..
    fi
    
    # Устанавливаем зависимости
    cd server
    npm ci --production
    
    # Запускаем PM2
    pm2 restart ride-backend || pm2 start dist/index.js --name ride-backend
    
    # Сохраняем конфигурацию PM2
    pm2 save
    
    echo "✅ Развертывание завершено!"
ENDSSH

# Удаляем локальный архив
rm -f ../ride-together-deploy.tar.gz

echo "✅ Готово! Проверьте логи: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs ride-backend'"

