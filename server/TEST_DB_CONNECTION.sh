#!/bin/bash
# Тест подключения к БД

cd /var/www/ride-together/server

echo "🔍 Проверка подключения к БД..."
echo ""

# 1. Проверяем что DATABASE_URL передаётся в PM2
echo "1️⃣  DATABASE_URL в PM2 env:"
pm2 env 0 | grep DATABASE_URL || echo "⚠️  Не найдено"

echo ""
echo "2️⃣  Проверяем подключение через Node.js..."
node << 'NODE'
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://gen_user:fn)un5%40K2oLrBJ@9d497bc2bf9dd679bd9834af.twc1.net:5432/default_db?sslmode=verify-full';

console.log('Подключение с:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

const client = new Client({
  connectionString: DATABASE_URL
});

client.connect()
  .then(() => {
    console.log('✅ Подключение успешно!');
    return client.query('SELECT NOW()');
  })
  .then((res) => {
    console.log('✅ Запрос выполнен:', res.rows[0]);
    client.end();
  })
  .catch((err) => {
    console.error('❌ Ошибка подключения:', err.message);
    console.error('Детали:', err.code, err.cause?.message || '');
    process.exit(1);
  });
NODE

echo ""
echo "3️⃣  Если не работает с verify-full, пробуем с require..."
node << 'NODE'
const { Client } = require('pg');

// Пробуем с sslmode=require вместо verify-full
const DATABASE_URL = 'postgresql://gen_user:fn)un5%40K2oLrBJ@9d497bc2bf9dd679bd9834af.twc1.net:5432/default_db?sslmode=require';

console.log('Пробуем подключение с sslmode=require...');

const client = new Client({
  connectionString: DATABASE_URL
});

client.connect()
  .then(() => {
    console.log('✅ Подключение успешно с sslmode=require!');
    client.end();
  })
  .catch((err) => {
    console.error('❌ Ошибка:', err.message);
  });
NODE

