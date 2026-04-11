import { Tool } from '@/lib/swarm/types';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * Get system information
 */
export const systemInfoTool: Tool = {
  type: 'function',
  function: {
    name: 'system_info',
    description: 'Get detailed system information: OS, CPU, memory, disk, network, uptime.',
    parameters: {
      type: 'object',
      properties: {
        detail: {
          type: 'string',
          enum: ['all', 'os', 'cpu', 'memory', 'network', 'uptime'],
          description: 'Level of detail to return'
        }
      },
      required: []
    }
  },
  execute: async ({ detail = 'all' }: { detail?: string } = {}) => {
    try {
      const info: Record<string, any> = {};

      if (detail === 'all' || detail === 'os') {
        info.os = {
          platform: os.platform(),
          release: os.release(),
          type: os.type(),
          arch: os.arch(),
          hostname: os.hostname(),
          version: os.version()
        };
      }

      if (detail === 'all' || detail === 'cpu') {
        const cpus = os.cpus();
        info.cpu = {
          model: cpus[0]?.model || 'Unknown',
          cores: cpus.length,
          speed: `${cpus[0]?.speed || 0} MHz`
        };
      }

      if (detail === 'all' || detail === 'memory') {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        info.memory = {
          total: `${(totalMem / (1024 ** 3)).toFixed(2)} GB`,
          free: `${(freeMem / (1024 ** 3)).toFixed(2)} GB`,
          used: `${((totalMem - freeMem) / (1024 ** 3)).toFixed(2)} GB`,
          usagePercent: `${(((totalMem - freeMem) / totalMem) * 100).toFixed(1)}%`
        };
      }

      if (detail === 'all' || detail === 'network') {
        const net = os.networkInterfaces();
        info.network = {};
        for (const [iface, addrs] of Object.entries(net)) {
          info.network[iface] = addrs?.map(a => ({
            address: a.address,
            family: a.family,
            internal: a.internal
          }));
        }
      }

      if (detail === 'all' || detail === 'uptime') {
        const uptimeSec = os.uptime();
        const days = Math.floor(uptimeSec / 86400);
        const hours = Math.floor((uptimeSec % 86400) / 3600);
        const mins = Math.floor((uptimeSec % 3600) / 60);
        info.uptime = `${days}d ${hours}h ${mins}m`;
      }

      return JSON.stringify(info, null, 2);
    } catch (err: any) {
      return `System info error: ${err.message}`;
    }
  }
};

/**
 * Monitor system resources
 */
export const resourceMonitorTool: Tool = {
  type: 'function',
  function: {
    name: 'resource_monitor',
    description: 'Monitor current system resource usage: memory, CPU load averages, process count.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['memory', 'load', 'all'],
          description: 'Resource type to monitor'
        }
      },
      required: []
    }
  },
  execute: async ({ type = 'all' }: { type?: string } = {}) => {
    try {
      const result: Record<string, any> = {};

      if (type === 'all' || type === 'memory') {
        const total = os.totalmem();
        const free = os.freemem();
        result.memory = {
          totalBytes: total,
          freeBytes: free,
          usedBytes: total - free,
          usedPercent: (((total - free) / total) * 100).toFixed(1) + '%',
          freePercent: ((free / total) * 100).toFixed(1) + '%'
        };
      }

      if (type === 'all' || type === 'load') {
        const loadAvgs = os.loadavg();
        result.loadAverage = {
          '1min': loadAvgs[0].toFixed(2),
          '5min': loadAvgs[1].toFixed(2),
          '15min': loadAvgs[2].toFixed(2)
        };
      }

      result.cpuCount = os.cpus().length;
      result.arch = os.arch();
      result.platform = os.platform();

      return JSON.stringify(result, null, 2);
    } catch (err: any) {
      return `Resource monitor error: ${err.message}`;
    }
  }
};

/**
 * List running processes
 */
export const processListTool: Tool = {
  type: 'function',
  function: {
    name: 'list_processes',
    description: 'List running system processes. Returns top processes by CPU/memory.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of processes to return (default: 20)'
        },
        filter: {
          type: 'string',
          description: 'Filter by process name (substring match)'
        }
      },
      required: []
    }
  },
  execute: async ({ limit = 20, filter }: { limit?: number; filter?: string } = {}) => {
    try {
      const cmd = process.platform === 'win32'
        ? 'tasklist /FO CSV'
        : 'ps aux --sort=-%mem';

      const { stdout } = await execAsync(cmd, { timeout: 5000 });

      if (process.platform === 'win32') {
        return `Process list (Windows):\n${stdout}`;
      }

      const lines = stdout.trim().split('\n');
      let result = limit < lines.length - 1 ? lines.slice(0, limit + 1) : lines;

      if (filter) {
        result = result.filter(line => line.toLowerCase().includes(filter.toLowerCase()));
      }

      return result.join('\n') || `No processes matching "${filter}"`;
    } catch (err: any) {
      return `Process list error: ${err.message}`;
    }
  }
};

/**
 * Read environment variables
 */
export const envInfoTool: Tool = {
  type: 'function',
  function: {
    name: 'env_info',
    description: 'Read environment variables. Returns specific env var or all available (non-sensitive) ones.',
    parameters: {
      type: 'object',
      properties: {
        variable: {
          type: 'string',
          description: 'Specific environment variable name (omit to list all available)'
        }
      },
      required: []
    }
  },
  execute: async ({ variable }: { variable?: string } = {}) => {
    try {
      // Block sensitive variables
      const blocked = ['SECRET', 'PASSWORD', 'TOKEN', 'KEY', 'PRIVATE', 'CREDENTIAL'];

      if (variable) {
        const isBlocked = blocked.some(b => variable.toUpperCase().includes(b));
        if (isBlocked) return `[BLOCKED] Cannot read sensitive environment variable: ${variable}`;
        return `${variable} = ${process.env[variable] || '[NOT SET]'}`;
      }

      const safeVars: Record<string, string> = {};
      for (const [key, value] of Object.entries(process.env)) {
        const isSafe = !blocked.some(b => key.toUpperCase().includes(b));
        if (isSafe && value) safeVars[key] = value;
      }

      return JSON.stringify(safeVars, null, 2);
    } catch (err: any) {
      return `Environment info error: ${err.message}`;
    }
  }
};

/**
 * Check disk usage
 */
export const diskUsageTool: Tool = {
  type: 'function',
  function: {
    name: 'disk_usage',
    description: 'Check disk space usage for the current system.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to check (default: home directory)'
        }
      },
      required: []
    }
  },
  execute: async ({ path }: { path?: string } = {}) => {
    try {
      const target = path || os.homedir();

      try {
        const stat = await fs.stat(target);
        const cmd = process.platform === 'win32'
          ? `wmic logicaldisk where "DeviceID='${target.charAt(0)}:'" get Size,FreeSpace /format:list`
          : `df -h "${target}"`;

        const { stdout } = await execAsync(cmd, { timeout: 5000 });
        return stdout.trim();
      } catch {
        return `Path not found: ${target}`;
      }
    } catch (err: any) {
      return `Disk usage error: ${err.message}`;
    }
  }
};
