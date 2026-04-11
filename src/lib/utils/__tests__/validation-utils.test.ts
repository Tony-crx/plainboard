import { describe, it, expect } from 'vitest';
import { validateValue, validateObject, coerceType, cleanObject, hasAllRequiredFields } from '@/lib/utils/validation-utils';

describe('validation-utils', () => {
  describe('validateValue', () => {
    it('should validate required fields', () => {
      expect(validateValue('', [{ type: 'required' }], 'name').valid).toBe(false);
      expect(validateValue(null, [{ type: 'required' }], 'name').valid).toBe(false);
      expect(validateValue('hello', [{ type: 'required' }], 'name').valid).toBe(true);
    });

    it('should validate minLength', () => {
      const result = validateValue('hi', [{ type: 'minLength', value: 5 }], 'pwd');
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('at least 5');
    });

    it('should validate maxLength', () => {
      const result = validateValue('this is way too long', [{ type: 'maxLength', value: 5 }], 'code');
      expect(result.valid).toBe(false);
    });

    it('should validate min/max numbers', () => {
      expect(validateValue(5, [{ type: 'min', value: 0 }, { type: 'max', value: 10 }], 'num').valid).toBe(true);
      expect(validateValue(15, [{ type: 'max', value: 10 }], 'num').valid).toBe(false);
    });

    it('should validate enum values', () => {
      const result = validateValue('purple', [{ type: 'enum', value: ['red', 'green', 'blue'] }], 'color');
      expect(result.valid).toBe(false);
    });

    it('should validate email format', () => {
      expect(validateValue('user@example.com', [{ type: 'email' }], 'email').valid).toBe(true);
      expect(validateValue('not-an-email', [{ type: 'email' }], 'email').valid).toBe(false);
    });

    it('should validate URL format', () => {
      expect(validateValue('https://example.com', [{ type: 'url' }], 'url').valid).toBe(true);
      expect(validateValue('not-a-url', [{ type: 'url' }], 'url').valid).toBe(false);
    });

    it('should validate with custom function', () => {
      const result = validateValue(15, [
        { type: 'custom', fn: (v) => v > 18 ? null : 'Must be over 18' }
      ], 'age');
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toBe('Must be over 18');
    });
  });

  describe('validateObject', () => {
    it('should validate multiple fields', () => {
      const schema = {
        name: [{ type: 'required' }],
        email: [{ type: 'required' }, { type: 'email' }],
        age: [{ type: 'min', value: 0 }]
      };

      const validResult = validateObject({ name: 'Alice', email: 'a@b.com', age: 25 }, schema);
      expect(validResult.valid).toBe(true);

      const invalidResult = validateObject({ name: '', email: 'bad', age: -1 }, schema);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('coerceType', () => {
    it('should coerce string to boolean', () => {
      expect(coerceType('true')).toBe(true);
      expect(coerceType('false')).toBe(false);
    });

    it('should coerce string to number', () => {
      expect(coerceType('42')).toBe(42);
      expect(coerceType('3.14')).toBe(3.14);
    });

    it('should coerce null string', () => {
      expect(coerceType('null')).toBe(null);
    });

    it('should keep non-coercible strings', () => {
      expect(coerceType('hello')).toBe('hello');
    });
  });

  describe('cleanObject', () => {
    it('should remove undefined and null values', () => {
      const obj = { a: 1, b: undefined, c: null, d: 'hello' };
      const cleaned = cleanObject(obj);
      expect(cleaned).toEqual({ a: 1, d: 'hello' });
    });
  });

  describe('hasAllRequiredFields', () => {
    it('should detect missing required fields', () => {
      const result = hasAllRequiredFields({ name: 'Alice', age: 30 }, ['name', 'email', 'age']);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('email');
    });

    it('should pass when all fields present', () => {
      const result = hasAllRequiredFields({ name: 'Alice', email: 'a@b.com' }, ['name', 'email']);
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });
  });
});
