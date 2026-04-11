// Bundled skills -- pre-installed skills for CortisolBoard

import { globalSkillRegistry } from './skill-registry';
import type { Skill } from './types';

function registerSkill(skill: Skill) {
  globalSkillRegistry.register(skill);
}

// ===================== CODE REVIEW SKILL =====================
registerSkill({
  id: 'bundled-code-review',
  frontmatter: {
    name: 'code-review',
    description: 'Review code for bugs, security issues, and best practices. Use when asked to review code.',
    whenToUse: 'When user asks to review, audit, or analyze code quality',
    allowedTools: ['web_search', 'file_read', 'code_analyze'],
    argumentHint: '<file_or_directory>',
    context: 'inline',
    effort: 'high',
    userInvocable: true,
  },
  content: `# Code Review Skill

## Instructions
You are performing a thorough code review. Follow these steps:

1. **Read** the target file(s)
2. **Analyze** for:
   - Logic bugs and edge cases
   - Security vulnerabilities (XSS, injection, auth bypass)
   - Performance issues (N+1 queries, memory leaks, unnecessary re-renders)
   - Code style and maintainability
3. **Report** findings with:
   - Severity level (Critical, Warning, Info)
   - File:line reference
   - Suggested fix

## Format
\`\`\`
### 🔴 Critical
- **file.ts:42** - Description of issue
  → Fix: suggested solution

### 🟡 Warning
...

### 🟢 Info
...
\`\`\`

Target: {{target}}`,
  source: 'bundled',
  filePath: 'bundled/code-review/SKILL.md',
});

// ===================== ARCHITECT SKILL =====================
registerSkill({
  id: 'bundled-architect',
  frontmatter: {
    name: 'architect',
    description: 'Design system architecture before implementation. Use for complex features.',
    whenToUse: 'When building complex features that need architectural planning',
    allowedTools: ['web_search', 'file_read'],
    argumentHint: '<feature_description>',
    context: 'inline',
    effort: 'high',
    userInvocable: true,
  },
  content: `# Architect Skill

## Instructions
Design a complete architecture for the requested feature:

1. **Analyze** requirements from: {{feature}}
2. **Research** existing patterns in the codebase
3. **Design**:
   - Component hierarchy
   - Data flow
   - API contracts
   - State management strategy
   - File structure
4. **Consider**:
   - Scalability
   - Error handling
   - Edge cases
   - Testing strategy

## Output Format
\`\`\`markdown
# Architecture: {{feature}}

## Overview
...

## Component Design
...

## Data Flow
...

## File Structure
\`\`\`
`,
  source: 'bundled',
  filePath: 'bundled/architect/SKILL.md',
});

// ===================== DEBUG SKILL =====================
registerSkill({
  id: 'bundled-debug',
  frontmatter: {
    name: 'debug',
    description: 'Systematic debugging workflow. Use when something is broken.',
    whenToUse: 'When user reports a bug or asks to debug',
    allowedTools: ['web_search', 'file_read', 'terminal_ops'],
    argumentHint: '<error_or_symptom>',
    context: 'inline',
    effort: 'medium',
    userInvocable: true,
  },
  content: `# Debug Skill

## Workflow
Follow systematic debugging methodology:

1. **Reproduce** the issue from description: {{error}}
2. **Isolate** - find the minimal reproduction
3. **Trace** - follow the execution path
4. **Identify** root cause
5. **Fix** with minimal change
6. **Verify** the fix works

## Rules
- Never guess -- verify with actual code/logs
- Check recent changes first
- Look for off-by-one, null checks, race conditions
- Consider environment differences

## Output
\`\`\`
## Root Cause
...

## Fix
\`\`\`diff
- old line
+ new line
\`\`\`

## Verification Steps
1. ...
\`\`\`
`,
  source: 'bundled',
  filePath: 'bundled/debug/SKILL.md',
});

// ===================== DOCUMENT SKILL =====================
registerSkill({
  id: 'bundled-document',
  frontmatter: {
    name: 'document',
    description: 'Generate comprehensive documentation for code, APIs, or systems.',
    whenToUse: 'When asked to document, write docs, or create README',
    allowedTools: ['file_read', 'web_search'],
    argumentHint: '<target>',
    context: 'inline',
    effort: 'medium',
    userInvocable: true,
  },
  content: `# Document Skill

## Instructions
Generate clear, comprehensive documentation:

1. **Read** the target code: {{target}}
2. **Document**:
   - Purpose and overview
   - API reference (functions, params, return types)
   - Usage examples
   - Edge cases and error handling
3. **Format** as Markdown with proper headings and code blocks

## Style
- Concise, no fluff
- Code examples for every public API
- Include type signatures
- Link related documentation
`,
  source: 'bundled',
  filePath: 'bundled/document/SKILL.md',
});

// ===================== SECURITY AUDIT SKILL =====================
registerSkill({
  id: 'bundled-security-audit',
  frontmatter: {
    name: 'security-audit',
    description: 'Comprehensive security audit of codebase. Find vulnerabilities and harden them.',
    whenToUse: 'When asked to audit security, find vulnerabilities, or harden code',
    allowedTools: ['web_search', 'file_read', 'code_analyze', 'network_scanner'],
    argumentHint: '<scope>',
    context: 'fork',
    effort: 'max',
    userInvocable: true,
  },
  content: `# Security Audit Skill

## Scope: {{scope}}

## Audit Checklist
1. **Input Validation** -- XSS, SQL injection, command injection
2. **Authentication** -- JWT validation, session management, CSRF
3. **Authorization** -- RBAC, privilege escalation, IDOR
4. **Data Protection** -- Encryption, secrets in code, PII handling
5. **Network** -- TLS, CORS, SSRF
6. **Dependencies** -- Known CVEs, outdated packages
7. **Configuration** -- Default credentials, debug endpoints

## Output
\`\`\`
### 🔴 Critical Vulnerabilities
| Location | Issue | CVSS | Fix |
|----------|-------|------|-----|

### 🟡 Warnings
...

### 🟢 Hardening Recommendations
...
\`\`\`
`,
  source: 'bundled',
  filePath: 'bundled/security-audit/SKILL.md',
});

// ===================== TEST SKILL =====================
registerSkill({
  id: 'bundled-test',
  frontmatter: {
    name: 'test',
    description: 'Write comprehensive test suites for code coverage.',
    whenToUse: 'When asked to write tests, create test suite, or improve coverage',
    allowedTools: ['file_read', 'file_write', 'terminal_ops'],
    argumentHint: '<file_or_module>',
    context: 'inline',
    effort: 'medium',
    userInvocable: true,
  },
  content: `# Test Skill

## Instructions
Write comprehensive tests for: {{target}}

1. **Identify** all public APIs and edge cases
2. **Write** tests covering:
   - Happy path
   - Edge cases (empty, null, boundary values)
   - Error paths
   - Integration scenarios
3. **Follow** existing test patterns in the project

## Coverage Target
- Aim for >80% line coverage
- 100% branch coverage on critical paths
`,
  source: 'bundled',
  filePath: 'bundled/test/SKILL.md',
});

// ===================== OPTIMIZE SKILL =====================
registerSkill({
  id: 'bundled-optimize',
  frontmatter: {
    name: 'optimize',
    description: 'Identify and fix performance bottlenecks.',
    whenToUse: 'When asked to optimize, improve performance, or speed up',
    allowedTools: ['file_read', 'code_analyze', 'terminal_ops'],
    argumentHint: '<target>',
    context: 'inline',
    effort: 'high',
    userInvocable: true,
  },
  content: `# Optimize Skill

## Instructions
Find and fix performance issues in: {{target}}

1. **Profile** -- identify hot paths and bottlenecks
2. **Analyze** -- Big-O complexity, unnecessary re-renders, N+1 patterns
3. **Optimize** -- memoization, batching, lazy loading, indexing
4. **Verify** -- measure improvement

## Focus Areas
- React: useMemo, useCallback, virtualization
- API: caching, pagination, batching
- DB: indexing, query optimization
- Network: compression, CDN, connection pooling
`,
  source: 'bundled',
  filePath: 'bundled/optimize/SKILL.md',
});
