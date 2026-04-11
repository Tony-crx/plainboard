/**
 * Schema validation utilities
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation rule types
 */
export type ValidationRule =
  | { type: 'required' }
  | { type: 'minLength'; value: number }
  | { type: 'maxLength'; value: number }
  | { type: 'min'; value: number }
  | { type: 'max'; value: number }
  | { type: 'pattern'; value: RegExp }
  | { type: 'enum'; value: any[] }
  | { type: 'email' }
  | { type: 'url' }
  | { type: 'uuid' }
  | { type: 'custom'; fn: (value: any) => string | null };

/**
 * Validate a single value against rules
 */
export function validateValue(
  value: any,
  rules: ValidationRule[],
  fieldName: string = 'value'
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          errors.push({ field: fieldName, message: `${fieldName} is required` });
        }
        break;

      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          errors.push({ field: fieldName, message: `${fieldName} must be at least ${rule.value} characters` });
        }
        break;

      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          errors.push({ field: fieldName, message: `${fieldName} must be at most ${rule.value} characters` });
        }
        break;

      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          errors.push({ field: fieldName, message: `${fieldName} must be at least ${rule.value}` });
        }
        break;

      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          errors.push({ field: fieldName, message: `${fieldName} must be at most ${rule.value}` });
        }
        break;

      case 'pattern':
        if (typeof value === 'string' && !rule.value.test(value)) {
          errors.push({ field: fieldName, message: `${fieldName} format is invalid` });
        }
        break;

      case 'enum':
        if (!rule.value.includes(value)) {
          errors.push({ field: fieldName, message: `${fieldName} must be one of: ${rule.value.join(', ')}` });
        }
        break;

      case 'email':
        if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push({ field: fieldName, message: `${fieldName} must be a valid email address` });
        }
        break;

      case 'url':
        if (typeof value === 'string') {
          try {
            new URL(value);
          } catch {
            errors.push({ field: fieldName, message: `${fieldName} must be a valid URL` });
          }
        }
        break;

      case 'uuid':
        if (typeof value === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
          errors.push({ field: fieldName, message: `${fieldName} must be a valid UUID` });
        }
        break;

      case 'custom': {
        const error = rule.fn(value);
        if (error) {
          errors.push({ field: fieldName, message: error });
        }
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate an object against a schema
 */
export function validateObject(
  obj: Record<string, any>,
  schema: Record<string, ValidationRule[]>
): ValidationResult {
  const allErrors: ValidationError[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const result = validateValue(obj[field], rules, field);
    allErrors.push(...result.errors);
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

/**
 * Coerce string values to their appropriate types
 */
export function coerceType(value: string): string | number | boolean | null {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === '') return '';

  const num = Number(value);
  if (!isNaN(num) && String(num) === value) return num;

  return value;
}

/**
 * Sanitize object keys (remove undefined/null values)
 */
export function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
  ) as Partial<T>;
}

/**
 * Check if all required fields are present
 */
export function hasAllRequiredFields(
  obj: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(field => {
    const value = obj[field];
    return value === undefined || value === null || value === '';
  });
  return { valid: missing.length === 0, missing };
}
