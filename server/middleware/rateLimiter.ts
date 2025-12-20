/**
 * Rate Limiting middleware для защиты API
 */

import rateLimit from 'express-rate-limit';

// Общий rate limiter для всех API endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов за окно времени
  message: {
    error: 'Слишком много запросов с этого IP, попробуйте позже',
  },
  standardHeaders: true, // Возвращаем rate limit info в заголовках `RateLimit-*`
  legacyHeaders: false, // Отключаем заголовки `X-RateLimit-*`
  // Пропускаем локальные запросы в development
  skip: (req) => {
    if (process.env.NODE_ENV !== 'production') {
      return req.ip === '127.0.0.1' || req.ip === '::1';
    }
    return false;
  },
});

// Более строгий лимит для аутентификации
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток входа/регистрации
  message: {
    error: 'Слишком много попыток входа, попробуйте через 15 минут',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Не считаем успешные запросы
});

// Лимит для создания контента (поездки, отзывы и т.д.)
export const createContentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 20, // максимум 20 созданий за час
  message: {
    error: 'Вы создали слишком много поездок, попробуйте позже',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимит для отправки сообщений
export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 30, // максимум 30 сообщений в минуту
  message: {
    error: 'Слишком много сообщений, подождите немного',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

