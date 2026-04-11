import { Tool } from '@/lib/swarm/types';
import { formatBytes } from '@/lib/utils/crypto-utils';
import { formatDuration } from '@/lib/utils/format-utils';

/**
 * Execute HTTP requests with full control
 */
export const httpRequestTool: Tool = {
  type: 'function',
  function: {
    name: 'http_request',
    description: 'Make HTTP requests (GET, POST, PUT, DELETE, PATCH) to any URL with custom headers and body.',
    parameters: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
          description: 'HTTP method'
        },
        url: {
          type: 'string',
          description: 'Full URL to request'
        },
        headers: {
          type: 'string',
          description: 'JSON string of headers (e.g., {"Authorization": "Bearer xyz"})'
        },
        body: {
          type: 'string',
          description: 'Request body (for POST/PUT/PATCH)'
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 10000)'
        }
      },
      required: ['method', 'url']
    }
  },
  execute: async ({ method, url, headers, body, timeout = 10000 }: { method: string; url: string; headers?: string; body?: string; timeout?: number }) => {
    try {
      const options: RequestInit = {
        method,
        headers: headers ? JSON.parse(headers) : { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(timeout),
      };

      if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        options.body = body;
      }

      const startTime = Date.now();
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const text = await response.text();
      const size = new Blob([text]).size;

      return JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        duration: formatDuration(duration),
        size: formatBytes(size),
        headers: responseHeaders,
        body: text.length > 5000 ? text.substring(0, 5000) + '\n... [truncated]' : text
      }, null, 2);
    } catch (err: any) {
      return `HTTP Request error: ${err.message}`;
    }
  }
};

/**
 * Fetch and parse content from a URL
 */
export const urlFetchTool: Tool = {
  type: 'function',
  function: {
    name: 'url_fetch',
    description: 'Fetch content from a URL and return the body text. Useful for reading web pages, APIs, or raw files.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to fetch content from'
        },
        maxLength: {
          type: 'number',
          description: 'Maximum characters to return (default: 5000)'
        },
        format: {
          type: 'string',
          enum: ['text', 'json'],
          description: 'Parse response as text or JSON'
        }
      },
      required: ['url']
    }
  },
  execute: async ({ url, maxLength = 5000, format = 'text' }: { url: string; maxLength?: number; format?: string }) => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });

      if (!response.ok) {
        return `Error: HTTP ${response.status} ${response.statusText}`;
      }

      if (format === 'json') {
        const data = await response.json();
        const text = JSON.stringify(data, null, 2);
        return text.length > maxLength ? text.substring(0, maxLength) + '\n... [truncated]' : text;
      }

      const text = await response.text();
      return text.length > maxLength ? text.substring(0, maxLength) + '\n... [truncated]' : text;
    } catch (err: any) {
      return `Fetch error: ${err.message}`;
    }
  }
};

/**
 * Test an API endpoint with common scenarios
 */
export const apiTesterTool: Tool = {
  type: 'function',
  function: {
    name: 'api_test',
    description: 'Test an API endpoint and analyze the response: status, timing, headers, schema.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'API endpoint URL'
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'HTTP method'
        },
        expectedStatus: {
          type: 'number',
          description: 'Expected HTTP status code'
        }
      },
      required: ['url']
    }
  },
  execute: async ({ url, method = 'GET', expectedStatus = 200 }: { url: string; method?: string; expectedStatus?: number }) => {
    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method,
        signal: AbortSignal.timeout(15000),
      });
      const duration = Date.now() - startTime;

      const body = await response.text();
      let parsedBody: any = null;
      try { parsedBody = JSON.parse(body); } catch { /* not JSON */ }

      const result = {
        url,
        method,
        status: response.status,
        expectedStatus,
        passed: response.status === expectedStatus,
        responseTime: `${duration}ms`,
        contentType: response.headers.get('content-type') || 'unknown',
        bodySize: `${body.length} bytes`,
        bodyPreview: typeof parsedBody === 'object'
          ? JSON.stringify(parsedBody, null, 2).substring(0, 1000)
          : body.substring(0, 500)
      };

      return JSON.stringify(result, null, 2);
    } catch (err: any) {
      return `API Test error: ${err.message}`;
    }
  }
};

/**
 * Send webhook notifications
 */
export const webhookSenderTool: Tool = {
  type: 'function',
  function: {
    name: 'webhook_send',
    description: 'Send a webhook payload to a URL (Discord, Slack, custom endpoints).',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Webhook URL'
        },
        payload: {
          type: 'string',
          description: 'JSON string of the payload to send'
        },
        contentType: {
          type: 'string',
          enum: ['application/json', 'text/plain', 'application/x-www-form-urlencoded'],
          description: 'Content-Type header'
        }
      },
      required: ['url', 'payload']
    }
  },
  execute: async ({ url, payload, contentType = 'application/json' }: { url: string; payload: string; contentType?: string }) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body: payload,
        signal: AbortSignal.timeout(10000),
      });

      return JSON.stringify({
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      }, null, 2);
    } catch (err: any) {
      return `Webhook send error: ${err.message}`;
    }
  }
};
