import { describe, it, expect } from 'vitest';
import { pluralize, pluralizeRide, pluralizeSeat, pluralizePassenger, formatCount } from '../pluralize';

describe('pluralize', () => {
  describe('Russian pluralization', () => {
    it('should return singular for 1', () => {
      expect(pluralize(1, ['поездка', 'поездки', 'поездок'])).toBe('поездка');
    });

    it('should return plural for 2-4', () => {
      expect(pluralize(2, ['поездка', 'поездки', 'поездок'])).toBe('поездки');
      expect(pluralize(3, ['поездка', 'поездки', 'поездок'])).toBe('поездки');
      expect(pluralize(4, ['поездка', 'поездки', 'поездок'])).toBe('поездки');
    });

    it('should return genitive plural for 5+', () => {
      expect(pluralize(5, ['поездка', 'поездки', 'поездок'])).toBe('поездок');
      expect(pluralize(10, ['поездка', 'поездки', 'поездок'])).toBe('поездок');
      expect(pluralize(21, ['поездка', 'поездки', 'поездок'])).toBe('поездка');
      expect(pluralize(22, ['поездка', 'поездки', 'поездок'])).toBe('поездки');
      expect(pluralize(25, ['поездка', 'поездки', 'поездок'])).toBe('поездок');
    });

    it('should handle 11-19 correctly', () => {
      expect(pluralize(11, ['поездка', 'поездки', 'поездок'])).toBe('поездок');
      expect(pluralize(15, ['поездка', 'поездки', 'поездок'])).toBe('поездок');
      expect(pluralize(19, ['поездка', 'поездки', 'поездок'])).toBe('поездок');
    });

    it('should handle 0', () => {
      expect(pluralize(0, ['поездка', 'поездки', 'поездок'])).toBe('поездок');
    });

    it('should handle negative numbers', () => {
      expect(pluralize(-1, ['поездка', 'поездки', 'поездок'])).toBe('поездка');
      expect(pluralize(-5, ['поездка', 'поездки', 'поездок'])).toBe('поездок');
    });
  });

  describe('pluralizeRide', () => {
    it('should return correct form for rides', () => {
      expect(pluralizeRide(1)).toBe('поездка');
      expect(pluralizeRide(2)).toBe('поездки');
      expect(pluralizeRide(5)).toBe('поездок');
    });
  });

  describe('pluralizeSeat', () => {
    it('should return correct form for seats', () => {
      expect(pluralizeSeat(1)).toBe('место');
      expect(pluralizeSeat(2)).toBe('места');
      expect(pluralizeSeat(5)).toBe('мест');
    });
  });

  describe('pluralizePassenger', () => {
    it('should return correct form for passengers', () => {
      expect(pluralizePassenger(1)).toBe('пассажир');
      expect(pluralizePassenger(2)).toBe('пассажира');
      expect(pluralizePassenger(5)).toBe('пассажиров');
    });
  });

  describe('formatCount', () => {
    it('should format count with plural form', () => {
      expect(formatCount(1, ['поездка', 'поездки', 'поездок'])).toBe('1 поездка');
      expect(formatCount(2, ['поездка', 'поездки', 'поездок'])).toBe('2 поездки');
      expect(formatCount(5, ['поездка', 'поездки', 'поездок'])).toBe('5 поездок');
    });
  });
});

