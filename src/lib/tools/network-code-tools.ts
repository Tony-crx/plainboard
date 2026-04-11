import { Tool } from '../swarm/types';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as net from 'net';

const execAsync = promisify(exec);

/**
 * Network Scanner — port scan, ping, DNS lookup, whois, traceroute
 */
export const networkScannerTool: Tool = {
  type: 'function',
  function: {
    name: 'network_scan',
    description: 'Network diagnostic tools: ping, port scan, DNS lookup, whois, and connectivity check against any host.',
    parameters: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['ping', 'port_scan', 'dns_lookup', 'whois', 'connectivity', 'traceroute'],
          description: 'Network operation to perform'
        },
        target: {
          type: 'string',
          description: 'Hostname or IP address to scan'
        },
        ports: {
          type: 'string',
          description: 'For port_scan: comma-separated ports (default: "22,80,443,8080,8443,3000,3306,5432")'
        },
        dnsServer: {
          type: 'string',
          description: 'DNS server for lookup (default: 8.8.8.8)'
        },
        count: {
          type: 'number',
          description: 'Ping count (default: 4)'
        }
      },
      required: ['operation', 'target']
    }
  },
  execute: async ({ operation, target, ports, dnsServer = '8.8.8.8', count = 4 }: {
    operation: string; target: string; ports?: string; dnsServer?: string; count?: number
  }) => {
    try {
      // Validate target — no injection
      const cleanTarget = target.replace(/[^a-zA-Z0-9.\-_:]/g, '');
      if (!cleanTarget) return `[ERROR] Invalid target: ${target}`;

      switch (operation) {
        case 'ping': {
          try {
            const { stdout } = await execAsync(`ping -c ${count} -W 3 ${cleanTarget}`, { timeout: 15000 });
            // Extract summary
            const lines = stdout.trim().split('\n');
            const summary = lines.slice(-4).join('\n');
            return `Ping Results for ${cleanTarget}\n${summary}`;
          } catch (err: any) {
            return `Ping failed: ${err.message}`;
          }
        }

        case 'port_scan': {
          const portList = ports ? ports.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p))
            : [22, 80, 443, 8080, 8443, 3000, 3306, 5432, 6379, 27017];
          const results: Array<{ port: number; status: string; service?: string }> = [];

          const commonPorts: Record<number, string> = {
            21: 'FTP', 22: 'SSH', 25: 'SMTP', 53: 'DNS', 80: 'HTTP',
            110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 993: 'IMAPS', 995: 'POP3S',
            3000: 'Node/Dev', 3306: 'MySQL', 5432: 'PostgreSQL', 6379: 'Redis',
            8080: 'HTTP-Alt', 8443: 'HTTPS-Alt', 9090: 'Prometheus', 27017: 'MongoDB'
          };

          const scanPromises = portList.map(port => {
            return new Promise<void>((resolve) => {
              const socket = new net.Socket();
              const timeout = setTimeout(() => {
                socket.destroy();
                resolve();
              }, 2000);

              socket.connect({ host: cleanTarget, port }, () => {
                clearTimeout(timeout);
                results.push({ port, status: 'OPEN', service: commonPorts[port] });
                socket.destroy();
                resolve();
              });

              socket.on('error', () => {
                clearTimeout(timeout);
                results.push({ port, status: 'CLOSED', service: commonPorts[port] });
                resolve();
              });
            });
          });

          await Promise.all(scanPromises);

          const openPorts = results.filter(r => r.status === 'OPEN');
          let output = `Port Scan Results for ${cleanTarget}\n`;
          output += `${'PORT'.padEnd(8)} ${'STATUS'.padEnd(10)} ${'SERVICE'}\n`;
          output += '-'.repeat(35) + '\n';

          for (const r of results) {
            const statusIcon = r.status === 'OPEN' ? '✅' : '❌';
            output += `${String(r.port).padEnd(8)} ${statusIcon.padEnd(2)} ${r.status.padEnd(8)} ${r.service || 'unknown'}\n`;
          }

          output += `\nSummary: ${openPorts.length}/${results.length} ports open`;
          if (openPorts.length > 0) {
            output += `\nOpen services: ${openPorts.map(r => `${r.service || 'port ' + r.port}`).join(', ')}`;
          }
          return output;
        }

        case 'dns_lookup': {
          try {
            const { stdout } = await execAsync(`nslookup ${cleanTarget} ${dnsServer}`, { timeout: 10000 });
            return `DNS Lookup for ${cleanTarget} (server: ${dnsServer})\n\n${stdout.trim()}`;
          } catch (err: any) {
            return `DNS lookup failed: ${err.message}`;
          }
        }

        case 'whois': {
          try {
            const { stdout } = await execAsync(`whois ${cleanTarget}`, { timeout: 10000 });
            return stdout.trim().substring(0, 5000) || 'No WHOIS data available';
          } catch (err: any) {
            return `WHOIS query failed: ${err.message}`;
          }
        }

        case 'connectivity': {
          const checks: Record<string, boolean> = {};
          const testPorts = [
            { port: 80, service: 'HTTP' },
            { port: 443, service: 'HTTPS' },
            { port: 22, service: 'SSH' }
          ];

          for (const { port, service } of testPorts) {
            const reachable = await new Promise<boolean>(resolve => {
              const socket = new net.Socket();
              const timeout = setTimeout(() => { socket.destroy(); resolve(false); }, 3000);
              socket.connect({ host: cleanTarget, port }, () => {
                clearTimeout(timeout);
                socket.destroy();
                resolve(true);
              });
              socket.on('error', () => { clearTimeout(timeout); resolve(false); });
            });
            checks[service] = reachable;
          }

          let output = `Connectivity Check for ${cleanTarget}\n\n`;
          for (const [service, ok] of Object.entries(checks)) {
            output += `${ok ? '✅' : '❌'} ${service}: ${ok ? 'Reachable' : 'Unreachable'}\n`;
          }
          return output.trim();
        }

        case 'traceroute': {
          try {
            const { stdout } = await execAsync(`traceroute -m 15 -w 2 ${cleanTarget}`, { timeout: 30000 });
            return `Traceroute to ${cleanTarget}\n\n${stdout.trim()}`;
          } catch (err: any) {
            return `Traceroute failed: ${err.message}`;
          }
        }

        default:
          return `Unknown operation: ${operation}`;
      }
    } catch (err: any) {
      return `Network scanner error: ${err.message}`;
    }
  }
};

/**
 * Code Reviewer — deep security audit, best practices, performance analysis
 */
export const codeReviewerTool: Tool = {
  type: 'function',
  function: {
    name: 'code_review',
    description: 'Deep code review: security audit, best practices check, performance analysis, complexity report, and anti-pattern detection.',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Source code to review'
        },
        language: {
          type: 'string',
          enum: ['javascript', 'typescript', 'python', 'bash', 'auto'],
          description: 'Programming language'
        },
        focus: {
          type: 'string',
          enum: ['all', 'security', 'performance', 'style', 'complexity'],
          description: 'Review focus area'
        }
      },
      required: ['code']
    }
  },
  execute: async ({ code, language = 'auto', focus = 'all' }: {
    code: string; language?: string; focus?: string
  }) => {
    try {
      const lines = code.split('\n');
      const findings: Array<{ level: 'CRITICAL' | 'WARNING' | 'INFO' | 'OK'; category: string; message: string; line?: number }> = [];

      // Auto-detect language
      if (language === 'auto') {
        if (code.includes(': string') || code.includes(': number') || code.includes('interface ')) language = 'typescript';
        else if (code.includes('import ') || code.includes('const ') || code.includes('let ')) language = 'javascript';
        else if (code.includes('def ') || code.includes('import ') || code.includes('class ') && code.includes('self')) language = 'python';
        else if (code.includes('#!/bin') || code.includes('echo $') || code.includes('$(')) language = 'bash';
        else language = 'javascript';
      }

      // === SECURITY AUDIT ===
      if (focus === 'all' || focus === 'security') {
        // JavaScript/TypeScript security
        if (language === 'javascript' || language === 'typescript') {
          const securityPatterns: Array<[RegExp, string, 'CRITICAL' | 'WARNING'] | [RegExp, string, 'INFO']> = [
            [/eval\s*\(/, 'eval() usage — arbitrary code execution risk', 'CRITICAL'],
            [/exec\s*\(/, 'exec() usage — command injection risk', 'CRITICAL'],
            [/innerHTML\s*=/, 'innerHTML assignment — XSS risk', 'WARNING'],
            [/document\.write\s*\(/, 'document.write() — XSS risk', 'CRITICAL'],
            [/localStorage\.(?:get|set)Item.*password/i, 'Storing password in localStorage', 'CRITICAL'],
            [/password|secret|token|api_key\s*=\s*['"][^'"]{4,}['"]/i, 'Hardcoded secret/credential', 'CRITICAL'],
            [/new Function\s*\(/, 'new Function() — code injection risk', 'CRITICAL'],
            [/__proto__/, '__proto__ access — prototype pollution risk', 'WARNING'],
            [/constructor\.prototype/, 'Prototype manipulation risk', 'WARNING'],
            [/\brequire\s*\(\s*['"][^'"]*['"]\s*\)/, 'Dynamic require detected', 'INFO'],
          ] as const;

          lines.forEach((line, idx) => {
            for (const [pattern, msg, level] of securityPatterns) {
              if (pattern.test(line)) {
                findings.push({ level, category: 'SECURITY', message: msg, line: idx + 1 });
              }
            }
          });

          // Missing error handling
          if (code.includes('fetch(') && !code.includes('.catch')) {
            findings.push({ level: 'WARNING', category: 'SECURITY', message: 'fetch() without .catch() — unhandled promise rejection' });
          }
          if (code.includes('async') && !code.includes('try') && !code.includes('catch')) {
            findings.push({ level: 'WARNING', category: 'SECURITY', message: 'Async function without try/catch error handling' });
          }
        }

        // Python security
        if (language === 'python') {
          if (/\bexec\s*\(/.test(code)) findings.push({ level: 'CRITICAL', category: 'SECURITY', message: 'exec() — arbitrary code execution' });
          if (/\beval\s*\(/.test(code)) findings.push({ level: 'CRITICAL', category: 'SECURITY', message: 'eval() — arbitrary code execution' });
          if (/\bos\.system\s*\(/.test(code)) findings.push({ level: 'CRITICAL', category: 'SECURITY', message: 'os.system() — command injection risk, use subprocess instead' });
          if (/\bpickle\.loads?\s*\(/.test(code)) findings.push({ level: 'CRITICAL', category: 'SECURITY', message: 'pickle.loads() — deserialization vulnerability' });
          if (/\b__import__\s*\(/.test(code)) findings.push({ level: 'WARNING', category: 'SECURITY', message: 'Dynamic import detected' });
        }

        // Bash security
        if (language === 'bash') {
          if (/\$\(/.test(code) && /\beval\b/.test(code)) findings.push({ level: 'CRITICAL', category: 'SECURITY', message: 'eval with command substitution — injection risk' });
          if (!/set -[euo]/.test(code) && !/set -[euo]/.test(code)) findings.push({ level: 'WARNING', category: 'SECURITY', message: 'Missing set -euo pipefail for strict mode' });
        }
      }

      // === PERFORMANCE ===
      if (focus === 'all' || focus === 'performance') {
        // N+1 query patterns
        if (/for\s*\([^)]*\)\s*\{[\s\S]*?(fetch|await|axios|request)/.test(code)) {
          findings.push({ level: 'WARNING', category: 'PERFORMANCE', message: 'Possible N+1 query: network/DB call inside loop' });
        }

        // Large object in loop
        if (/for\s*\(.*\)\s*\{[\s\S]*?\.push\s*\(/.test(code) && code.split('.push(').length > 5) {
          findings.push({ level: 'INFO', category: 'PERFORMANCE', message: 'Consider pre-allocating array instead of repeated push' });
        }

        // Sync blocking patterns
        if (/readFileSync|writeFileSync|execSync/.test(code)) {
          findings.push({ level: 'WARNING', category: 'PERFORMANCE', message: 'Synchronous I/O blocks the event loop' });
        }

        // Python: list vs set lookup
        if (language === 'python' && /\bif\s+\w+\s+in\s+\[/.test(code)) {
          findings.push({ level: 'INFO', category: 'PERFORMANCE', message: 'Use set{} instead of [] for O(1) lookup in membership tests' });
        }
      }

      // === STYLE ===
      if (focus === 'all' || focus === 'style') {
        // Long lines
        lines.forEach((line, idx) => {
          if (line.length > 120) {
            findings.push({ level: 'INFO', category: 'STYLE', message: `Line too long (${line.length} chars, max 120)`, line: idx + 1 });
          }
        });

        // Console.log in production code
        if (language === 'javascript' || language === 'typescript') {
          const consoleCount = (code.match(/console\.(log|warn|error|debug)/g) || []).length;
          if (consoleCount > 5) {
            findings.push({ level: 'INFO', category: 'STYLE', message: `${consoleCount} console statements found — consider using a logger` });
          }
        }

        // Any types in TypeScript
        if (language === 'typescript') {
          const anyCount = (code.match(/:\s*any\b/g) || []).length;
          if (anyCount > 0) {
            findings.push({ level: 'WARNING', category: 'STYLE', message: `${anyCount} 'any' type(s) — use specific types for better safety` });
          }
        }

        // Python: PEP 8
        if (language === 'python') {
          if (/import \w+, \w+/.test(code)) findings.push({ level: 'INFO', category: 'STYLE', message: 'One import per line (PEP 8)' });
          if (/\t/.test(code)) findings.push({ level: 'WARNING', category: 'STYLE', message: 'Tab character found — use 4 spaces (PEP 8)' });
        }
      }

      // === COMPLEXITY ===
      if (focus === 'all' || focus === 'complexity') {
        let cyclomatic = 1;
        const complexityKeywords = /\b(if|else\s+if|elif|for|while|case|catch|except|\?\?|&&|\|\|)/g;
        for (const line of lines) {
          const matches = line.match(complexityKeywords);
          if (matches) cyclomatic += matches.length;
        }

        if (cyclomatic > 20) findings.push({ level: 'CRITICAL', category: 'COMPLEXITY', message: `Cyclomatic complexity: ${cyclomatic} (should be < 10, critical above 20)` });
        else if (cyclomatic > 10) findings.push({ level: 'WARNING', category: 'COMPLEXITY', message: `Cyclomatic complexity: ${cyclomatic} (should be < 10)` });
        else findings.push({ level: 'OK', category: 'COMPLEXITY', message: `Cyclomatic complexity: ${cyclomatic} ✓` });

        // Nesting depth
        let maxDepth = 0;
        let currentDepth = 0;
        for (const line of lines) {
          const opens = (line.match(/{/g) || []).length + (line.match(/:/g) || []).length;
          const closes = (line.match(/}/g) || []).length;
          currentDepth += opens - closes;
          if (currentDepth > maxDepth) maxDepth = currentDepth;
        }
        if (maxDepth > 5) findings.push({ level: 'WARNING', category: 'COMPLEXITY', message: `Max nesting depth: ${maxDepth} — consider extracting functions` });
      }

      // === BUILD REPORT ===
      const critical = findings.filter(f => f.level === 'CRITICAL');
      const warnings = findings.filter(f => f.level === 'WARNING');
      const infos = findings.filter(f => f.level === 'INFO');
      const oks = findings.filter(f => f.level === 'OK');

      let report = `═══ CODE REVIEW REPORT ═══\n`;
      report += `Language: ${language}\n`;
      report += `Lines: ${lines.length}\n`;
      report += `Findings: ${critical.length} critical, ${warnings.length} warnings, ${infos.length} info\n`;
      report += `════════════════════════════\n\n`;

      if (critical.length > 0) {
        report += `🔴 CRITICAL (${critical.length})\n`;
        for (const f of critical) report += `  [Line ${f.line || '?'}] ${f.message}\n`;
        report += '\n';
      }

      if (warnings.length > 0) {
        report += `🟡 WARNINGS (${warnings.length})\n`;
        for (const f of warnings) report += `  [Line ${f.line || '?'}] ${f.message}\n`;
        report += '\n';
      }

      if (infos.length > 0) {
        report += `🔵 INFO (${infos.length})\n`;
        for (const f of infos) report += `  [Line ${f.line || '?'}] ${f.message}\n`;
        report += '\n';
      }

      if (oks.length > 0) {
        report += `✅ PASSED\n`;
        for (const f of oks) report += `  ${f.message}\n`;
      }

      if (critical.length === 0 && warnings.length === 0) {
        report += `\n🎉 Overall: Code looks clean!`;
      } else if (critical.length > 0) {
        report += `\n⛔ Overall: CRITICAL issues must be resolved before merge.`;
      } else {
        report += `\n⚠️ Overall: Review recommended — ${warnings.length} warning(s) to address.`;
      }

      return report;
    } catch (err: any) {
      return `Code review error: ${err.message}`;
    }
  }
};
