/**
 * Cryptographic and encoding utilities
 */

/**
 * Generate a random alphanumeric string
 */
export function randomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random numeric PIN
 */
export function randomPin(length: number = 6): string {
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10).toString();
  }
  return pin;
}

/**
 * Simple hash function (djb2) for non-cryptographic purposes
 */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit
}

/**
 * Base64 encode a string
 */
export function base64Encode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64');
  }
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Base64 decode a string
 */
export function base64Decode(encoded: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }
  return decodeURIComponent(escape(atob(encoded)));
}

/**
 * URL-safe Base64 encode
 */
export function base64UrlEncode(str: string): string {
  return base64Encode(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * URL-safe Base64 decode
 */
export function base64UrlDecode(encoded: string): string {
  let padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4 !== 0) {
    padded += '=';
  }
  return base64Decode(padded);
}

/**
 * Simple XOR cipher (for non-sensitive data obfuscation)
 */
export function xorCipher(str: string, key: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * Mask a string (e.g., API keys, passwords)
 */
export function maskString(str: string, visibleStart: number = 4, visibleEnd: number = 4): string {
  if (str.length <= visibleStart + visibleEnd) {
    return '*'.repeat(str.length);
  }
  const middle = '*'.repeat(str.length - visibleStart - visibleEnd);
  return str.substring(0, visibleStart) + middle + str.substring(str.length - visibleEnd);
}

/**
 * Check if a string looks like a valid email
 */
export function isValidEmail(str: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(str);
}

/**
 * Check if a string looks like a valid URL
 */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a string is a valid hex color
 */
export function isValidHexColor(str: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(str);
}

/**
 * Check if a string is a valid UUID v4
 */
export function isValidUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Compute a simple checksum (sum of char codes mod 65536)
 */
export function checksum(str: string): string {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum = (sum + str.charCodeAt(i)) % 65536;
  }
  return sum.toString(16).padStart(4, '0');
}

/**
 * Convert bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}
