import { describe, it, expect } from 'vitest';
import { createRideSchema, loginSchema, signupSchema } from '../validation';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      };
      
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
      };
      
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });
  });

  describe('signupSchema', () => {
    it('should validate correct signup data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Иван Иванов',
      };
      
      expect(() => signupSchema.parse(validData)).not.toThrow();
    });

    it('should reject short full name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'A',
      };
      
      expect(() => signupSchema.parse(invalidData)).toThrow();
    });
  });

  describe('createRideSchema', () => {
    it('should validate correct ride data', () => {
      // Use a future date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];
      
      const validData = {
        from_city: 'Москва',
        to_city: 'Санкт-Петербург',
        departure_date: futureDate,
        departure_time: '10:00',
        price: '1500',
        seats_total: '4',
        seats_available: '4',
        allow_smoking: false,
        allow_pets: false,
        allow_music: false,
      };
      
      expect(() => createRideSchema.parse(validData)).not.toThrow();
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        from_city: 'Москва',
        // Missing to_city
      };
      
      expect(() => createRideSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid price', () => {
      const invalidData = {
        from_city: 'Москва',
        to_city: 'Санкт-Петербург',
        departure_date: '2025-02-01',
        departure_time: '10:00',
        price: '-100', // Negative price
        seats_total: '4',
        seats_available: '4',
      };
      
      expect(() => createRideSchema.parse(invalidData)).toThrow();
    });
  });
});
