import { Tool } from '@/lib/swarm/types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Analyze code for issues
 */
export const codeAnalyzeTool: Tool = {
  type: 'function',
  function: {
    name: 'code_analyze',
    description: 'Analyze code for syntax errors, complexity, or issues. Runs linters or syntax checkers based on the detected language.',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Source code to analyze'
        },
        language: {
          type: 'string',
          enum: ['javascript', 'typescript', 'python', 'bash', 'auto'],
          description: 'Programming language (or "auto" to detect)'
        }
      },
      required: ['code']
    }
  },
  execute: async ({ code, language = 'auto' }: { code: string; language?: string }) => {
    try {
      const lines = code.split('\n');
      const issues: string[] = [];

      // Basic static analysis
      if (language === 'auto') {
        if (code.includes('import ') || code.includes('export ')) language = 'javascript';
        if (code.includes('from ') && code.includes('import ') && code.includes(':')) language = 'typescript';
        if (code.includes('def ') || code.includes('import ')) language = 'python';
      }

      // Common issues detection
      const openBraces = (code.match(/\{/g) || []).length;
      const closeBraces = (code.match(/\}/g) || []).length;
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;
      const openBrackets = (code.match(/\[/g) || []).length;
      const closeBrackets = (code.match(/\]/g) || []).length;

      if (openBraces !== closeBraces) issues.push(`Unmatched braces: ${openBraces} opening, ${closeBraces} closing`);
      if (openParens !== closeParens) issues.push(`Unmatched parentheses: ${openParens} opening, ${closeParens} closing`);
      if (openBrackets !== closeBrackets) issues.push(`Unmatched brackets: ${openBrackets} opening, ${closeBrackets} closing`);

      // Language-specific checks
      if (language === 'javascript' || language === 'typescript') {
        if (code.includes('var ')) issues.push('Warning: "var" used instead of "let" or "const"');
        if (code.includes('==') && !code.includes('===')) issues.push('Warning: "==" used instead of "===" (loose equality)');
        if (code.includes('console.log')) issues.push('Info: console.log statements found');
        if (code.includes('eval(')) issues.push('WARNING: eval() detected - potential security risk');
        if (code.includes('any')) issues.push('Info: TypeScript "any" type detected');
      }

      if (language === 'python') {
        const hasTabs = code.includes('\t');
        const has4Spaces = /^ {4}/m.test(code);
        if (hasTabs && has4Spaces) issues.push('Warning: Mixed indentation (tabs and spaces)');
        if (code.includes('print(')) issues.push('Info: print() statements found');
      }

      if (language === 'bash') {
        if (code.includes('rm -rf /')) issues.push('CRITICAL: Dangerous command pattern detected');
        if (!code.includes('#!')) issues.push('Info: No shebang line found');
      }

      // Complexity metrics
      const cyclomatic = 1
        + (code.match(/\bif\b/g) || []).length
        + (code.match(/\belse\b/g) || []).length
        + (code.match(/\bfor\b/g) || []).length
        + (code.match(/\bwhile\b/g) || []).length
        + (code.match(/\bcatch\b/g) || []).length
        + (code.match(/\bcase\b/g) || []).length;

      if (cyclomatic > 10) issues.push(`High cyclomatic complexity: ${cyclomatic} (consider refactoring)`);

      if (issues.length === 0) {
        return `No issues detected. Code looks clean.\nLanguage: ${language}\nLines: ${lines.length}\nComplexity: ${cyclomatic}`;
      }

      return JSON.stringify({
        language,
        lines: lines.length,
        chars: code.length,
        complexity: cyclomatic,
        issuesCount: issues.length,
        issues
      }, null, 2);
    } catch (err: any) {
      return `Code analysis error: ${err.message}`;
    }
  }
};

/**
 * Format/minify code
 */
export const codeFormatTool: Tool = {
  type: 'function',
  function: {
    name: 'code_format',
    description: 'Format or minify code. Supports JSON prettification and basic code indentation.',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Code to format'
        },
        action: {
          type: 'string',
          enum: ['prettify', 'minify', 'indent'],
          description: 'Formatting action'
        },
        indentSize: {
          type: 'number',
          description: 'Indentation size (default: 2)'
        }
      },
      required: ['code', 'action']
    }
  },
  execute: async ({ code, action, indentSize = 2 }: { code: string; action: string; indentSize?: number }) => {
    try {
      switch (action) {
        case 'prettify': {
          try {
            const parsed = JSON.parse(code);
            return JSON.stringify(parsed, null, indentSize);
          } catch {
            // Not JSON - basic JS formatting attempt
            return code
              .replace(/\s*{\s*/g, ' { ')
              .replace(/\s*}\s*/g, ' } ')
              .replace(/;/g, ';\n')
              .replace(/\n\s*\n/g, '\n')
              .trim();
          }
        }

        case 'minify': {
          try {
            const parsed = JSON.parse(code);
            return JSON.stringify(parsed);
          } catch {
            return code.replace(/\s+/g, ' ').replace(/\n/g, '').trim();
          }
        }

        case 'indent': {
          const indent = ' '.repeat(indentSize);
          let level = 0;
          return code
            .split('\n')
            .map(line => {
              line = line.trim();
              if (line.startsWith('}') || line.startsWith(']') || line.startsWith(')')) level--;
              const indented = indent.repeat(Math.max(0, level)) + line;
              if (line.endsWith('{') || line.endsWith('[') || line.endsWith('(')) level++;
              return indented;
            })
            .join('\n');
        }

        default:
          return `Error: Unknown action "${action}"`;
      }
    } catch (err: any) {
      return `Code format error: ${err.message}`;
    }
  }
};

/**
 * Test regular expressions
 */
export const regexTesterTool: Tool = {
  type: 'function',
  function: {
    name: 'regex_test',
    description: 'Test a regular expression against input text. Shows matches, groups, and positions.',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Regex pattern (without delimiters)'
        },
        text: {
          type: 'string',
          description: 'Text to test against'
        },
        flags: {
          type: 'string',
          description: 'Regex flags (e.g., "gi", "gm")'
        }
      },
      required: ['pattern', 'text']
    }
  },
  execute: async ({ pattern, text, flags = 'g' }: { pattern: string; text: string; flags?: string }) => {
    try {
      const regex = new RegExp(pattern, flags);
      const matches = [...text.matchAll(new RegExp(pattern, flags.includes('g') ? flags : flags + 'g'))];

      if (matches.length === 0) {
        return `No matches found for pattern: /${pattern}/${flags}`;
      }

      const results = matches.map((m, i) => ({
        match: m[0],
        index: m.index,
        groups: m.length > 1 ? m.slice(1) : undefined
      }));

      return JSON.stringify({
        pattern: `/${pattern}/${flags}`,
        matchCount: matches.length,
        matches: results
      }, null, 2);
    } catch (err: any) {
      return `Regex error: ${err.message}`;
    }
  }
};

/**
 * Git operations
 */
export const gitOpsTool: Tool = {
  type: 'function',
  function: {
    name: 'git_ops',
    description: 'Run git commands: status, log, diff, branch, show. Safe read-only operations only.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          enum: ['status', 'log', 'diff', 'branch', 'show', 'tag'],
          description: 'Git operation'
        },
        args: {
          type: 'string',
          description: 'Additional arguments (e.g., "-n 5" for log, branch name for diff)'
        },
        cwd: {
          type: 'string',
          description: 'Working directory (default: current directory)'
        }
      },
      required: ['command']
    }
  },
  execute: async ({ command, args = '', cwd = process.cwd() }: { command: string; args?: string; cwd?: string }) => {
    try {
      // Only allow safe read-only commands
      const safeCommands: Record<string, string> = {
        status: 'git status',
        log: `git log --oneline ${args}`.trim(),
        diff: `git diff ${args}`.trim(),
        branch: 'git branch',
        show: `git show ${args}`.trim(),
        tag: 'git tag'
      };

      const cmd = safeCommands[command];
      if (!cmd) return `Error: Unknown git command "${command}". Allowed: ${Object.keys(safeCommands).join(', ')}`;

      const { stdout, stderr } = await execAsync(cmd, { cwd, timeout: 10000 });

      if (stderr && !stdout) return `Git stderr: ${stderr}`;
      return stdout.trim() || 'No output.';
    } catch (err: any) {
      return `Git error: ${err.message}`;
    }
  }
};
