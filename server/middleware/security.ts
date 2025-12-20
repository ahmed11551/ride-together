/**
 * Security middleware с помощью helmet
 */

import helmet from 'helmet';

export const securityMiddleware = helmet({
  // Content Security Policy - настраиваем для работы с Telegram и картами
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https:"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'", // Нужно для некоторых библиотек, но лучше убрать если возможно
        "https://telegram.org",
        "https://www.gstatic.com",
        "https://api-maps.yandex.ru",
        "https:",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:",
        "https://*.tile.openstreetmap.org",
        "https://api-maps.yandex.ru",
      ],
      connectSrc: [
        "'self'",
        "https://ridetogether.ru",
        "wss://ridetogether.ru",
        "https://api.ridetogether.ru",
        "wss://api.ridetogether.ru",
        "https://telegram.org",
        "https://api-maps.yandex.ru",
        "https:",
        "wss:",
        "ws:",
      ],
      fontSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'self'", "https://telegram.org", "https:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // HSTS - принудительный HTTPS
  hsts: {
    maxAge: 31536000, // 1 год
    includeSubDomains: true,
    preload: true,
  },
  // Отключаем информацию о сервере
  hidePoweredBy: true,
  // Защита от clickjacking
  frameguard: {
    action: 'deny',
  },
  // Отключаем MIME type sniffing
  noSniff: true,
  // XSS Protection (хотя современные браузеры игнорируют)
  xssFilter: true,
});

