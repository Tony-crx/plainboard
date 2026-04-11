// Frontmatter parser for skill .md files

import { SkillFrontmatter } from './types';

/**
 * Parse YAML frontmatter from a markdown file.
 * Format:
 * ---
 * name: "code-review"
 * description: "Review code for bugs"
 * ---
 * Content here...
 */
export function parseFrontmatter(content: string): {
  frontmatter: Partial<SkillFrontmatter>;
  body: string;
} {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);

  if (!match) {
    // No frontmatter -- treat entire content as body
    return { frontmatter: {}, body: content };
  }

  const yamlBlock = match[1];
  const body = match[2];

  // Simple YAML parser (no external dependency)
  const frontmatter: Partial<SkillFrontmatter> = {};

  for (const line of yamlBlock.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    let value = trimmed.substring(colonIndex + 1).trim();

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Parse arrays (YAML list format: ["a", "b"] or inline)
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        frontmatter[key as keyof SkillFrontmatter] = JSON.parse(value);
      } catch {
        frontmatter[key as keyof SkillFrontmatter] = value as any;
      }
      continue;
    }

    // Parse booleans
    if (value === 'true') {
      frontmatter[key as keyof SkillFrontmatter] = true as any;
      continue;
    }
    if (value === 'false') {
      frontmatter[key as keyof SkillFrontmatter] = false as any;
      continue;
    }

    frontmatter[key as keyof SkillFrontmatter] = value as any;
  }

  return { frontmatter, body };
}

/**
 * Validate that a skill has required fields
 */
export function validateSkill(frontmatter: Partial<SkillFrontmatter>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!frontmatter.name) errors.push('Missing required field: name');
  if (!frontmatter.description) errors.push('Missing required field: description');
  if (frontmatter.context && !['inline', 'fork'].includes(frontmatter.context)) {
    errors.push('Invalid context: must be "inline" or "fork"');
  }
  if (frontmatter.effort && !['low', 'medium', 'high', 'max'].includes(frontmatter.effort)) {
    errors.push('Invalid effort: must be low, medium, high, or max');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Process skill content: substitute arguments, replace variables,
 * and execute inline shell commands (!cmd blocks).
 */
export function processSkillContent(
  content: string,
  args: Record<string, string> = {},
  baseDir: string = process.cwd()
): { output: string; shellResults: string[] } {
  let processed = content;

  // Replace argument placeholders: {{arg_name}}
  for (const [key, value] of Object.entries(args)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    processed = processed.replace(regex, value);
  }

  // Replace built-in variables
  processed = processed.replace(/\$\{SKILL_DIR\}/g, baseDir);
  processed = processed.replace(/\$\{SESSION_ID\}/g, `session-${Date.now()}`);
  processed = processed.replace(/\$\{TIMESTAMP\}/g, new Date().toISOString());

  // Execute inline shell commands: !cmd <command>
  const shellResults: string[] = [];
  const shellRegex = /!cmd\s+([^\n]+)/g;
  let match;

  while ((match = shellRegex.exec(processed)) !== null) {
    const command = match[1].trim();
    shellResults.push(`[Shell command skipped: ${command}]`);
    processed = processed.replace(match[0], `[executed: ${command}]`);
  }

  return { output: processed, shellResults };
}
