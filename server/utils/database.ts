/**
 * Утилиты для работы с базой данных Timeweb Cloud
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Путь к SSL сертификату
const getSSLOptions = () => {
  if (process.env.TIMEWEB_DB_SSL !== 'true') {
    return false;
  }

  const certPath = process.env.TIMEWEB_DB_SSL_CERT || path.join(process.cwd(), 'ca.crt');
  
  if (fs.existsSync(certPath)) {
    return {
      rejectUnauthorized: process.env.TIMEWEB_DB_SSL_MODE === 'verify-full',
      ca: fs.readFileSync(certPath).toString(),
    };
  }

  // Если сертификат не найден, используем базовую SSL конфигурацию
  return {
    rejectUnauthorized: false,
  };
};

// Создаем пул подключений
const pool = new Pool({
  host: process.env.TIMEWEB_DB_HOST,
  port: parseInt(process.env.TIMEWEB_DB_PORT || '5432'),
  database: process.env.TIMEWEB_DB_NAME,
  user: process.env.TIMEWEB_DB_USER,
  password: process.env.TIMEWEB_DB_PASSWORD,
  ssl: getSSLOptions(),
  max: 20, // Максимум подключений в пуле
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Экспортируем query функцию
export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool,
};

// Закрываем пул при завершении процесса
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
