import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema, createRideSchema } from '../validation';

describe('validation schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      expect(() => loginSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123',
      };
      
      expect(() => loginSchema.parse(data)).toThrow();
    });

    it('should reject short password', () => {
      const data = {
        email: 'test@example.com',
        password: '12345',
      };
      
      expect(() => loginSchema.parse(data)).toThrow();
    });
  });

  describe('signupSchema', () => {
    it('should validate correct signup data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
      };
      
      expect(() => signupSchema.parse(data)).not.toThrow();
    });

    it('should reject short name', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'J',
      };
      
      expect(() => signupSchema.parse(data)).toThrow();
    });
  });

  describe('createRideSchema', () => {
    it('should validate correct ride data', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const data = {
        from_city: 'Moscow',
        to_city: 'Saint Petersburg',
        departure_date: tomorrow.toISOString().split('T')[0],
        departure_time: '08:00',
        price: '1500',
        seats_total: '4',
        seats_available: '3',
        allow_smoking: false,
        allow_pets: false,
        allow_music: true,
      };
      
      expect(() => createRideSchema.parse(data)).not.toThrow();
    });

    it('should reject past date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const data = {
        from_city: 'Moscow',
        to_city: 'Saint Petersburg',
        departure_date: yesterday.toISOString().split('T')[0],
        departure_time: '08:00',
        price: '1500',
        seats_total: '4',
        seats_available: '3',
        allow_smoking: false,
        allow_pets: false,
        allow_music: true,
      };
      
      expect(() => createRideSchema.parse(data)).toThrow();
    });

    it('should reject invalid price', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const data = {
        from_city: 'Moscow',
        to_city: 'Saint Petersburg',
        departure_date: tomorrow.toISOString().split('T')[0],
        departure_time: '08:00',
        price: '0',
        seats_total: '4',
        seats_available: '3',
        allow_smoking: false,
        allow_pets: false,
        allow_music: true,
      };
      
      expect(() => createRideSchema.parse(data)).toThrow();
    });

    it('should reject when seats_available > seats_total', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const data = {
        from_city: 'Moscow',
        to_city: 'Saint Petersburg',
        departure_date: tomorrow.toISOString().split('T')[0],
        departure_time: '08:00',
        price: '1500',
        seats_total: '4',
        seats_available: '5',
        allow_smoking: false,
        allow_pets: false,
        allow_music: true,
      };
      
      expect(() => createRideSchema.parse(data)).toThrow();
    });
  });
});

