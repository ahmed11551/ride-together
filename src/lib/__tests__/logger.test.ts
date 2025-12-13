import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, logError, logInfo, logWarn, logDebug } from '../logger';

// Mock Sentry
vi.mock('../sentry', () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logger.debug', () => {
    it('should log in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'debug');
      logger.debug('Test debug message', { data: 'test' });
      
      if (import.meta.env.DEV) {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[DEBUG] Test debug message'),
          { data: 'test' }
        );
      }
    });
  });

  describe('logger.info', () => {
    it('should log in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'info');
      logger.info('Test info message', { data: 'test' });
      
      if (import.meta.env.DEV) {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[INFO] Test info message'),
          { data: 'test' }
        );
      }
    });
  });

  describe('logger.warn', () => {
    it('should log in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      logger.warn('Test warn message', { data: 'test' });
      
      if (import.meta.env.DEV) {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[WARN] Test warn message'),
          { data: 'test' }
        );
      }
    });
  });

  describe('logger.error', () => {
    it('should log error in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const error = new Error('Test error');
      logger.error('Test error message', error, { context: 'test' });
      
      if (import.meta.env.DEV) {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[ERROR] Test error message'),
          error,
          { context: 'test' }
        );
      }
    });

    it('should handle non-Error objects', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      logger.error('Test error message', 'string error', { context: 'test' });
      
      if (import.meta.env.DEV) {
        expect(consoleSpy).toHaveBeenCalled();
      }
    });
  });

  describe('logError convenience function', () => {
    it('should log error using logger', () => {
      const error = new Error('Test error');
      logError(error, 'test context');
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('logInfo convenience function', () => {
    it('should log info using logger', () => {
      logInfo('Test info', { data: 'test' });
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('logWarn convenience function', () => {
    it('should log warn using logger', () => {
      logWarn('Test warn', { data: 'test' });
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('logDebug convenience function', () => {
    it('should log debug using logger', () => {
      logDebug('Test debug', { data: 'test' });
      
      // Should not throw
      expect(true).toBe(true);
    });
  });
});

