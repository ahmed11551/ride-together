/**
 * Enhanced database utilities with logging
 * Обёртка над базовым database.ts с добавлением логирования
 */

import { db } from './database.js';
import { logger } from './logger.js';

/**
 * Выполняет запрос с логированием
 */
export async function queryWithLogging(
  queryText: string,
  params?: any[],
  context?: string
): Promise<any> {
  const startTime = Date.now();
  
  try {
    logger.debug('Database query', { 
      query: queryText.substring(0, 100), // Первые 100 символов для краткости
      paramsCount: params?.length || 0,
      context,
    });

    const result = await db.query(queryText, params);
    const duration = Date.now() - startTime;

    logger.database(queryText.substring(0, 100), duration);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.database(queryText.substring(0, 100), duration, error as Error);
    throw error;
  }
}

// Экспортируем всё из database.ts
export { db } from './database.js';

