import { Tool } from '../swarm/types';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { buildTool } from './tool-factory';

const execAsync = promisify(exec);

const SAFE_DIR = process.env.SAFE_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), 'sandbox');

/**
 * Language runtime configuration
 */
const RUNTIMES: Record<string, { check: string; run: (file: string) => string; ext: string }> = {
  bash: {
    check: 'bash --version',
    run: (file) => `bash "${file}"`,
    ext: 'sh'
  },
  python: {
    check: 'python3 --version',
    run: (file) => `python3 "${file}"`,
    ext: 'py'
  },
  node: {
    check: 'node --version',
    run: (file) => `node "${file}"`,
    ext: 'js'
  },
  deno: {
    check: 'deno --version',
    run: (file) => `deno run --allow-all "${file}"`,
    ext: 'ts'
  },
  rust: {
    check: 'rustc --version',
    run: (file) => {
      const bin = file.replace('.rs', '');
      return `rustc "${file}" -o "${bin}" && "${bin}"`;
    },
    ext: 'rs'
  },
  go: {
    check: 'go version',
    run: (file) => `go run "${file}"`,
    ext: 'go'
  },
  ruby: {
    check: 'ruby --version',
    run: (file) => `ruby "${file}"`,
    ext: 'rb'
  },
  perl: {
    check: 'perl --version',
    run: (file) => `perl "${file}"`,
    ext: 'pl'
  }
};

// Blocked patterns for security
const DANGEROUS_PATTERNS = [
  /\brm\s+-rf\s+\/\b/,
  /\bmkfs\b/,
  /\bdd\s+if=/,
  /\bchmod\s+[0-7]*777\s+\/\b/,
  /\bchown\s+.*:.*\s+\/\b/,
  /\b:>\s*\/etc\//,
  />\s*\/dev\/sda/,
  /\bwget\s+.*\|\s*(bash|sh)\b/,
  /\bcurl\s+.*\|\s*(bash|sh)\b/,
  /\bnc\s+-[el]/,
  /\bnetcat\s+-[el]/,
  /\/etc\/shadow/,
  /\/etc\/passwd.*\|/,
  /\bkill\s+-9\s+1\b/,
  /\bshutdown\b/,
  /\breboot\b/,
  /\bfork\s+bomb/,
  /:\(\)\{\s*:\|:\s*&\s*\}\s*;/,
];

function isDangerous(code: string): string | null {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(code)) {
      return `BLOCKED: Dangerous pattern detected matching /${pattern.source}/`;
    }
  }
  return null;
}

/**
 * Multi-language Script Executor
 * Write and execute code in Python, Node.js, Bash, Go, Rust, Ruby, Perl, Deno
 */
export const scriptExecutorTool: Tool = buildTool({
  name: 'execute_script',
  description: 'Write and execute code in multiple languages (bash, python, node, deno, go, rust, ruby, perl). Sandbox-isolated with security scanning.',
  inputSchema: z.object({
    code: z.string().describe('Source code to execute'),
    language: z.enum(['bash', 'python', 'node', 'deno', 'go', 'rust', 'ruby', 'perl']).describe('Programming language runtime'),
    stdin: z.string().optional().describe('Standard input to pipe to the script'),
    timeout: z.number().default(15000).describe('Execution timeout in milliseconds'),
    filename: z.string().optional().describe('Optional filename for the script')
  }),
  execute: async ({ code, language, stdin, timeout = 15000, filename }, context) => {
    try {
      const activeSandbox = context?.variables?.workspaceDir || SAFE_DIR;

      // Safety gate
      const threat = isDangerous(code);
      if (threat) return `[SECURITY] ${threat}`;

      const runtime = RUNTIMES[language];
      if (!runtime) return `[ERROR] Unsupported language: ${language}. Supported: ${Object.keys(RUNTIMES).join(', ')}`;

      // Ensure sandbox exists
      await fs.mkdir(activeSandbox, { recursive: true });

      // Write script file
      const scriptName = filename || `script_${Date.now()}.${runtime.ext}`;
      const scriptPath = path.join(activeSandbox, scriptName);
      await fs.writeFile(scriptPath, code, 'utf-8');

      // Check runtime availability
      try {
        await execAsync(runtime.check, { timeout: 5000, cwd: activeSandbox });
      } catch (err: any) {
        return `[RUNTIME ERROR] ${language} is not installed: ${err.message}`;
      }

      // Build execution command
      const command = runtime.run(scriptPath);
      const execOptions: any = {
        cwd: activeSandbox,
        timeout: Math.min(timeout, 30000),
        maxBuffer: 1024 * 1024, // 1MB output buffer
      };

      if (stdin) {
        execOptions.input = stdin;
      }

      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(command, execOptions);
      const duration = Date.now() - startTime;

      let output = `═══ ${language.toUpperCase()} SCRIPT EXECUTION ═══\n`;
      output += `Duration: ${duration}ms\n`;
      output += `Sandbox: ${activeSandbox}\n`;
      output += `══════════════════════════════════\n\n`;

      if (stdout) output += `[STDOUT]\n${stdout}\n`;
      if (stderr) output += `[STDERR]\n${stderr}\n`;

      if (!stdout && !stderr) {
        output += '[EXIT] Success — no output produced.\n';
      }

      return output.trim();
    } catch (err: any) {
      let message = err.message;
      if (err.killed) message = 'Execution killed: timeout exceeded';
      if (err.code === 'ERR_CHILD_PROCESS_STDOUT_MAXBUFFER') message = 'Output exceeded 1MB buffer limit';

      return `[EXECUTION ERROR]\n${message}`;
    }
  }
});

/**
 * File System Explorer — advanced file operations with tree view, search, and analysis
 */
export const fileExplorerTool: Tool = buildTool({
  name: 'file_explorer',
  description: 'Advanced file system operations: directory tree, file read/write/delete, search files by name/content, file info, move, copy.',
  inputSchema: z.object({
    operation: z.enum(['tree', 'read', 'write', 'delete', 'list', 'info', 'move', 'copy', 'search_name', 'search_content', 'mkdir']).describe('File operation to perform'),
    path: z.string().optional().default('.').describe('Target file or directory path (relative to sandbox)'),
    content: z.string().optional().describe('Content to write (for write operation)'),
    target: z.string().optional().describe('Destination path (for move/copy)'),
    query: z.string().optional().describe('Search query (for search_name: filename pattern, for search_content: text to find)'),
    maxDepth: z.number().optional().default(5).describe('Max directory depth for tree (default: 5)')
  }),
  execute: async ({ operation, path: targetPath = '.', content, target, query, maxDepth = 5 }, context) => {
    try {
      const activeWorkspace = context?.variables?.workspaceDir || SAFE_DIR;

      const resolvedBase = path.resolve(activeWorkspace, targetPath.replace(/^(\.\.(\/|\\|$))+/, ''));
      if (!resolvedBase.startsWith(activeWorkspace)) {
        return `[SECURITY] Path traversal blocked. Escaped sandbox.`;
      }

      switch (operation) {
        case 'tree': {
          const buildTree = async (dir: string, prefix: string, depth: number): Promise<string> => {
            if (depth > maxDepth) return '';
            try {
              const entries = await fs.readdir(dir, { withFileTypes: true });
              let result = '';
              const sorted = entries.sort((a, b) => a.name.localeCompare(b.name));
              for (let i = 0; i < sorted.length; i++) {
                const entry = sorted[i];
                const isLast = i === sorted.length - 1;
                const connector = isLast ? '└── ' : '├── ';
                result += `${prefix}${connector}${entry.name}${entry.isDirectory() ? '/' : ''}\n`;
                if (entry.isDirectory()) {
                  const newPrefix = prefix + (isLast ? '    ' : '│   ');
                  result += await buildTree(path.join(dir, entry.name), newPrefix, depth + 1);
                }
              }
              return result;
            } catch {
              return '';
            }
          };
          const treeStr = await buildTree(resolvedBase, '', 0);
          return `📁 ${targetPath}\n${treeStr}`.trim();
        }

        case 'read': {
          const stat = await fs.stat(resolvedBase);
          if (stat.isDirectory()) {
            const files = await fs.readdir(resolvedBase);
            return `Directory contents:\n${files.join('\n')}`;
          }
          const data = await fs.readFile(resolvedBase, 'utf-8');
          const lines = data.split('\n');
          return `${lines.length} lines, ${data.length} bytes:\n${data}`;
        }

        case 'write': {
          if (!content && content !== '') return 'Error: content parameter required';
          await fs.mkdir(path.dirname(resolvedBase), { recursive: true });
          await fs.writeFile(resolvedBase, content, 'utf-8');
          const stat = await fs.stat(resolvedBase);
          return `✅ Written: ${resolvedBase} (${stat.size} bytes)`;
        }

        case 'delete': {
          const stat = await fs.stat(resolvedBase);
          if (stat.isDirectory()) {
            await fs.rm(resolvedBase, { recursive: true });
            return `✅ Deleted directory: ${resolvedBase}`;
          }
          await fs.unlink(resolvedBase);
          return `✅ Deleted file: ${resolvedBase}`;
        }

        case 'list': {
          const entries = await fs.readdir(resolvedBase, { withFileTypes: true });
          const lines = await Promise.all(entries.map(async (e) => {
            const fullPath = path.join(resolvedBase, e.name);
            try {
              const s = await fs.stat(fullPath);
              const icon = e.isDirectory() ? '📁' : e.isFile() ? '📄' : '🔗';
              const size = e.isFile() ? `  ${formatBytes(s.size)}` : '';
              const mod = `  (${s.mtime.toLocaleDateString()})`;
              return `${icon} ${e.name}${size}${mod}`;
            } catch {
              return `?  ${e.name}`;
            }
          }));
          return `Contents of ${targetPath}:\n${lines.join('\n')}`;
        }

        case 'info': {
          const stat = await fs.stat(resolvedBase);
          const info = {
            path: resolvedBase,
            type: stat.isFile() ? 'file' : stat.isDirectory() ? 'directory' : 'other',
            size: stat.isFile() ? formatBytes(stat.size) : 'N/A',
            created: stat.birthtime.toISOString(),
            modified: stat.mtime.toISOString(),
            accessed: stat.atime.toISOString(),
            permissions: stat.mode.toString(8).slice(-3)
          };
          return JSON.stringify(info, null, 2);
        }

        case 'move': {
          if (!target) return 'Error: target parameter required for move';
          const resolvedTarget = path.resolve(activeWorkspace, target.replace(/^(\.\.(\/|\\|$))+/, ''));
          if (!resolvedTarget.startsWith(activeWorkspace)) return '[SECURITY] Move target outside sandbox';
          await fs.rename(resolvedBase, resolvedTarget);
          return `✅ Moved: ${resolvedBase} → ${resolvedTarget}`;
        }

        case 'copy': {
          if (!target) return 'Error: target parameter required for copy';
          const resolvedTarget = path.resolve(activeWorkspace, target.replace(/^(\.\.(\/|\\|$))+/, ''));
          if (!resolvedTarget.startsWith(activeWorkspace)) return '[SECURITY] Copy target outside sandbox';
          await fs.cp(resolvedBase, resolvedTarget, { recursive: true });
          return `✅ Copied: ${resolvedBase} → ${resolvedTarget}`;
        }

        case 'search_name': {
          if (!query) return 'Error: query parameter required for search_name';
          const results = await searchFilesByName(resolvedBase, query, 0, maxDepth);
          if (results.length === 0) return `No files matching "*${query}*" found`;
          return `Found ${results.length} match(es):\n${results.join('\n')}`;
        }

        case 'search_content': {
          if (!query) return 'Error: query parameter required for search_content';
          const results = await searchFilesByContent(resolvedBase, query, 0, maxDepth);
          if (results.length === 0) return `No files containing "${query}" found`;
          return `Found ${results.length} match(es):\n${results.join('\n')}`;
        }

        case 'mkdir': {
          await fs.mkdir(resolvedBase, { recursive: true });
          return `✅ Created directory: ${resolvedBase}`;
        }

        default:
          return `Unknown operation: ${operation}`;
      }
    } catch (err: any) {
      return `[FILE ERROR] ${err.message}`;
    }
  }
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function searchFilesByName(dir: string, query: string, depth: number, maxDepth: number): Promise<string[]> {
  if (depth > maxDepth) return [];
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.name.toLowerCase().includes(query.toLowerCase())) {
        results.push(fullPath);
      }
      if (entry.isDirectory()) {
        results.push(...await searchFilesByName(fullPath, query, depth + 1, maxDepth));
      }
    }
  } catch { /* permission denied */ }
  return results;
}

async function searchFilesByContent(dir: string, query: string, depth: number, maxDepth: number): Promise<string[]> {
  if (depth > maxDepth) return [];
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile()) {
        try {
          const data = await fs.readFile(fullPath, 'utf-8');
          if (data.toLowerCase().includes(query.toLowerCase())) {
            const lineNum = data.split('\n').findIndex(l => l.toLowerCase().includes(query.toLowerCase())) + 1;
            results.push(`${fullPath}:${lineNum}`);
          }
        } catch { /* binary file or permission issue */ }
      }
      if (entry.isDirectory()) {
        results.push(...await searchFilesByContent(fullPath, query, depth + 1, maxDepth));
      }
    }
  } catch { /* permission denied */ }
  return results;
}
