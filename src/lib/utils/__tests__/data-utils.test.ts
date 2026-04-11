import { describe, it, expect } from 'vitest';
import {
  deepClone, deepMerge, getNestedValue, setNestedValue,
  pick, omit, groupBy, unique, uniqueBy, chunk, shuffle, sortBy,
  isValidJson, safeJsonParse, generateId
} from '@/lib/utils/data-utils';

describe('data-utils', () => {
  describe('deepClone', () => {
    it('should deeply clone an object', () => {
      const original = { a: 1, b: { c: 2, d: [1, 2, 3] } };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });
  });

  describe('deepMerge', () => {
    it('should deeply merge objects', () => {
      const target = { a: 1, b: { c: 2, d: 3 } };
      const source = { b: { c: 10, e: 5 }, f: 6 };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: { c: 10, d: 3, e: 5 }, f: 6 });
    });
  });

  describe('getNestedValue', () => {
    it('should get nested values with dot notation', () => {
      const obj = { user: { profile: { name: 'Alice', age: 30 } } };
      expect(getNestedValue(obj, 'user.profile.name')).toBe('Alice');
      expect(getNestedValue(obj, 'user.profile.age')).toBe(30);
    });

    it('should return undefined for missing paths', () => {
      const obj = { a: 1 };
      expect(getNestedValue(obj, 'b.c')).toBeUndefined();
    });
  });

  describe('setNestedValue', () => {
    it('should set nested values with dot notation', () => {
      const obj: Record<string, any> = {};
      setNestedValue(obj, 'user.profile.name', 'Bob');
      expect(obj.user.profile.name).toBe('Bob');
    });
  });

  describe('pick', () => {
    it('should pick specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });
  });

  describe('omit', () => {
    it('should omit specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
    });
  });

  describe('groupBy', () => {
    it('should group items by key', () => {
      const items = [
        { name: 'Alice', group: 'A' },
        { name: 'Bob', group: 'B' },
        { name: 'Charlie', group: 'A' }
      ];
      const result = groupBy(items, item => item.group);
      expect(result.A).toHaveLength(2);
      expect(result.B).toHaveLength(1);
    });
  });

  describe('unique', () => {
    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('uniqueBy', () => {
    it('should remove duplicates by key', () => {
      const items = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Alice2' }
      ];
      const result = uniqueBy(items, item => item.id);
      expect(result).toHaveLength(2);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = chunk(arr, 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe('shuffle', () => {
    it('should return array of same length', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle(arr);
      expect(result).toHaveLength(5);
      expect([...result].sort()).toEqual([...arr].sort());
    });
  });

  describe('sortBy', () => {
    it('should sort ascending', () => {
      const arr = [{ n: 3 }, { n: 1 }, { n: 2 }];
      const result = sortBy(arr, item => item.n);
      expect(result.map(x => x.n)).toEqual([1, 2, 3]);
    });

    it('should sort descending', () => {
      const arr = [{ n: 3 }, { n: 1 }, { n: 2 }];
      const result = sortBy(arr, item => item.n, 'desc');
      expect(result.map(x => x.n)).toEqual([3, 2, 1]);
    });
  });

  describe('isValidJson', () => {
    it('should validate JSON strings', () => {
      expect(isValidJson('{"a": 1}')).toBe(true);
      expect(isValidJson('[1, 2, 3]')).toBe(true);
      expect(isValidJson('not json')).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"a": 1}', {})).toEqual({ a: 1 });
    });

    it('should return fallback for invalid JSON', () => {
      expect(safeJsonParse('bad', { fallback: true })).toEqual({ fallback: true });
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^id_/);
    });
  });
});
