#!/bin/bash
# Настройка локальной базы данных PostgreSQL

set -e

echo "🔧 Настройка локальной базы данных..."
echo ""

# 1. Проверка что PostgreSQL работает
echo "1️⃣  Проверка PostgreSQL..."
systemctl status postgresql --no-pager | head -5

# Проверяем что сервер слушает порт
if ! ss -tlnp | grep -q 5432; then
    echo "⚠️  PostgreSQL не слушает порт 5432, запускаем кластер..."
    sudo -u postgres pg_ctlcluster 16 main start 2>/dev/null || sudo -u postgres pg_ctlcluster 15 main start 2>/dev/null || echo "Попробуйте вручную"
fi

# 2. Создание базы данных и пользователя
echo ""
echo "2️⃣  Создание базы данных и пользователя..."
sudo -u postgres psql << 'SQL'
-- Создаём пользователя (если не существует)
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'ride_user') THEN
    CREATE USER ride_user WITH PASSWORD 'ride_password_secure_change_in_production';
    ALTER USER ride_user CREATEDB;
  END IF;
END
\$\$;

-- Создаём базу данных (если не существует)
SELECT 'CREATE DATABASE ride_together'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ride_together')\gexec

-- Даём права пользователю
GRANT ALL PRIVILEGES ON DATABASE ride_together TO ride_user;
\q
SQL

echo "✅ База данных создана"

# 3. Применение схемы
echo ""
echo "3️⃣  Применение схемы базы данных..."
if [ -f "/var/www/ride-together/TIMEWEB_FULL_SCHEMA.sql" ]; then
    echo "Применяем схему из TIMEWEB_FULL_SCHEMA.sql..."
    sudo -u postgres psql -d ride_together -f /var/www/ride-together/TIMEWEB_FULL_SCHEMA.sql 2>&1 | tail -10
    echo "✅ Схема применена"
elif [ -f "/var/www/ride-together/server/../TIMEWEB_FULL_SCHEMA.sql" ]; then
    echo "Применяем схему..."
    sudo -u postgres psql -d ride_together -f /var/www/ride-together/server/../TIMEWEB_FULL_SCHEMA.sql 2>&1 | tail -10
    echo "✅ Схема применена"
else
    echo "⚠️  Файл схемы не найден. Нужно загрузить TIMEWEB_FULL_SCHEMA.sql на сервер"
fi

# 4. Даём права пользователю на схему public
echo ""
echo "4️⃣  Настройка прав пользователя..."
sudo -u postgres psql -d ride_together << 'SQL'
GRANT ALL ON SCHEMA public TO ride_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ride_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ride_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ride_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ride_user;
\q
SQL

echo "✅ Права настроены"

# 5. Обновление DATABASE_URL в ecosystem.config.cjs
echo ""
echo "5️⃣  Обновление DATABASE_URL..."
cd /var/www/ride-together/server

# Создаём новый DATABASE_URL для локальной БД
NEW_DB_URL="postgresql://ride_user:ride_password_secure_change_in_production@localhost:5432/ride_together"

# Обновляем ecosystem.config.cjs
if [ -f "ecosystem.config.cjs" ]; then
    # Создаём backup
    cp ecosystem.config.cjs ecosystem.config.cjs.backup.$(date +%Y%m%d_%H%M%S)
    
    # Заменяем DATABASE_URL
    sed -i "s|DATABASE_URL: '[^']*'|DATABASE_URL: '${NEW_DB_URL}'|g" ecosystem.config.cjs
    
    echo "✅ DATABASE_URL обновлён в ecosystem.config.cjs"
    echo "   Новый URL: ${NEW_DB_URL}"
else
    echo "⚠️  ecosystem.config.cjs не найден"
fi

# 6. Тест подключения
echo ""
echo "6️⃣  Тест подключения к новой БД..."
node << NODE
const { Client } = require('pg');
const client = new Client({
  connectionString: '${NEW_DB_URL}'
});
client.connect()
  .then(() => {
    console.log('✅ Подключение успешно!');
    return client.query('SELECT version()');
  })
  .then((res) => {
    console.log('✅ PostgreSQL версия:', res.rows[0].version.split(',')[0]);
    return client.query('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = \\'public\\'');
  })
  .then((res) => {
    console.log('✅ Таблиц в БД:', res.rows[0].count);
    client.end();
  })
  .catch((err) => {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  });
NODE

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "🔄 Теперь перезапустите PM2:"
echo "   pm2 restart ride-backend --update-env"

