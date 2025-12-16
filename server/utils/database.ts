/**
 * Утилиты для работы с базой данных Timeweb Cloud
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Путь к SSL сертификату
const getSSLOptions = () => {
  // Если используется DATABASE_URL с sslmode=verify-full, нужен сертификат
  if (process.env.DATABASE_URL?.includes('sslmode=verify-full')) {
    const certPath = process.env.PGSSLROOTCERT || 
                     process.env.TIMEWEB_DB_SSL_CERT || 
                     path.join(process.cwd(), 'ca.crt');
    
    if (fs.existsSync(certPath)) {
      return {
        rejectUnauthorized: true,
        ca: fs.readFileSync(certPath).toString(),
      };
    }
    
    // Если сертификат не найден, но требуется verify-full, используем базовую SSL
    console.warn('SSL certificate not found, using basic SSL connection');
    return {
      rejectUnauthorized: false,
    };
  }

  // Если явно указан TIMEWEB_DB_SSL
  if (process.env.TIMEWEB_DB_SSL === 'true') {
    const certPath = process.env.PGSSLROOTCERT || 
                     process.env.TIMEWEB_DB_SSL_CERT || 
                     path.join(process.cwd(), 'ca.crt');
    
    if (fs.existsSync(certPath)) {
      return {
        rejectUnauthorized: process.env.TIMEWEB_DB_SSL_MODE === 'verify-full',
        ca: fs.readFileSync(certPath).toString(),
      };
    }
    
    return {
      rejectUnauthorized: false,
    };
  }

  return false;
};

// Создаем пул подключений
// Приоритет: DATABASE_URL > отдельные переменные
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: getSSLOptions(),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : new Pool({
      host: process.env.TIMEWEB_DB_HOST,
      port: parseInt(process.env.TIMEWEB_DB_PORT || '5432'),
      database: process.env.TIMEWEB_DB_NAME,
      user: process.env.TIMEWEB_DB_USER,
      password: process.env.TIMEWEB_DB_PASSWORD,
      ssl: getSSLOptions(),
      max: 20,
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
