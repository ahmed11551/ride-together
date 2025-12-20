#!/bin/bash
# Проверка подключения к БД и логов

cd /var/www/ride-together/server

echo "1️⃣  Тест подключения к локальной БД..."
node << 'NODE'
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://ride_user:ride_password_secure_change_in_production@localhost:5432/ride_together'
});
client.connect()
  .then(() => {
    console.log('✅ Подключение успешно!');
    return client.query('SELECT COUNT(*) as count FROM rides');
  })
  .then((res) => {
    console.log('✅ Поездок в БД:', res.rows[0].count);
    return client.query('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = $1', ['public']);
  })
  .then((res) => {
    console.log('✅ Всего таблиц:', res.rows[0].count);
    client.end();
  })
  .catch((err) => {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  });
NODE

echo ""
echo "2️⃣  Проверка DATABASE_URL в PM2..."
pm2 show ride-backend | grep DATABASE_URL

echo ""
echo "3️⃣  Последние ошибки PM2..."
pm2 logs ride-backend --err --lines 20 --nostream | tail -20

echo ""
echo "4️⃣  Тест API..."
curl -s "http://localhost:3001/api/rides?limit=1" | head -c 300
echo ""

