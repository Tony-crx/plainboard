/**
 * String manipulation utilities
 */

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
      index === 0 ? letter.toLowerCase() : letter.toUpperCase()
    )
    .replace(/[\s\-_]+/g, '');
}

/**
 * Convert string to snake_case
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/[\s.]+/g, '_')
    .replace(/_+/g, '_');
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/[\s_]+/g, '-');
}

/**
 * Convert string to Title Case
 */
export function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Truncate string to max length with ellipsis
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Extract all URLs from a string
 */
export function extractUrls(str: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"'`)\\]+/g;
  return str.match(urlRegex) || [];
}

/**
 * Extract all email addresses from a string
 */
export function extractEmails(str: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return str.match(emailRegex) || [];
}

/**
 * Extract all hashtags from a string
 */
export function extractHashtags(str: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  return str.match(hashtagRegex) || [];
}

/**
 * Count words in a string
 */
export function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Count lines in a string
 */
export function countLines(str: string): number {
  return str.split(/\r?\n/).length;
}

/**
 * Generate a slug from a string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Pad string to fixed width
 */
export function padString(
  str: string,
  width: number,
  padChar: string = ' ',
  align: 'left' | 'right' | 'center' = 'left'
): string {
  if (str.length >= width) return str;
  const padding = width - str.length;

  if (align === 'left') return str + padChar.repeat(padding);
  if (align === 'right') return padChar.repeat(padding) + str;

  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return padChar.repeat(leftPad) + str + padChar.repeat(rightPad);
}

/**
 * Repeat a string n times
 */
export function repeat(str: string, count: number): string {
  return str.repeat(count);
}

/**
 * Reverse a string
 */
export function reverse(str: string): string {
  return str.split('').reverse().join('');
}

/**
 * Remove all whitespace from a string
 */
export function removeWhitespace(str: string): string {
  return str.replace(/\s+/g, '');
}

/**
 * Check if string is empty or whitespace only
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Strip HTML tags from a string
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Escape special regex characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
