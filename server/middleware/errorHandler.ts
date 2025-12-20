/**
 * Centralized error handler middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { captureException } from '../utils/sentry.js';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Логируем ошибку
  const userId = (req as any).userId;
  const requestId = (req as any).requestId;

  logger.error('Request error', error, {
    userId,
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Отправляем в Sentry
  captureException(error, {
    userId,
    requestId,
    method: req.method,
    path: req.path,
  });

  // Отправляем ответ пользователю
  // Не показываем детали ошибки в production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(500).json({
    error: isDevelopment ? error.message : 'Внутренняя ошибка сервера',
    ...(isDevelopment && { stack: error.stack }),
  });
}

/**
 * Async error wrapper для route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

