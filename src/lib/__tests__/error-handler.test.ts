import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserFriendlyError, logError } from '../error-handler';

describe('error-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserFriendlyError', () => {
    it('should return login error for invalid login', () => {
      const error = new Error('Invalid login');
      const result = getUserFriendlyError(error);
      
      expect(result.title).toBe('Ошибка входа');
      expect(result.description).toBe('Неверный email или пароль');
    });

    it('should return registration error for already registered', () => {
      const error = new Error('User already registered');
      const result = getUserFriendlyError(error);
      
      expect(result.title).toBe('Ошибка регистрации');
      expect(result.description).toBe('Пользователь с таким email уже существует');
    });

    it('should return default error for unknown errors', () => {
      const error = new Error('Some unknown error');
      const result = getUserFriendlyError(error);
      
      expect(result.title).toBe('Произошла ошибка');
      expect(result.description).toBe('Пожалуйста, попробуйте еще раз или обратитесь в поддержку');
    });

    it('should handle string errors', () => {
      const result = getUserFriendlyError('Invalid login');
      
      expect(result.title).toBe('Ошибка входа');
    });

    it('should handle null/undefined errors', () => {
      const result = getUserFriendlyError(null);
      
      expect(result.title).toBe('Произошла ошибка');
    });
  });

  describe('logError', () => {
    it('should log error in development mode', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      
      logError(error, 'test context');
      
      // Wait for async logger import
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // logError uses async import, so it may call console.error in fallback
      // or through logger. Check if it was called at all
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});

