// PII Detection -- scan text for personal/sensitive data

export interface PIIFinding {
  type: PIIType;
  value: string;
  position: { start: number; end: number };
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'ip_address'
  | 'date_of_birth'
  | 'name'
  | 'address'
  | 'api_key'
  | 'password'
  | 'jwt_token'
  | 'aws_key'
  | 'private_key';

const PII_PATTERNS: Array<{ type: PIIType; regex: RegExp; severity: PIIFinding['severity'] }> = [
  { type: 'email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, severity: 'medium' },
  { type: 'phone', regex: /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, severity: 'high' },
  { type: 'ssn', regex: /\b\d{3}-\d{2}-\d{4}\b/g, severity: 'critical' },
  { type: 'credit_card', regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, severity: 'critical' },
  { type: 'ip_address', regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, severity: 'low' },
  { type: 'api_key', regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?[a-zA-Z0-9]{16,}/gi, severity: 'high' },
  { type: 'password', regex: /(?:password|passwd|pwd)\s*[:=]\s*["']?[^\s"']{4,}/gi, severity: 'critical' },
  { type: 'jwt_token', regex: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, severity: 'high' },
  { type: 'aws_key', regex: /(?:AKIA|ASIA)[a-zA-Z0-9]{16,}/g, severity: 'critical' },
  { type: 'private_key', regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g, severity: 'critical' },
];

export function detectPII(text: string): PIIFinding[] {
  const findings: PIIFinding[] = [];

  for (const pattern of PII_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      findings.push({
        type: pattern.type,
        value: maskPIIValue(match[0], pattern.type),
        position: { start: match.index, end: match.index + match[0].length },
        confidence: 0.9,
        severity: pattern.severity,
      });
    }
  }

  return findings;
}

function maskPIIValue(value: string, type: PIIType): string {
  if (value.length <= 4) return '****';
  const visible = Math.min(2, value.length - 4);
  return value.substring(0, visible) + '****' + value.substring(value.length - visible);
}

export function hasPII(text: string, minSeverity: PIIFinding['severity'] = 'low'): boolean {
  const severityOrder: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
  const threshold = severityOrder[minSeverity];
  const findings = detectPII(text);
  return findings.some(f => severityOrder[f.severity] >= threshold);
}

export function redactPII(text: string): { redacted: string; findings: PIIFinding[] } {
  const findings = detectPII(text);
  if (findings.length === 0) return { redacted: text, findings: [] };

  let redacted = text;
  // Sort by position descending to avoid offset shifts
  const sorted = [...findings].sort((a, b) => b.position.start - a.position.start);

  for (const finding of sorted) {
    const replacement = `[${finding.type.toUpperCase()}_REDACTED]`;
    redacted = redacted.substring(0, finding.position.start) + replacement + redacted.substring(finding.position.end);
  }

  return { redacted, findings };
}
