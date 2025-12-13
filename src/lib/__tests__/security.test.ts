import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isValidText,
  escapeHtml,
  isValidUUID,
  isValidPrice,
  isValidDate,
  isValidSeats,
  RateLimiter,
} from '../security';

describe('Security Utilities', () => {
  describe('sanitizeInput', () => {
    it('should remove dangerous HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeInput('Hello <b>world</b>')).toBe('Hello bworld/b');
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
    });

    it('should remove event handlers', () => {
      expect(sanitizeInput('onclick="alert(1)"')).toBe('="alert(1)"');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeInput(null as unknown as string)).toBe('');
      expect(sanitizeInput(undefined as unknown as string)).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should handle non-string input', () => {
      expect(isValidEmail(null as unknown as string)).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhone('+79991234567')).toBe(true);
      expect(isValidPhone('79991234567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abc')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('isValidText', () => {
    it('should validate text within length limits', () => {
      expect(isValidText('Hello', 1, 10)).toBe(true);
      expect(isValidText('A', 1, 10)).toBe(true);
    });

    it('should reject text outside length limits', () => {
      expect(isValidText('', 1, 10)).toBe(false);
      expect(isValidText('This is too long text', 1, 5)).toBe(false);
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('"quotes"')).toBe('&quot;quotes&quot;');
      expect(escapeHtml("'apostrophe'")).toBe('&#039;apostrophe&#039;');
      expect(escapeHtml('&amp;')).toBe('&amp;amp;');
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123')).toBe(false);
    });
  });

  describe('isValidPrice', () => {
    it('should validate correct prices', () => {
      expect(isValidPrice(100)).toBe(true);
      expect(isValidPrice('500')).toBe(true);
      expect(isValidPrice(0)).toBe(true);
    });

    it('should reject invalid prices', () => {
      expect(isValidPrice(-100)).toBe(false);
      expect(isValidPrice(2000000)).toBe(false); // Over max
      expect(isValidPrice('invalid')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should validate future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isValidDate(futureDate.toISOString())).toBe(true);
    });

    it('should reject past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isValidDate(pastDate.toISOString())).toBe(false);
    });
  });

  describe('isValidSeats', () => {
    it('should validate correct seat counts', () => {
      expect(isValidSeats(1)).toBe(true);
      expect(isValidSeats(5)).toBe(true);
      expect(isValidSeats(10)).toBe(true);
    });

    it('should reject invalid seat counts', () => {
      expect(isValidSeats(0)).toBe(false);
      expect(isValidSeats(11)).toBe(false);
      expect(isValidSeats(-1)).toBe(false);
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter(5, 1000);
      expect(limiter.isAllowed('test-key')).toBe(true);
      expect(limiter.isAllowed('test-key')).toBe(true);
      expect(limiter.isAllowed('test-key')).toBe(true);
    });

    it('should block requests over limit', () => {
      const limiter = new RateLimiter(2, 1000);
      expect(limiter.isAllowed('test-key')).toBe(true);
      expect(limiter.isAllowed('test-key')).toBe(true);
      expect(limiter.isAllowed('test-key')).toBe(false);
    });

    it('should reset rate limit', () => {
      const limiter = new RateLimiter(1, 1000);
      expect(limiter.isAllowed('test-key')).toBe(true);
      expect(limiter.isAllowed('test-key')).toBe(false);
      limiter.reset('test-key');
      expect(limiter.isAllowed('test-key')).toBe(true);
    });
  });
});

