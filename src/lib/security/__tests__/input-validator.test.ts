import { describe, it, expect } from 'vitest';
import { InputValidator } from '@/lib/security/input-validator';

describe('InputValidator', () => {
  describe('validate', () => {
    it('should accept valid input', () => {
      const result = InputValidator.validate('Hello, this is a valid message');
      expect(result.valid).toBe(true);
    });

    it('should reject input exceeding max length', () => {
      const longInput = 'a'.repeat(10001);
      const result = InputValidator.validate(longInput);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });

    it('should reject input with eval() pattern', () => {
      const result = InputValidator.validate('eval("malicious code")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous code execution');
    });

    it('should reject input with script tags', () => {
      const result = InputValidator.validate('<script>alert("xss")</script>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous code execution');
    });

    it('should reject input with javascript: protocol', () => {
      const result = InputValidator.validate('javascript:alert(1)');
      expect(result.valid).toBe(false);
    });

    it('should reject input with require()', () => {
      const result = InputValidator.validate('require("fs")');
      expect(result.valid).toBe(false);
    });

    it('should reject input with exec()', () => {
      const result = InputValidator.validate('exec("rm -rf /")');
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitize', () => {
    it('should escape HTML entities', () => {
      const input = '<script>"test"\'s value</script>';
      const sanitized = InputValidator.sanitize(input);
      expect(sanitized).toBe('&lt;script&gt;&quot;test&quot;&#x27;s value&lt;/script&gt;');
    });

    it('should handle empty string', () => {
      const sanitized = InputValidator.sanitize('');
      expect(sanitized).toBe('');
    });
  });
});
