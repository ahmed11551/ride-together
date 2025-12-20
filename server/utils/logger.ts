/**
 * Структурированное логирование для сервера
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';
  private minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (this.isDevelopment ? 'debug' : 'info');

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.minLevel];
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // В development - читаемый формат
      const contextStr = entry.context ? ` ${JSON.stringify(entry.context, null, 2)}` : '';
      const errorStr = entry.error ? `\nError: ${entry.error.name}: ${entry.error.message}` : '';
      return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}${errorStr}`;
    } else {
      // В production - JSON формат для парсинга
      return JSON.stringify(entry);
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        code: (error as any).code,
      } : undefined,
    };

    const formatted = this.formatLog(entry);
    
    // Используем console методы для правильного вывода
    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log('warn', message, context, error);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error);
  }

  // Специальные методы для разных типов событий
  request(method: string, path: string, statusCode: number, duration?: number, userId?: string): void {
    this.info('HTTP Request', {
      method,
      path,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
      userId,
    });
  }

  database(query: string, duration?: number, error?: Error): void {
    if (error) {
      this.error('Database Query Failed', error, { query, duration });
    } else {
      this.debug('Database Query', { query, duration: duration ? `${duration}ms` : undefined });
    }
  }

  auth(action: string, userId?: string, success: boolean = true, error?: Error): void {
    if (error) {
      this.error(`Auth ${action} failed`, error, { userId, action });
    } else {
      this.info(`Auth ${action}`, { userId, action, success });
    }
  }
}

// Экспортируем singleton instance
export const logger = new Logger();

