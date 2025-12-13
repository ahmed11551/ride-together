/**
 * Security wrapper for forms
 * Provides input sanitization and validation
 */

import { sanitizeInput, isValidEmail, isValidPhone, isValidText } from '@/lib/security';

/**
 * Sanitizes form data before submission
 */
export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
  const sanitized = { ...data };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key] as string);
    }
  }

  return sanitized;
}

/**
 * Validates email field
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email обязателен' };
  }

  if (!isValidEmail(email)) {
    return { valid: false, error: 'Некорректный формат email' };
  }

  return { valid: true };
}

/**
 * Validates phone field
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || !phone.trim()) {
    return { valid: true }; // Phone is optional
  }

  if (!isValidPhone(phone)) {
    return { valid: false, error: 'Некорректный формат телефона' };
  }

  return { valid: true };
}

/**
 * Validates text field
 */
export function validateTextField(
  text: string,
  fieldName: string,
  minLength = 1,
  maxLength = 1000
): { valid: boolean; error?: string } {
  if (!text || !text.trim()) {
    return { valid: false, error: `${fieldName} обязателен` };
  }

  if (!isValidText(text, minLength, maxLength)) {
    return {
      valid: false,
      error: `${fieldName} должен быть от ${minLength} до ${maxLength} символов`,
    };
  }

  return { valid: true };
}

/**
 * Validates price field
 */
export function validatePrice(price: number | string): { valid: boolean; error?: string } {
  const num = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(num)) {
    return { valid: false, error: 'Цена должна быть числом' };
  }

  if (num < 0) {
    return { valid: false, error: 'Цена не может быть отрицательной' };
  }

  if (num > 1000000) {
    return { valid: false, error: 'Цена слишком большая (максимум 1,000,000 ₽)' };
  }

  return { valid: true };
}

/**
 * Validates seats field
 */
export function validateSeats(seats: number | string): { valid: boolean; error?: string } {
  const num = typeof seats === 'string' ? parseInt(seats, 10) : seats;

  if (isNaN(num)) {
    return { valid: false, error: 'Количество мест должно быть числом' };
  }

  if (num < 1) {
    return { valid: false, error: 'Минимум 1 место' };
  }

  if (num > 10) {
    return { valid: false, error: 'Максимум 10 мест' };
  }

  return { valid: true };
}

