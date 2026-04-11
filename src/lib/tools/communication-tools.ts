import { Tool } from '@/lib/swarm/types';
import { globalAuditLogger } from '../security/audit-logger';
import fs from 'fs/promises';
import path from 'path';

/**
 * Write structured logs
 */
export const logWriterTool: Tool = {
  type: 'function',
  function: {
    name: 'write_log',
    description: 'Write structured log entries to the system log file. Supports levels: info, warn, error, debug.',
    parameters: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: ['info', 'warn', 'error', 'debug'],
          description: 'Log level'
        },
        message: {
          type: 'string',
          description: 'Log message'
        },
        source: {
          type: 'string',
          description: 'Source/context of the log'
        }
      },
      required: ['message']
    }
  },
  execute: async ({ level = 'info', message, source = 'agent' }: { level?: string; message: string; source?: string }) => {
    try {
      const logDir = path.join(process.cwd(), 'data', 'logs');
      await fs.mkdir(logDir, { recursive: true });

      const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
      const timestamp = new Date().toISOString();
      const logLine = `[${timestamp}] [${level.toUpperCase()}] [${source}] ${message}\n`;

      await fs.appendFile(logFile, logLine);

      await globalAuditLogger.log({
        agentName: source,
        action: `LOG_${level.toUpperCase()}`,
        details: { message, source },
        riskLevel: level === 'error' ? 'high' : level === 'warn' ? 'medium' : 'low'
      });

      return `Log written successfully: [${level.toUpperCase()}] ${message}`;
    } catch (err: any) {
      return `Log write error: ${err.message}`;
    }
  }
};

/**
 * Create reminders and notes
 */
export const reminderTool: Tool = {
  type: 'function',
  function: {
    name: 'create_reminder',
    description: 'Create a reminder/note entry stored in the persistent data store.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Reminder title'
        },
        note: {
          type: 'string',
          description: 'Reminder details'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Reminder priority'
        }
      },
      required: ['title']
    }
  },
  execute: async ({ title, note = '', priority = 'medium' }: { title: string; note?: string; priority?: string }) => {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      const remindersFile = path.join(dataDir, 'reminders.json');

      let reminders: any[] = [];
      try {
        const existing = await fs.readFile(remindersFile, 'utf-8');
        reminders = JSON.parse(existing);
      } catch { /* file doesn't exist yet */ }

      const reminder = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title,
        note,
        priority,
        createdAt: new Date().toISOString(),
        completed: false
      };

      reminders.push(reminder);
      await fs.writeFile(remindersFile, JSON.stringify(reminders, null, 2));

      return `Reminder created: "${title}" [${priority.toUpperCase()}]\nID: ${reminder.id}`;
    } catch (err: any) {
      return `Reminder error: ${err.message}`;
    }
  }
};

/**
 * Read stored reminders/notes
 */
export const reminderListTool: Tool = {
  type: 'function',
  function: {
    name: 'list_reminders',
    description: 'List all stored reminders/notes with optional filtering by status or priority.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['all', 'active', 'completed'],
          description: 'Filter by status'
        },
        priority: {
          type: 'string',
          enum: ['all', 'low', 'medium', 'high', 'critical'],
          description: 'Filter by priority'
        }
      },
      required: []
    }
  },
  execute: async ({ status = 'all', priority = 'all' }: { status?: string; priority?: string } = {}) => {
    try {
      const remindersFile = path.join(process.cwd(), 'data', 'reminders.json');

      let reminders: any[] = [];
      try {
        const existing = await fs.readFile(remindersFile, 'utf-8');
        reminders = JSON.parse(existing);
      } catch {
        return 'No reminders found.';
      }

      let filtered = reminders;
      if (status === 'active') filtered = filtered.filter(r => !r.completed);
      if (status === 'completed') filtered = filtered.filter(r => r.completed);
      if (priority !== 'all') filtered = filtered.filter(r => r.priority === priority);

      if (filtered.length === 0) return 'No matching reminders found.';

      return filtered.map((r, i) =>
        `${i + 1}. [${r.completed ? '✓' : ' '}] [${r.priority.toUpperCase()}] ${r.title} (Created: ${r.createdAt})\n   ${r.note || ''}`
      ).join('\n\n');
    } catch (err: any) {
      return `List reminders error: ${err.message}`;
    }
  }
};

/**
 * Generate UUID
 */
export const uuidGeneratorTool: Tool = {
  type: 'function',
  function: {
    name: 'generate_uuid',
    description: 'Generate one or more unique UUIDs (v4 format).',
    parameters: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of UUIDs to generate (default: 1)'
        },
        format: {
          type: 'string',
          enum: ['uuid', 'short', 'timestamp'],
          description: 'Output format: uuid (standard), short (8 chars), timestamp+random'
        }
      },
      required: []
    }
  },
  execute: async ({ count = 1, format = 'uuid' }: { count?: number; format?: string } = {}) => {
    try {
      const uuids: string[] = [];

      for (let i = 0; i < Math.min(count, 100); i++) {
        switch (format) {
          case 'uuid':
            uuids.push(crypto.randomUUID());
            break;
          case 'short':
            uuids.push(Math.random().toString(36).substring(2, 10));
            break;
          case 'timestamp':
            uuids.push(`${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
            break;
        }
      }

      return count === 1 ? uuids[0] : uuids.join('\n');
    } catch (err: any) {
      return `UUID generation error: ${err.message}`;
    }
  }
};

/**
 * Hash data
 */
export const hashTool: Tool = {
  type: 'function',
  function: {
    name: 'hash_data',
    description: 'Generate hash/digest of data. Supports simple hashing and checksums.',
    parameters: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description: 'Data to hash'
        },
        algorithm: {
          type: 'string',
          enum: ['djb2', 'sdbm', 'sha256_simple', 'crc32_like'],
          description: 'Hash algorithm'
        }
      },
      required: ['data']
    }
  },
  execute: async ({ data, algorithm = 'djb2' }: { data: string; algorithm?: string }) => {
    try {
      switch (algorithm) {
        case 'djb2': {
          let hash = 5381;
          for (let i = 0; i < data.length; i++) {
            hash = ((hash << 5) + hash) + data.charCodeAt(i);
          }
          return `djb2: ${hash >>> 0}\nhex: ${(hash >>> 0).toString(16)}`;
        }

        case 'sdbm': {
          let hash = 0;
          for (let i = 0; i < data.length; i++) {
            hash = data.charCodeAt(i) + (hash << 6) + (hash << 16) - hash;
          }
          return `sdbm: ${hash >>> 0}\nhex: ${(hash >>> 0).toString(16)}`;
        }

        case 'sha256_simple': {
          // Simple SHA-256-like simulation (not cryptographically secure)
          let h1 = 0x6a09e667, h2 = 0xbb67ae85, h3 = 0x3c6ef372, h4 = 0xa54ff53a;
          for (let i = 0; i < data.length; i++) {
            const charCode = data.charCodeAt(i);
            h1 = Math.imul(h1 ^ charCode, 2654435761);
            h2 = Math.imul(h2 ^ charCode, 2246822519);
            h3 = Math.imul(h3 ^ charCode, 3266489917);
            h4 = Math.imul(h4 ^ charCode, 668265263);
          }
          const hex = [h1, h2, h3, h4].map(h => (h >>> 0).toString(16).padStart(8, '0')).join('');
          return `sha256_simple: ${hex}`;
        }

        case 'crc32_like': {
          let crc = 0xFFFFFFFF;
          for (let i = 0; i < data.length; i++) {
            crc ^= data.charCodeAt(i);
            for (let j = 0; j < 8; j++) {
              crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
            }
          }
          return `crc32: ${(crc ^ 0xFFFFFFFF) >>> 0}\nhex: ${(crc ^ 0xFFFFFFFF).toString(16).padStart(8, '0')}`;
        }

        default:
          return `Unknown algorithm: ${algorithm}`;
      }
    } catch (err: any) {
      return `Hash error: ${err.message}`;
    }
  }
};

/**
 * Random data generator
 */
export const randomDataTool: Tool = {
  type: 'function',
  function: {
    name: 'generate_data',
    description: 'Generate random test data: names, emails, IPs, addresses, lorem ipsum, numbers, strings.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['name', 'email', 'ip', 'lorem', 'number', 'string', 'json', 'markdown'],
          description: 'Type of data to generate'
        },
        count: {
          type: 'number',
          description: 'Number of items (default: 5)'
        },
        length: {
          type: 'number',
          description: 'Length for string/lorem generation (default: 100 chars)'
        }
      },
      required: ['type']
    }
  },
  execute: async ({ type, count = 5, length = 100 }: { type: string; count?: number; length?: number }) => {
    try {
      const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore'];
      const domains = ['example.com', 'test.org', 'demo.net', 'sample.io', 'mock.dev'];
      const loremWords = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'labore', 'magna', 'aliqua', 'ut', 'enim', 'minim', 'veniam'];

      const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
      const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

      let results: string[] = [];

      switch (type) {
        case 'name':
          results = Array.from({ length: count }, () => `${rand(firstNames)} ${rand(lastNames)}`);
          break;

        case 'email':
          results = Array.from({ length: count }, () => `${rand(firstNames).toLowerCase()}.${rand(lastNames).toLowerCase()}@${rand(domains)}`);
          break;

        case 'ip':
          results = Array.from({ length: count }, () => `${randInt(1, 255)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`);
          break;

        case 'lorem': {
          const words: string[] = [];
          for (let i = 0; i < Math.ceil(length / 6); i++) {
            words.push(rand(loremWords));
          }
          results = [words.join(' ').substring(0, length)];
          break;
        }

        case 'number':
          results = Array.from({ length: count }, () => randInt(1, 10000).toString());
          break;

        case 'string': {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          results = Array.from({ length: count }, () =>
            Array.from({ length: length }, () => rand(chars.split(''))).join('')
          );
          break;
        }

        case 'json': {
          const data = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            name: `${rand(firstNames)} ${rand(lastNames)}`,
            email: `${rand(firstNames).toLowerCase()}.${rand(lastNames).toLowerCase()}@${rand(domains)}`,
            age: randInt(18, 65),
            active: Math.random() > 0.3
          }));
          results = [JSON.stringify(data, null, 2)];
          break;
        }

        case 'markdown':
          results = [`# Generated Document\n\n## Section 1\n\nLorem ipsum dolor sit amet.\n\n- Item A\n- Item B\n- Item C\n\n## Section 2\n\nMore content here.`];
          break;
      }

      return results.length === 1 ? results[0] : results.join('\n');
    } catch (err: any) {
      return `Random data error: ${err.message}`;
    }
  }
};
