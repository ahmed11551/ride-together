/**
 * Интеграция Sentry для отслеживания ошибок
 * Опционально - работает только если SENTRY_DSN установлен
 */

let sentryInitialized = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.log('Sentry DSN не установлен, ошибки не будут отправляться в Sentry');
    return;
  }

  try {
    // Динамический импорт для избежания ошибок если пакет не установлен
    import('@sentry/node').then((Sentry) => {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'production',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        // Игнорируем некоторые ошибки
        ignoreErrors: [
          'ValidationError',
          'UnauthorizedError',
          // Игнорируем ошибки валидации - это нормальное поведение
        ],
        beforeSend(event, hint) {
          // Можно добавить фильтрацию перед отправкой
          return event;
        },
      });
      sentryInitialized = true;
      console.log('✅ Sentry инициализирован');
    }).catch((err) => {
      console.warn('⚠️  @sentry/node не установлен. Установите: npm install @sentry/node');
    });
  } catch (error) {
    console.warn('Ошибка при инициализации Sentry:', error);
  }
}

export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!sentryInitialized) {
    return;
  }

  import('@sentry/node').then((Sentry) => {
    Sentry.captureException(error, {
      contexts: {
        custom: context || {},
      },
    });
  }).catch(() => {
    // Sentry не установлен - игнорируем
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>): void {
  if (!sentryInitialized) {
    return;
  }

  import('@sentry/node').then((Sentry) => {
    Sentry.captureMessage(message, {
      level,
      contexts: {
        custom: context || {},
      },
    });
  }).catch(() => {
    // Sentry не установлен - игнорируем
  });
}

export function setUserContext(userId: string, email?: string): void {
  if (!sentryInitialized) {
    return;
  }

  import('@sentry/node').then((Sentry) => {
    Sentry.setUser({
      id: userId,
      email,
    });
  }).catch(() => {
    // Sentry не установлен - игнорируем
  });
}

