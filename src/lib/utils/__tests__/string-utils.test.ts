import { describe, it, expect } from 'vitest';
import {
  toCamelCase, toSnakeCase, toKebabCase, toTitleCase,
  truncate, extractUrls, extractEmails, extractHashtags,
  countWords, countLines, slugify, isEmpty, stripHtml, escapeRegex
} from '@/lib/utils/string-utils';

describe('string-utils', () => {
  describe('toCamelCase', () => {
    it('should convert hello world to helloWorld', () => {
      expect(toCamelCase('hello world')).toBe('helloWorld');
    });
    it('should convert Hello World to helloWorld', () => {
      expect(toCamelCase('Hello World')).toBe('helloWorld');
    });
  });

  describe('toSnakeCase', () => {
    it('should convert helloWorld to hello_world', () => {
      expect(toSnakeCase('helloWorld')).toBe('hello_world');
    });
    it('should convert Hello World to hello_world', () => {
      expect(toSnakeCase('Hello World')).toBe('hello_world');
    });
  });

  describe('toKebabCase', () => {
    it('should convert helloWorld to hello-world', () => {
      expect(toKebabCase('helloWorld')).toBe('hello-world');
    });
  });

  describe('toTitleCase', () => {
    it('should convert hello world to Hello World', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });
    it('should not truncate short strings', () => {
      expect(truncate('hi', 10)).toBe('hi');
    });
  });

  describe('extractUrls', () => {
    it('should extract URLs from text', () => {
      const text = 'Visit https://example.com and http://test.org/path';
      const urls = extractUrls(text);
      expect(urls).toHaveLength(2);
      expect(urls).toContain('https://example.com');
    });
  });

  describe('extractEmails', () => {
    it('should extract email addresses', () => {
      const text = 'Contact user@example.com or admin@test.org';
      const emails = extractEmails(text);
      expect(emails).toHaveLength(2);
    });
  });

  describe('extractHashtags', () => {
    it('should extract hashtags', () => {
      const text = 'Love #javascript and #coding';
      const tags = extractHashtags(text);
      expect(tags).toHaveLength(2);
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      expect(countWords('hello world')).toBe(2);
      expect(countWords('  hello   world  ')).toBe(2);
      expect(countWords('')).toBe(0);
    });
  });

  describe('countLines', () => {
    it('should count lines correctly', () => {
      expect(countLines('line1\nline2\nline3')).toBe(3);
      expect(countLines('single line')).toBe(1);
    });
  });

  describe('slugify', () => {
    it('should create valid slugs', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
    });
  });

  describe('isEmpty', () => {
    it('should detect empty strings', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('hello')).toBe(false);
    });
  });

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
    });
  });

  describe('escapeRegex', () => {
    it('should escape special regex characters', () => {
      expect(escapeRegex('hello.world')).toBe('hello\\.world');
      expect(escapeRegex('test*case')).toBe('test\\*case');
    });
  });
});
