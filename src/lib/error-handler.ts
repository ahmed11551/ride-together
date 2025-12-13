/**
 * Error handler utility for user-friendly error messages
 * Prevents exposing technical error details to end users
 */

interface ErrorMessage {
  title: string;
  description: string;
}

/**
 * Maps technical error messages to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // Authentication errors
  'Invalid login': {
    title: 'Ошибка входа',
    description: 'Неверный email или пароль',
  },
  'Invalid login credentials': {
    title: 'Ошибка входа',
    description: 'Неверный email или пароль',
  },
  'Email not confirmed': {
    title: 'Email не подтвержден',
    description: 'Пожалуйста, подтвердите ваш email перед входом',
  },
  'already registered': {
    title: 'Ошибка регистрации',
    description: 'Пользователь с таким email уже существует',
  },
  'User already registered': {
    title: 'Ошибка регистрации',
    description: 'Пользователь с таким email уже существует',
  },
  'duplicate': {
    title: 'Ошибка',
    description: 'Эта запись уже существует',
  },
  'Not authenticated': {
    title: 'Требуется авторизация',
    description: 'Пожалуйста, войдите в аккаунт',
  },
  'user': {
    title: 'Ошибка пользователя',
    description: 'Проблема с данными пользователя. Попробуйте обновить страницу.',
  },
  'doesn\'t seem to exist': {
    title: 'Пользователь не найден',
    description: 'Попробуйте обновить страницу или войти заново.',
  },
  '23503': {
    title: 'Ошибка данных',
    description: 'Проблема с данными профиля. Попробуйте обновить страницу.',
  },
  'foreign key constraint': {
    title: 'Ошибка данных',
    description: 'Проблема с данными профиля. Попробуйте обновить страницу.',
  },
  '409': {
    title: 'Конфликт данных',
    description: 'Профиль уже существует. Попробуйте обновить страницу.',
  },
  'PGRST301': {
    title: 'Конфликт данных',
    description: 'Профиль уже существует. Попробуйте обновить страницу.',
  },
  'duplicate': {
    title: 'Конфликт данных',
    description: 'Профиль уже существует. Попробуйте обновить страницу.',
  },
  // Network errors
  'Failed to fetch': {
    title: 'Ошибка соединения',
    description: 'Проверьте подключение к интернету',
  },
  'Network request failed': {
    title: 'Ошибка соединения',
    description: 'Проверьте подключение к интернету',
  },
  // Generic fallback
  default: {
    title: 'Произошла ошибка',
    description: 'Пожалуйста, попробуйте еще раз или обратитесь в поддержку',
  },
};

/**
 * Gets user-friendly error message from technical error
 * @param error - Error object or string
 * @returns User-friendly error message
 */
export function getUserFriendlyError(error: unknown): ErrorMessage {
  if (!error) {
    return ERROR_MESSAGES.default;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for exact matches first
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (key !== 'default' && errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }

  // Return default message to avoid exposing technical details
  return ERROR_MESSAGES.default;
}

/**
 * Logs error to console in development mode or Sentry in production
 * @param error - Error to log
 * @param context - Additional context about where error occurred
 */
export function logError(error: unknown, context?: string): void {
  // Use centralized logger (imported dynamically to avoid circular dependencies)
  import('./logger').then(({ logError: loggerError }) => {
    loggerError(error, context);
  }).catch(() => {
    // Fallback to console if logger fails to load
    if (import.meta.env.DEV) {
      console.error(`[Error${context ? ` in ${context}` : ''}]:`, error);
    }
  });
}

