import { Tool } from '@/lib/swarm/types';
import { getNestedValue, isValidJson, safeJsonParse } from '@/lib/utils/data-utils';

/**
 * Query JSON data using dot notation paths
 */
export const jsonQueryTool: Tool = {
  type: 'function',
  function: {
    name: 'json_query',
    description: 'Query a JSON object using dot notation paths. Extract specific fields from nested JSON data.',
    parameters: {
      type: 'object',
      properties: {
        jsonData: {
          type: 'string',
          description: 'The JSON string to query'
        },
        path: {
          type: 'string',
          description: 'Dot notation path (e.g., "user.profile.name" or "items[0].id")'
        },
        pretty: {
          type: 'boolean',
          description: 'Whether to pretty-print the result'
        }
      },
      required: ['jsonData', 'path']
    }
  },
  execute: async ({ jsonData, path, pretty = true }: { jsonData: string; path: string; pretty?: boolean }) => {
    if (!isValidJson(jsonData)) {
      return 'Error: Invalid JSON input';
    }

    try {
      const obj = JSON.parse(jsonData);
      const result = getNestedValue(obj, path);

      if (result === undefined) {
        return `Path "${path}" not found in JSON`;
      }

      if (typeof result === 'object') {
        return pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result);
      }

      return String(result);
    } catch (err: any) {
      return `Query error: ${err.message}`;
    }
  }
};

/**
 * Parse and transform CSV data
 */
export const csvParserTool: Tool = {
  type: 'function',
  function: {
    name: 'csv_parse',
    description: 'Parse CSV text data into structured JSON or extract specific columns.',
    parameters: {
      type: 'object',
      properties: {
        csvData: {
          type: 'string',
          description: 'The CSV text data to parse'
        },
        delimiter: {
          type: 'string',
          description: 'Column delimiter (default: comma)'
        },
        output: {
          type: 'string',
          enum: ['json', 'table', 'columns'],
          description: 'Output format'
        }
      },
      required: ['csvData']
    }
  },
  execute: async ({ csvData, delimiter = ',', output = 'json' }: { csvData: string; delimiter?: string; output?: string }) => {
    try {
      const lines = csvData.trim().split('\n');
      if (lines.length === 0) return 'Error: Empty CSV data';

      const headers = lines[0].split(delimiter).map(h => h.trim());
      const rows: Record<string, string>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        rows.push(row);
      }

      if (output === 'columns') {
        const cols: Record<string, string[]> = {};
        headers.forEach(h => {
          cols[h] = rows.map(r => r[h]);
        });
        return JSON.stringify(cols, null, 2);
      }

      if (output === 'table') {
        const headerLine = headers.join(' | ');
        const separator = headers.map(() => '---').join(' | ');
        const dataLines = rows.map(r => headers.map(h => r[h]).join(' | '));
        return [headerLine, separator, ...dataLines].join('\n');
      }

      return JSON.stringify(rows, null, 2);
    } catch (err: any) {
      return `CSV parse error: ${err.message}`;
    }
  }
};

/**
 * Compare two JSON/text values and show differences
 */
export const diffCompareTool: Tool = {
  type: 'function',
  function: {
    name: 'diff_compare',
    description: 'Compare two JSON strings or text values and highlight differences.',
    parameters: {
      type: 'object',
      properties: {
        valueA: {
          type: 'string',
          description: 'First value to compare'
        },
        valueB: {
          type: 'string',
          description: 'Second value to compare'
        },
        format: {
          type: 'string',
          enum: ['text', 'json'],
          description: 'Interpret values as text or JSON'
        }
      },
      required: ['valueA', 'valueB']
    }
  },
  execute: async ({ valueA, valueB, format = 'text' }: { valueA: string; valueB: string; format?: string }) => {
    try {
      if (format === 'json') {
        const objA = isValidJson(valueA) ? JSON.parse(valueA) : valueA;
        const objB = isValidJson(valueB) ? JSON.parse(valueB) : valueB;

        const keysA = new Set(Object.keys(objA));
        const keysB = new Set(Object.keys(objB));
        const allKeys = new Set([...keysA, ...keysB]);

        const diff: Record<string, any> = {};
        for (const key of allKeys) {
          const valA = objA[key];
          const valB = objB[key];
          if (valA !== valB) {
            diff[key] = {
              left: valA !== undefined ? valA : '[MISSING]',
              right: valB !== undefined ? valB : '[MISSING]'
            };
          }
        }

        if (Object.keys(diff).length === 0) {
          return 'No differences found. Values are identical.';
        }

        return JSON.stringify(diff, null, 2);
      }

      // Text diff
      if (valueA === valueB) return 'No differences found. Values are identical.';

      const linesA = valueA.split('\n');
      const linesB = valueB.split('\n');
      const maxLines = Math.max(linesA.length, linesB.length);

      const diffLines: string[] = [];
      for (let i = 0; i < maxLines; i++) {
        const a = linesA[i] || '';
        const b = linesB[i] || '';
        if (a !== b) {
          diffLines.push(`Line ${i + 1}:`);
          if (a) diffLines.push(`  - ${a}`);
          if (b) diffLines.push(`  + ${b}`);
        }
      }

      return diffLines.length > 0
        ? diffLines.join('\n')
        : 'No differences found.';
    } catch (err: any) {
      return `Diff error: ${err.message}`;
    }
  }
};

/**
 * Transform and filter JSON data
 */
export const dataTransformTool: Tool = {
  type: 'function',
  function: {
    name: 'data_transform',
    description: 'Transform, filter, map, or sort JSON array data. Apply operations like filter, map, sort, limit.',
    parameters: {
      type: 'object',
      properties: {
        jsonData: {
          type: 'string',
          description: 'JSON array string to transform'
        },
        operation: {
          type: 'string',
          enum: ['filter', 'map', 'sort', 'limit', 'reverse', 'flatten'],
          description: 'Transformation operation'
        },
        query: {
          type: 'string',
          description: 'For filter: dot-path and value (e.g., "age>30" or "status=active"). For sort: dot-path (e.g., "name" or "-age" for desc).'
        },
        fields: {
          type: 'string',
          description: 'For map: comma-separated field names to pick (e.g., "name,email")'
        }
      },
      required: ['jsonData', 'operation']
    }
  },
  execute: async ({ jsonData, operation, query, fields }: { jsonData: string; operation: string; query?: string; fields?: string }) => {
    try {
      const data = JSON.parse(jsonData);
      if (!Array.isArray(data)) return 'Error: Input must be a JSON array';

      let result = [...data];

      switch (operation) {
        case 'filter': {
          if (!query) return 'Error: query parameter required for filter. Format: "field=value" or "field>number"';
          const [fieldPath, opAndVal] = query.split(/([><=!]=?)/);
          if (!fieldPath || !opAndVal) return `Error: Invalid filter query. Use "field=value" or "field>30"`;

          const op = opAndVal;
          const compareVal = isNaN(Number(opAndVal.slice(1))) ? opAndVal.slice(1) : Number(opAndVal.slice(1));

          result = result.filter(item => {
            const val = getNestedValue(item, fieldPath.trim());
            switch (op) {
              case '=': case '==': return val == compareVal;
              case '>': return val > compareVal;
              case '<': return val < compareVal;
              case '>=': return val >= compareVal;
              case '<=': return val <= compareVal;
              case '!=': return val != compareVal;
              default: return false;
            }
          });
          break;
        }

        case 'map': {
          if (!fields) return 'Error: fields parameter required for map. Comma-separated field names.';
          const fieldList = fields.split(',').map(f => f.trim());
          result = result.map(item => {
            const picked: Record<string, any> = {};
            fieldList.forEach(f => {
              picked[f] = getNestedValue(item, f);
            });
            return picked;
          });
          break;
        }

        case 'sort': {
          if (!query) return 'Error: query parameter required for sort. Field path. Prefix with "-" for descending.';
          const desc = query.startsWith('-');
          const fieldPath = desc ? query.slice(1) : query;
          result.sort((a, b) => {
            const valA = getNestedValue(a, fieldPath);
            const valB = getNestedValue(b, fieldPath);
            const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
            return desc ? -cmp : cmp;
          });
          break;
        }

        case 'limit': {
          const limit = query ? parseInt(query, 10) : 10;
          result = result.slice(0, limit);
          break;
        }

        case 'reverse':
          result = result.reverse();
          break;

        case 'flatten': {
          const flatField = query || '';
          result = result.flatMap(item => {
            const val = getNestedValue(item, flatField);
            return Array.isArray(val) ? val : [val];
          });
          break;
        }
      }

      return JSON.stringify(result, null, 2);
    } catch (err: any) {
      return `Transform error: ${err.message}`;
    }
  }
};
