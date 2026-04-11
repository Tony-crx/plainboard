export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  sanitized?: string;
}

const MALICIOUS_PATTERNS = [
  // XSS patterns
  { pattern: /<script[^>]*>[\s\S]*?<\/script>/gi, type: 'xss', severity: 'critical' },
  { pattern: /javascript:/gi, type: 'xss', severity: 'high' },
  { pattern: /on\w+\s*=/gi, type: 'xss', severity: 'high' },

  // Code injection
  { pattern: /eval\s*\(/gi, type: 'injection', severity: 'critical' },
  { pattern: /new\s+Function\s*\(/gi, type: 'injection', severity: 'critical' },
  { pattern: /exec\s*\(/gi, type: 'injection', severity: 'high' },
  { pattern: /system\s*\(/gi, type: 'injection', severity: 'high' },

  // Path traversal
  { pattern: /\.\.\//gi, type: 'path_traversal', severity: 'medium' },
  { pattern: /\.\.\\/gi, type: 'path_traversal', severity: 'medium' },

  // SQL injection (basic patterns)
  { pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b.*\b(FROM|INTO|TABLE|WHERE)\b)/gi, type: 'sql_injection', severity: 'high' },
  { pattern: /(\bOR\b.*=.*)/gi, type: 'sql_injection', severity: 'medium' },

  // Command injection
  { pattern: /[;&|`$(){}[\]]/g, type: 'command_injection', severity: 'medium' },
];

const MAX_LENGTH = 10000;
const MIN_LENGTH = 1;

export function validateInput(input: string, options?: {
  allowHtml?: boolean;
  allowCode?: boolean;
  maxLength?: number;
}): ValidationResult {
  const errors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let sanitized = input;

  const maxLength = options?.maxLength || MAX_LENGTH;

  // Length validation
  if (input.length > maxLength) {
    errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    riskLevel = 'medium';
  }

  if (input.length < MIN_LENGTH) {
    errors.push(`Input must be at least ${MIN_LENGTH} character`);
    riskLevel = 'low';
  }

  // Pattern matching
  for (const { pattern, type, severity } of MALICIOUS_PATTERNS) {
    if (pattern.test(input)) {
      // Skip certain patterns if HTML or code is allowed
      if (type === 'xss' && options?.allowHtml) continue;
      if (type === 'injection' && options?.allowCode) continue;

      errors.push(`Potential ${type} detected`);

      if (severity === 'critical') {
        riskLevel = 'critical';
      } else if (severity === 'high' && riskLevel !== 'critical') {
        riskLevel = 'high';
      } else if (severity === 'medium' && !['critical', 'high'].includes(riskLevel)) {
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      }
    }
  }

  // Sanitize input
  if (options?.allowHtml) {
    // Basic HTML sanitization - remove script tags and event handlers
    sanitized = input
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  } else {
    // Strip all HTML
    sanitized = input.replace(/<[^>]*>/g, '');
  }

  return {
    isValid: errors.length === 0,
    errors,
    riskLevel,
    sanitized
  };
}

export function sanitizeOutput(output: string): string {
  // Basic output sanitization
  return output
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function validateAgentName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name) && name.length <= 50;
}

export function validateModelName(model: string): boolean {
  return /^[a-zA-Z0-9_\/:\-\.]+$/.test(model) && model.length <= 100;
}

// Legacy class-based API for backward compatibility
export class InputValidator {
  static validate(input: string): {
    valid: boolean;
    isValid: boolean;
    sanitized: string;
    risk: 'low' | 'medium' | 'high';
    error?: string;
  } {
    const result = validateInput(input);
    return {
      valid: result.isValid,
      isValid: result.isValid,
      sanitized: result.sanitized || input,
      risk: result.riskLevel === 'critical' ? 'high' : result.riskLevel,
      error: result.errors.length > 0 ? result.errors.join(', ') : undefined
    };
  }

  static sanitize(input: string): string {
    const result = validateInput(input);
    return result.sanitized || input;
  }
}
