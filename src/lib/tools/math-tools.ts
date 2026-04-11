import { Tool } from '@/lib/swarm/types';

/**
 * Mathematical calculator with expression support
 */
export const calculatorTool: Tool = {
  type: 'function',
  function: {
    name: 'calculate',
    description: 'Evaluate mathematical expressions. Supports: +, -, *, /, ^, %, sqrt, sin, cos, tan, log, abs, pi, e, parentheses.',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Math expression (e.g., "sqrt(144) + 3^2", "sin(pi/4) * 100")'
        },
        precision: {
          type: 'number',
          description: 'Decimal places for result (default: 6)'
        }
      },
      required: ['expression']
    }
  },
  execute: async ({ expression, precision = 6 }: { expression: string; precision?: number }) => {
    try {
      // Safe math evaluation with controlled functions
      const safeExpr = expression
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\btan\b/g, 'Math.tan')
        .replace(/\blog\b/g, 'Math.log')
        .replace(/\blog10\b/g, 'Math.log10')
        .replace(/\babs\b/g, 'Math.abs')
        .replace(/\bfloor\b/g, 'Math.floor')
        .replace(/\bceil\b/g, 'Math.ceil')
        .replace(/\bround\b/g, 'Math.round')
        .replace(/\bpi\b/g, String(Math.PI))
        .replace(/\be\b/g, String(Math.E))
        .replace(/\^/g, '**');

      // Validate: only allow safe characters
      if (!/^[\d\s\+\-\*\/\.\(\)eE,]+$/.test(safeExpr.replace(/Math\.\w+/g, ''))) {
        return 'Error: Expression contains unsafe characters. Only math operations and Math functions allowed.';
      }

      const result = Function(`"use strict"; return (${safeExpr})`)();

      if (typeof result !== 'number' || !isFinite(result)) {
        return 'Error: Invalid mathematical result (NaN or Infinity)';
      }

      return `${expression} = ${Number(result.toFixed(precision))}`;
    } catch (err: any) {
      return `Calculation error: ${err.message}`;
    }
  }
};

/**
 * Statistical calculations on a number set
 */
export const statisticsTool: Tool = {
  type: 'function',
  function: {
    name: 'statistics',
    description: 'Compute statistics on a set of numbers: mean, median, mode, std deviation, min, max, sum, range, variance.',
    parameters: {
      type: 'object',
      properties: {
        numbers: {
          type: 'string',
          description: 'Comma-separated numbers (e.g., "10, 20, 30, 40, 50")'
        },
        stats: {
          type: 'string',
          description: 'Specific stats to compute (comma-separated): mean, median, mode, std, min, max, sum, range, variance, all (default: all)'
        }
      },
      required: ['numbers']
    }
  },
  execute: async ({ numbers, stats = 'all' }: { numbers: string; stats?: string }) => {
    try {
      const nums = numbers.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));

      if (nums.length === 0) return 'Error: No valid numbers provided';

      const requested = stats === 'all'
        ? ['mean', 'median', 'mode', 'std', 'min', 'max', 'sum', 'range', 'variance']
        : stats.split(',').map(s => s.trim());

      const sum = nums.reduce((a, b) => a + b, 0);
      const mean = sum / nums.length;
      const sorted = [...nums].sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const range = max - min;

      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

      // Mode
      const freq: Record<number, number> = {};
      nums.forEach(n => { freq[n] = (freq[n] || 0) + 1; });
      const maxFreq = Math.max(...Object.values(freq));
      const mode = Object.keys(freq).filter(k => freq[Number(k)] === maxFreq).map(Number);

      // Variance and Std Dev
      const variance = nums.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / nums.length;
      const std = Math.sqrt(variance);

      const result: Record<string, any> = {};
      if (requested.includes('mean')) result.mean = Number(mean.toFixed(4));
      if (requested.includes('median')) result.median = Number(median.toFixed(4));
      if (requested.includes('mode')) result.mode = mode.length === nums.length ? 'No mode (all unique)' : mode;
      if (requested.includes('std')) result.stdDev = Number(std.toFixed(4));
      if (requested.includes('min')) result.min = min;
      if (requested.includes('max')) result.max = max;
      if (requested.includes('sum')) result.sum = Number(sum.toFixed(4));
      if (requested.includes('range')) result.range = Number(range.toFixed(4));
      if (requested.includes('variance')) result.variance = Number(variance.toFixed(4));

      result.count = nums.length;

      return JSON.stringify(result, null, 2);
    } catch (err: any) {
      return `Statistics error: ${err.message}`;
    }
  }
};

/**
 * Date and time calculations
 */
export const dateMathTool: Tool = {
  type: 'function',
  function: {
    name: 'date_math',
    description: 'Perform date calculations: add/subtract time, find difference between dates, format dates.',
    parameters: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['add', 'subtract', 'diff', 'format', 'now'],
          description: 'Date operation to perform'
        },
        date: {
          type: 'string',
          description: 'Base date (ISO format) or omit for "now" operation'
        },
        amount: {
          type: 'number',
          description: 'Amount of time units (for add/subtract)'
        },
        unit: {
          type: 'string',
          enum: ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'],
          description: 'Time unit (for add/subtract/diff)'
        },
        targetDate: {
          type: 'string',
          description: 'Second date for diff operation'
        },
        formatStr: {
          type: 'string',
          description: 'Output format for format operation: iso, us, eu, full'
        }
      },
      required: ['operation']
    }
  },
  execute: async ({ operation, date, amount, unit, targetDate, formatStr = 'iso' }: { operation: string; date?: string; amount?: number; unit?: string; targetDate?: string; formatStr?: string }) => {
    try {
      const baseDate = date ? new Date(date) : new Date();

      switch (operation) {
        case 'add': {
          if (!amount || !unit) return 'Error: amount and unit required for add';
          const d = new Date(baseDate);
          switch (unit) {
            case 'seconds': d.setSeconds(d.getSeconds() + amount); break;
            case 'minutes': d.setMinutes(d.getMinutes() + amount); break;
            case 'hours': d.setHours(d.getHours() + amount); break;
            case 'days': d.setDate(d.getDate() + amount); break;
            case 'weeks': d.setDate(d.getDate() + amount * 7); break;
            case 'months': d.setMonth(d.getMonth() + amount); break;
            case 'years': d.setFullYear(d.getFullYear() + amount); break;
          }
          return `Result: ${d.toISOString()}`;
        }

        case 'subtract': {
          if (!amount || !unit) return 'Error: amount and unit required for subtract';
          const d = new Date(baseDate);
          const mult = -amount;
          switch (unit) {
            case 'seconds': d.setSeconds(d.getSeconds() + mult); break;
            case 'minutes': d.setMinutes(d.getMinutes() + mult); break;
            case 'hours': d.setHours(d.getHours() + mult); break;
            case 'days': d.setDate(d.getDate() + mult); break;
            case 'weeks': d.setDate(d.getDate() + mult * 7); break;
            case 'months': d.setMonth(d.getMonth() + mult); break;
            case 'years': d.setFullYear(d.getFullYear() + mult); break;
          }
          return `Result: ${d.toISOString()}`;
        }

        case 'diff': {
          if (!targetDate) return 'Error: targetDate required for diff';
          const target = new Date(targetDate);
          const diffMs = Math.abs(target.getTime() - baseDate.getTime());
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.round(diffMs / (1000 * 60 * 60));
          const diffMinutes = Math.round(diffMs / (1000 * 60));
          return JSON.stringify({
            milliseconds: diffMs,
            seconds: Math.round(diffMs / 1000),
            minutes: diffMinutes,
            hours: diffHours,
            days: diffDays,
            weeks: Number((diffDays / 7).toFixed(2)),
            months: Number((diffDays / 30.44).toFixed(2)),
            years: Number((diffDays / 365.25).toFixed(2))
          }, null, 2);
        }

        case 'format': {
          const d = baseDate;
          const formats: Record<string, string> = {
            iso: d.toISOString(),
            us: `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`,
            eu: `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`,
            full: `${d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
          };
          return formats[formatStr] || d.toISOString();
        }

        case 'now':
          return JSON.stringify({
            iso: new Date().toISOString(),
            unix: Math.floor(Date.now() / 1000),
            local: new Date().toLocaleString()
          }, null, 2);
      }
    } catch (err: any) {
      return `Date math error: ${err.message}`;
    }
  }
};

/**
 * Unit conversion tool
 */
export const unitConverterTool: Tool = {
  type: 'function',
  function: {
    name: 'convert_units',
    description: 'Convert between units: length (km, mi, m, ft, in, cm), weight (kg, lb, g, oz), temperature (C, F, K), volume (L, gal, ml, floz), speed (kmh, mph, ms, kn).',
    parameters: {
      type: 'object',
      properties: {
        value: {
          type: 'number',
          description: 'Value to convert'
        },
        from: {
          type: 'string',
          description: 'Source unit (e.g., km, kg, celsius, liter, kmh)'
        },
        to: {
          type: 'string',
          description: 'Target unit (e.g., mi, lb, fahrenheit, gallon, mph)'
        }
      },
      required: ['value', 'from', 'to']
    }
  },
  execute: async ({ value, from, to }: { value: number; from: string; to: string }) => {
    try {
      const unit = from.toLowerCase();
      const target = to.toLowerCase();

      // Temperature
      if (unit === 'celsius' || unit === 'c') {
        if (target === 'fahrenheit' || target === 'f') return `${value}°C = ${value * 9/5 + 32}°F`;
        if (target === 'kelvin' || target === 'k') return `${value}°C = ${value + 273.15}K`;
      }
      if (unit === 'fahrenheit' || unit === 'f') {
        if (target === 'celsius' || target === 'c') return `${value}°F = ${(value - 32) * 5/9}°C`;
        if (target === 'kelvin' || target === 'k') return `${value}°F = ${(value - 32) * 5/9 + 273.15}K`;
      }
      if (unit === 'kelvin' || unit === 'k') {
        if (target === 'celsius' || target === 'c') return `${value}K = ${value - 273.15}°C`;
        if (target === 'fahrenheit' || target === 'f') return `${value}K = ${(value - 273.15) * 9/5 + 32}°F`;
      }

      // Conversion factors to base unit
      const length: Record<string, number> = { km: 1000, m: 1, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254, yd: 0.9144 };
      const weight: Record<string, number> = { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, ton: 1000 };
      const volume: Record<string, number> = { l: 1, ml: 0.001, gal: 3.78541, floz: 0.0295735, cup: 0.236588, pt: 0.473176 };
      const speed: Record<string, number> = { ms: 1, kmh: 0.277778, mph: 0.44704, kn: 0.514444 };

      const maps = { length, weight, volume, speed };

      for (const map of Object.values(maps)) {
        if (unit in map && target in map) {
          const baseValue = value * map[unit];
          const result = baseValue / map[target];
          return `${value} ${unit} = ${Number(result.toFixed(6))} ${target}`;
        }
      }

      return `Error: Cannot convert from "${unit}" to "${target}". Check unit names.`;
    } catch (err: any) {
      return `Unit conversion error: ${err.message}`;
    }
  }
};
