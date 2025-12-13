/**
 * Centralized logging utility
 * Uses Sentry in production, console in development
 */

import { captureMessage, captureException } from './sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger class for centralized logging
 */
class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  /**
   * Log debug message (only in development)
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log info message
   */
  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, ...args);
    } else if (this.isProduction) {
      captureMessage(message, 'info');
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    } else if (this.isProduction) {
      captureMessage(message, 'warning');
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error, context);
    } else if (this.isProduction) {
      if (error instanceof Error) {
        captureException(error, context);
      } else {
        captureMessage(`${message}: ${String(error)}`, 'error');
      }
    }
  }

  /**
   * Log error with context (for compatibility with existing code)
   */
  logError(error: Error | unknown, context?: string): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.error(errorObj.message, errorObj, context ? { context } : undefined);
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Convenience functions for backward compatibility
 */
export const logError = (error: Error | unknown, context?: string) => {
  logger.logError(error, context);
};

export const logInfo = (message: string, ...args: unknown[]) => {
  logger.info(message, ...args);
};

export const logWarn = (message: string, ...args: unknown[]) => {
  logger.warn(message, ...args);
};

export const logDebug = (message: string, ...args: unknown[]) => {
  logger.debug(message, ...args);
};

