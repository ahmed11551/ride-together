import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ErrorCode,
  AppErrorClass,
  handleAsyncError,
  handleSyncError,
  getErrorBoundaryFallback,
} from '../error-handler-enhanced';

describe('Enhanced Error Handler', () => {
  describe('AppErrorClass', () => {
    it('should create error with code and message', () => {
      const error = new AppErrorClass(ErrorCode.NETWORK_ERROR, 'Network failed');
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.message).toBe('Network failed');
      expect(error.name).toBe('AppError');
    });

    it('should include context', () => {
      const context = { userId: '123', action: 'fetch' };
      const error = new AppErrorClass(ErrorCode.AUTH_ERROR, 'Auth failed', context);
      expect(error.context).toEqual(context);
    });
  });

  describe('handleAsyncError', () => {
    it('should return result on success', async () => {
      const result = await handleAsyncError(async () => 'success');
      expect(result).toBe('success');
    });

    it('should throw AppErrorClass on failure', async () => {
      await expect(
        handleAsyncError(
          async () => {
            throw new Error('Test error');
          },
          ErrorCode.NETWORK_ERROR
        )
      ).rejects.toThrow(AppErrorClass);
    });
  });

  describe('handleSyncError', () => {
    it('should return result on success', () => {
      const result = handleSyncError(() => 'success');
      expect(result).toBe('success');
    });

    it('should throw AppErrorClass on failure', () => {
      expect(() => {
        handleSyncError(
          () => {
            throw new Error('Test error');
          },
          ErrorCode.VALIDATION_ERROR
        );
      }).toThrow(AppErrorClass);
    });
  });

  describe('getErrorBoundaryFallback', () => {
    it('should return network error message for network errors', () => {
      const error = new Error('Network request failed');
      const fallback = getErrorBoundaryFallback(error);
      expect(fallback.title).toBeDefined();
      expect(fallback.message).toBeDefined();
      expect(fallback.action).toContain('интернет');
    });

    it('should return auth error message for auth errors', () => {
      const error = new Error('Authentication failed');
      const fallback = getErrorBoundaryFallback(error);
      expect(fallback.title).toBeDefined();
      expect(fallback.message).toBeDefined();
    });

    it('should return generic error message for unknown errors', () => {
      const error = new Error('Unknown error');
      const fallback = getErrorBoundaryFallback(error);
      expect(fallback.title).toBeDefined();
      expect(fallback.message).toBeDefined();
      expect(fallback.action).toBeDefined();
    });
  });
});

