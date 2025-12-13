/**
 * Enhanced error handling for application-level errors
 * Provides centralized error handling, logging, and user feedback
 */

import { logError, getUserFriendlyError } from './error-handler';
import { captureException, captureMessage } from './sentry';

export interface AppError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  userId?: string;
}

/**
 * Error codes for different error types
 */
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for application errors
 */
export class AppErrorClass extends Error {
  code: ErrorCode;
  context?: Record<string, unknown>;
  userId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    context?: Record<string, unknown>,
    userId?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.userId = userId;
  }
}

/**
 * Error handler for async operations
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const appError = new AppErrorClass(
      errorCode,
      error instanceof Error ? error.message : String(error),
      context
    );
    
    logError(appError, context ? JSON.stringify(context) : undefined);
    
    // Send to Sentry
    captureException(appError, { ...context, errorCode: errorCode });
    
    throw appError;
  }
}

/**
 * Error handler for sync operations
 */
export function handleSyncError<T>(
  operation: () => T,
  errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  context?: Record<string, unknown>
): T {
  try {
    return operation();
  } catch (error) {
    const appError = new AppErrorClass(
      errorCode,
      error instanceof Error ? error.message : String(error),
      context
    );
    
    logError(appError, context ? JSON.stringify(context) : undefined);
    
    // Send to Sentry
    captureException(appError, { ...context, errorCode: errorCode });
    
    throw appError;
  }
}

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'Unhandled Promise Rejection');
    
    // Send to Sentry
    if (event.reason instanceof Error) {
      captureException(event.reason, { type: 'unhandledRejection' });
    } else {
      captureMessage(`Unhandled Promise Rejection: ${String(event.reason)}`, 'error');
    }
    
    // Prevent default browser error handling
    event.preventDefault();
    
    // Show user-friendly error
    const friendlyError = getUserFriendlyError(event.reason);
    console.error('Unhandled error:', friendlyError);
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, 'Global Error Handler');
    
    // Send to Sentry
    if (event.error) {
      captureException(event.error, { type: 'globalError' });
    } else {
      captureMessage(`Global Error: ${event.message}`, 'error');
    }
    
    // Show user-friendly error
    const friendlyError = getUserFriendlyError(event.error || event.message);
    console.error('Global error:', friendlyError);
  });
}

/**
 * Error boundary helper for React components
 */
export function getErrorBoundaryFallback(error: Error): {
  title: string;
  message: string;
  action?: string;
} {
  const friendlyError = getUserFriendlyError(error);
  
  // Determine action based on error type
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return {
      title: friendlyError.title,
      message: friendlyError.description,
      action: 'Проверьте подключение к интернету и обновите страницу',
    };
  }

  if (error.message.includes('auth') || error.message.includes('login')) {
    return {
      title: friendlyError.title,
      message: friendlyError.description,
      action: 'Попробуйте войти заново',
    };
  }

  return {
    title: friendlyError.title,
    message: friendlyError.description,
    action: 'Обновите страницу или обратитесь в поддержку',
  };
}

