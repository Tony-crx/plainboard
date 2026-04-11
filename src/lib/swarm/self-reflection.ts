// Agent Self-Reflection -- critique own output before sending
// Inspired by Claude Code's verification patterns

import { Message } from '@/lib/swarm/types';

export interface ReflectionResult {
  originalContent: string;
  improvedContent: string;
  issues: ReflectionIssue[];
  score: number; // 0-100
  needsRevision: boolean;
}

export interface ReflectionIssue {
  type: 'accuracy' | 'completeness' | 'clarity' | 'safety' | 'tone';
  description: string;
  severity: 'minor' | 'moderate' | 'critical';
  suggestion: string;
}

const REFLECTION_PROMPT = (content: string) => `You are reviewing your own response for quality. Critique it honestly.

Your response:
${content}

Check for:
1. **Accuracy**: Are there factual errors or hallucinations?
2. **Completeness**: Did you fully answer the question?
3. **Clarity**: Is it clear and well-structured?
4. **Safety**: Does it contain dangerous instructions, secrets, or harmful content?
5. **Tone**: Is the tone appropriate for the context?

For each issue found, describe it and suggest a fix.
Then provide an improved version.

Format your response as:
SCORE: <0-100>
ISSUES: <list or "none">
IMPROVED: <revised content or "no changes needed">`;

export function createReflectionPrompt(content: string): string {
  return REFLECTION_PROMPT(content);
}

export function parseReflectionResult(response: string, originalContent: string): ReflectionResult {
  const issues: ReflectionIssue[] = [];
  let score = 80;
  let improvedContent = originalContent;

  // Parse score
  const scoreMatch = response.match(/SCORE:\s*(\d+)/);
  if (scoreMatch) {
    score = parseInt(scoreMatch[1], 10);
  }

  // Parse issues
  const issuesMatch = response.match(/ISSUES:\s*([\s\S]*?)(?=IMPROVED:|$)/);
  if (issuesMatch && issuesMatch[1].trim().toLowerCase() !== 'none') {
    const lines = issuesMatch[1].trim().split('\n');
    for (const line of lines) {
      if (line.trim() && !line.startsWith('---')) {
        issues.push({
          type: 'clarity',
          description: line.trim(),
          severity: 'moderate',
          suggestion: 'Revise for clarity',
        });
      }
    }
  }

  // Parse improved content
  const improvedMatch = response.match(/IMPROVED:\s*([\s\S]*)$/);
  if (improvedMatch && improvedMatch[1].trim().toLowerCase() !== 'no changes needed') {
    improvedContent = improvedMatch[1].trim();
  }

  return {
    originalContent,
    improvedContent,
    issues,
    score,
    needsRevision: score < 70 || issues.some(i => i.severity === 'critical'),
  };
}

export function shouldReflect(message: Message): boolean {
  // Reflect on code, security, and complex responses
  const content = message.content || '';
  if (!content) return false;

  // Reflect on long responses
  if (content.length > 500) return true;

  // Reflect on code blocks
  if (content.includes('```') && content.split('```').length > 2) return true;

  // Reflect on security-related content
  if (/security|vulnerab|exploit|attack|injection|XSS|CSRF/i.test(content)) return true;

  return false;
}
