import { describe, it, expect, beforeEach } from 'vitest';
import { KeyManager } from '@/lib/llm/key-manager';

describe('KeyManager', () => {
  describe('getNextKey', () => {
    it('should return the first key when none are rate-limited', () => {
      const manager = new KeyManager('key1,key2,key3');
      const key = manager.getNextKey();
      expect(key).toBe('key1');
    });

    it('should rotate through keys in round-robin fashion', () => {
      const manager = new KeyManager('key1,key2,key3');
      expect(manager.getNextKey()).toBe('key1');
      expect(manager.getNextKey()).toBe('key2');
      expect(manager.getNextKey()).toBe('key3');
    });

    it('should throw error when no keys are provided', () => {
      const manager = new KeyManager('');
      expect(() => manager.getNextKey()).toThrow('No API keys found');
    });

    it('should throw error when all keys are rate-limited', () => {
      const manager = new KeyManager('key1,key2');
      manager.getNextKey(); // key1
      manager.reportRateLimit('key1');
      manager.getNextKey(); // key2
      manager.reportRateLimit('key2');

      expect(() => manager.getNextKey()).toThrow('All API keys are currently rate-limited');
    });

    it('should skip rate-limited keys and return available ones', () => {
      const manager = new KeyManager('key1,key2,key3');
      manager.getNextKey(); // key1
      manager.reportRateLimit('key1');

      const key = manager.getNextKey();
      expect(key).toBe('key2');
    });
  });

  describe('reportRateLimit', () => {
    it('should mark a key as rate-limited', () => {
      const manager = new KeyManager('key1,key2');
      manager.reportRateLimit('key1');

      expect(() => manager.getNextKey()).not.toThrow();
    });

    it('should not affect non-existent keys', () => {
      const manager = new KeyManager('key1,key2');
      manager.reportRateLimit('nonexistent');
      // Should still work normally
      expect(manager.getNextKey()).toBe('key1');
    });
  });
});
