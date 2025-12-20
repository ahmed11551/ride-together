# 📊 Настройка логирования и мониторинга

## Что добавлено:

### 1. ✅ Структурированное логирование
**Файл:** `server/utils/logger.ts`

- JSON формат в production для парсинга
- Читаемый формат в development
- Уровни логирования (debug, info, warn, error)
- Контекстная информация (userId, requestId и т.д.)

### 2. ✅ Sentry интеграция (опционально)
**Файл:** `server/utils/sentry.ts`

- Отслеживание ошибок в Sentry
- Контекст пользователя
- Работает только если SENTRY_DSN установлен

### 3. ✅ Request logging middleware
**Файл:** `server/middleware/requestLogger.ts`

- Логирование всех HTTP запросов
- Duration, status code, метод, путь
- Request ID для трейсинга

### 4. ✅ Error handler middleware
**Файл:** `server/middleware/errorHandler.ts`

- Централизованная обработка ошибок
- Автоматическое логирование
- Интеграция с Sentry

### 5. ✅ Database query logging
**Файл:** `server/utils/enhancedDatabase.ts`

- Логирование всех запросов к БД
- Duration запросов
- Логирование ошибок БД

---

## Установка на сервере:

### Шаг 1: Установка зависимостей

```bash
cd /var/www/ride-together/server

# Sentry (опционально, но рекомендуется)
npm install @sentry/node

# Пересборка
npm run build
```

### Шаг 2: Настройка переменных окружения

Добавьте в `ecosystem.config.cjs` или `.env.production`:

```javascript
env: {
  // ... существующие переменные
  LOG_LEVEL: 'info', // debug, info, warn, error
  SENTRY_DSN: 'https://your-sentry-dsn@sentry.io/project-id', // Опционально
}
```

### Шаг 3: Перезапуск

```bash
pm2 restart ride-backend --update-env
pm2 logs ride-backend --lines 20
```

---

## Использование logger в коде:

```typescript
import { logger } from '../utils/logger.js';

// Простое логирование
logger.info('User logged in', { userId: '123' });
logger.error('Failed to create ride', error, { userId: '123' });

// Специальные методы
logger.request('GET', '/api/rides', 200, 45, 'user-id');
logger.database('SELECT * FROM rides', 120);
logger.auth('signin', 'user-id', true);
```

---

## Настройка Sentry:

1. Создайте аккаунт на https://sentry.io
2. Создайте новый проект (Node.js)
3. Скопируйте DSN
4. Добавьте в переменные окружения: `SENTRY_DSN=your-dsn`

---

## Ротация логов (опционально):

Для ротации логов PM2 можно использовать pm2-logrotate:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

---

## Мониторинг логов:

```bash
# Просмотр всех логов
pm2 logs ride-backend

# Только ошибки
pm2 logs ride-backend --err

# Последние 100 строк
pm2 logs ride-backend --lines 100

# Поиск в логах
pm2 logs ride-backend | grep "error"
```

