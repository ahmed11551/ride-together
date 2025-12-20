/**
 * Middleware для логирования HTTP запросов
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // Добавляем requestId в запрос для трейсинга
  (req as any).requestId = requestId;

  // Логируем начало запроса
  logger.debug('Request started', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Перехватываем окончание запроса
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = (req as any).userId || undefined;

    logger.request(
      req.method,
      req.path,
      res.statusCode,
      duration,
      userId
    );

    // Логируем ошибки
    if (res.statusCode >= 400) {
      logger.warn('Request failed', {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      });
    }
  });

  next();
}

