/**
 * Security utilities for data validation and sanitization
 */

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates phone number format (Russian format)
 */
export function isValidPhone(phone: string): boolean {
  if (typeof phone !== 'string') {
    return false;
  }

  // Russian phone format: +7 (XXX) XXX-XX-XX or similar
  // Must start with +7 or 7 and have at least 10 digits total
  const phoneRegex = /^\+?7\d{10}$/;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return phoneRegex.test(cleaned);
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a string is not empty and has reasonable length
 */
export function isValidText(text: string, minLength = 1, maxLength = 10000): boolean {
  if (typeof text !== 'string') {
    return false;
  }

  const trimmed = text.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}

/**
 * Escapes HTML special characters
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Validates UUID format
 */
export function isValidUUID(uuid: string): boolean {
  if (typeof uuid !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates price (positive number)
 */
export function isValidPrice(price: number | string): boolean {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(num) && num >= 0 && num <= 1000000; // Max 1 million
}

/**
 * Validates date string
 */
export function isValidDate(dateString: string): boolean {
  if (typeof dateString !== 'string') {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date > new Date(); // Must be in the future
}

/**
 * Validates seats count
 */
export function isValidSeats(seats: number | string): boolean {
  const num = typeof seats === 'string' ? parseInt(seats, 10) : seats;
  return !isNaN(num) && num >= 1 && num <= 10; // 1-10 seats
}

/**
 * Rate limiting helper (client-side, basic)
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const recentRequests = requests.filter((time) => now - time < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * Global rate limiter instance
 */
export const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

