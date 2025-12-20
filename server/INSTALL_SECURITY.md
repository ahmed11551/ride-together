# 🔒 Установка безопасности

## Что добавлено:

### 1. Rate Limiting
- Общий лимит: 100 запросов/15 минут на IP
- Аутентификация: 5 попыток/15 минут
- Создание контента: 20 созданий/час
- Сообщения: 30 сообщений/минуту

### 2. Security Headers (helmet)
- Content Security Policy
- HSTS
- Защита от clickjacking
- XSS Protection

### 3. Валидация данных
- Валидация email, пароля
- Валидация UUID параметров
- Валидация создания поездок
- Sanitization пользовательского ввода

## Установка на сервере:

```bash
cd /var/www/ride-together/server

# 1. Установка зависимостей
npm install express-rate-limit helmet
npm install --save-dev @types/express-rate-limit

# 2. Пересборка TypeScript
npm run build

# 3. Перезапуск PM2
pm2 restart ride-backend --update-env

# 4. Проверка
sleep 3
curl -s http://localhost:3001/health
pm2 logs ride-backend --lines 10 --nostream
```

## Файлы изменены:

- `server/index.ts` - добавлены middleware
- `server/middleware/rateLimiter.ts` - rate limiting
- `server/middleware/security.ts` - security headers
- `server/middleware/validator.ts` - валидация данных
- `server/package.json` - новые зависимости

