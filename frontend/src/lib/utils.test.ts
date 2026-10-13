import { formatCurrency, formatDate, cn } from './utils';

describe('Frontend Utils', () => {
  describe('formatCurrency', () => {
    it('formats millions correctly with abbreviation', () => {
      expect(formatCurrency(2500000, 'USD')).toBe('$2.50M');
      expect(formatCurrency(1000000, 'EUR')).toBe('€1.00M');
    });

    it('formats thousands correctly with abbreviation', () => {
      expect(formatCurrency(85000, 'USD')).toBe('$85.0K');
      expect(formatCurrency(4500, 'GBP')).toBe('£4.5K');
    });

    it('formats amounts under a thousand with exact value', () => {
      expect(formatCurrency(500, 'USD')).toBe('$500');
    });

    it('handles unknown currencies by appending currency code', () => {
      expect(formatCurrency(1500, 'XYZ')).toBe('XYZ 1.5K');
    });
  });

  describe('formatDate', () => {
    it('returns "-" for empty or invalid dates', () => {
      expect(formatDate('')).toBe('-');
    });

    it('formats ISO dates correctly into month, day, year', () => {
      const formatted = formatDate('2024-05-15T00:00:00Z');
      expect(formatted).toMatch(/May 15, 2024/);
    });
  });

  describe('cn', () => {
    it('combines truthy classes and ignores falsy values', () => {
      expect(cn('btn', false && 'hidden', null, undefined, 'btn-primary')).toBe('btn btn-primary');
    });
  });
});
