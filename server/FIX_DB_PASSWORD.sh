#!/bin/bash
# Исправление пароля пользователя БД

echo "🔧 Исправление пароля пользователя БД..."
echo ""

# Вариант 1: Изменить пароль пользователя
sudo -u postgres psql << 'SQL'
ALTER USER ride_user WITH PASSWORD 'ride_password_secure_change_in_production';
\q
SQL

echo "✅ Пароль обновлён"

# Вариант 2: Проверка подключения с postgres пользователем (для теста)
echo ""
echo "🔍 Тест подключения с postgres пользователем..."
node << 'NODE'
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres@localhost:5432/ride_together'
});
client.connect()
  .then(() => {
    console.log('✅ Подключение с postgres успешно!');
    return client.query('SELECT COUNT(*) as count FROM rides');
  })
  .then((res) => {
    console.log('✅ Поездок в БД:', res.rows[0].count);
    client.end();
  })
  .catch((err) => {
    console.error('❌ Ошибка:', err.message);
  });
NODE

