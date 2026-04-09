export class InputValidator {
  private static MAX_INPUT_LENGTH = 10000;
  private static DANGEROUS_PATTERNS = [
    /eval\s*\(/i,
    /exec\s*\(/i,
    /require\s*\(/i,
    /import\s+/i,
    /<script/i,
    /javascript:/i
  ];

  static validate(input: string): { valid: boolean; error?: string } {
    if (input.length > this.MAX_INPUT_LENGTH) {
      return { valid: false, error: `Input exceeds maximum length of ${this.MAX_INPUT_LENGTH}` };
    }

    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(input)) {
        return { valid: false, error: 'Security Filter: Input contains potentially dangerous code execution strings. Request dropped.' };
      }
    }

    return { valid: true };
  }

  static sanitize(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
}
