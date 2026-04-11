import { describe, it, expect } from 'vitest';
import { formatDate, addTime, dateDiff, isPast, isFuture, isToday, relativeTime, now } from '@/lib/utils/date-utils';

describe('date-utils', () => {
  describe('formatDate', () => {
    it('should format to ISO', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      expect(formatDate(date, 'iso')).toContain('2024-01-15');
    });

    it('should format to US format', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date, 'us')).toBe('1/15/2024');
    });

    it('should format to EU format', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date, 'eu')).toBe('15/1/2024');
    });
  });

  describe('addTime', () => {
    it('should add days', () => {
      const date = new Date('2024-01-01');
      const result = addTime(date, 5, 'days');
      expect(result.getDate()).toBe(6);
    });

    it('should subtract days with negative amount', () => {
      const date = new Date('2024-01-10');
      const result = addTime(date, -5, 'days');
      expect(result.getDate()).toBe(5);
    });

    it('should add months', () => {
      const date = new Date('2024-01-15');
      const result = addTime(date, 2, 'months');
      expect(result.getMonth()).toBe(2); // March (0-indexed)
    });
  });

  describe('dateDiff', () => {
    it('should calculate difference in days', () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-01-11');
      expect(dateDiff(from, to, 'days')).toBe(10);
    });

    it('should calculate difference in hours', () => {
      const from = new Date('2024-01-01T00:00:00');
      const to = new Date('2024-01-01T05:00:00');
      expect(dateDiff(from, to, 'hours')).toBe(5);
    });
  });

  describe('isPast', () => {
    it('should return true for past dates', () => {
      expect(isPast('2020-01-01')).toBe(true);
    });

    it('should return false for future dates', () => {
      expect(isPast('2099-01-01')).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('should return true for future dates', () => {
      expect(isFuture('2099-01-01')).toBe(true);
    });

    it('should return false for past dates', () => {
      expect(isFuture('2020-01-01')).toBe(false);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('should return false for other dates', () => {
      expect(isToday('2020-01-01')).toBe(false);
    });
  });

  describe('relativeTime', () => {
    it('should return relative future time', () => {
      const future = new Date(Date.now() + 60000 * 30); // 30 min from now
      const result = relativeTime(future);
      expect(result).toContain('30 minutes');
    });

    it('should return relative past time', () => {
      const past = new Date(Date.now() - 60000 * 45); // 45 min ago
      const result = relativeTime(past);
      expect(result).toContain('45 minutes ago');
    });
  });

  describe('now', () => {
    it('should return current ISO timestamp', () => {
      const result = now();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
