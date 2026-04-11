import { Tool } from '../swarm/types';

/**
 * Web Scraper — fetch URL, parse HTML, extract structured data via selectors/patterns
 */
export const webScraperTool: Tool = {
  type: 'function',
  function: {
    name: 'web_scrape',
    description: 'Fetch a web page, strip HTML, and extract structured data: text content, links, images, tables, or custom patterns.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the page to scrape'
        },
        extract: {
          type: 'string',
          enum: ['text', 'links', 'images', 'headings', 'meta', 'tables', 'all'],
          description: 'What to extract from the page'
        },
        selector: {
          type: 'string',
          description: 'CSS selector to target (e.g., "article p", ".content")'
        },
        maxItems: {
          type: 'number',
          description: 'Maximum items to return (default: 50)'
        }
      },
      required: ['url']
    }
  },
  execute: async ({ url, extract = 'text', selector, maxItems = 50 }: {
    url: string; extract?: string; selector?: string; maxItems?: number
  }) => {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CortisolBot/1.0 (+https://localhost)'
        },
        signal: AbortSignal.timeout(20000)
      });

      if (!response.ok) {
        return `HTTP Error: ${response.status} ${response.statusText}`;
      }

      const html = await response.text();
      const contentType = response.headers.get('content-type') || '';

      // If it's JSON, just return it parsed
      if (contentType.includes('json') || contentType.includes('api')) {
        try {
          const json = JSON.parse(html);
          return JSON.stringify(json, null, 2);
        } catch { /* continue with HTML */ }
      }

      const result: Record<string, any> = {};

      // Extract text content (strip tags)
      if (extract === 'text' || extract === 'all') {
        const textOnly = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        result.text = textOnly.length > 5000
          ? textOnly.substring(0, 5000) + '\n... [truncated]'
          : textOnly;
      }

      // Extract links
      if (extract === 'links' || extract === 'all') {
        const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        const links: Array<{ url: string; text: string }> = [];
        let match;
        while ((match = linkRegex.exec(html)) !== null && links.length < maxItems) {
          const href = match[1];
          const text = match[2].replace(/<[^>]+>/g, '').trim();
          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            const absoluteUrl = href.startsWith('http') ? href : new URL(href, url).href;
            links.push({ url: absoluteUrl, text: text.substring(0, 100) });
          }
        }
        result.links = links;
      }

      // Extract images
      if (extract === 'images' || extract === 'all') {
        const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?/gi;
        const images: Array<{ src: string; alt: string }> = [];
        let match;
        while ((match = imgRegex.exec(html)) !== null && images.length < maxItems) {
          const src = match[1];
          const alt = match[2] || '';
          if (src && !src.startsWith('data:')) {
            const absoluteSrc = src.startsWith('http') ? src : new URL(src, url).href;
            images.push({ src: absoluteSrc, alt });
          }
        }
        result.images = images;
      }

      // Extract headings
      if (extract === 'headings' || extract === 'all') {
        const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
        const headings: Array<{ level: number; text: string }> = [];
        let match;
        while ((match = headingRegex.exec(html)) !== null && headings.length < maxItems) {
          headings.push({
            level: parseInt(match[1]),
            text: match[2].replace(/<[^>]+>/g, '').trim()
          });
        }
        result.headings = headings;
      }

      // Extract meta tags
      if (extract === 'meta' || extract === 'all') {
        const meta: Record<string, string> = {};
        const metaRegex = /<meta[^>]+(?:name|property)=["']([^"']+)["'][^>]+content=["']([^"']+)["']/gi;
        let match;
        while ((match = metaRegex.exec(html)) !== null) {
          meta[match[1]] = match[2];
        }
        // Also grab title
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) meta.title = titleMatch[1].trim();
        result.meta = meta;
      }

      // Extract tables
      if (extract === 'tables') {
        const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
        const tables: any[] = [];
        let tableMatch;
        while ((tableMatch = tableRegex.exec(html)) !== null && tables.length < maxItems) {
          const rows = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
          const tableData: string[][] = [];
          for (const row of rows) {
            const cells = row.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi) || [];
            tableData.push(cells.map(c => c.replace(/<[^>]+>/g, '').trim()));
          }
          tables.push(tableData);
        }
        result.tables = tables;
      }

      return JSON.stringify({
        sourceUrl: url,
        extracted: extract,
        ...result
      }, null, 2);
    } catch (err: any) {
      return `Web scraper error: ${err.message}`;
    }
  }
};

/**
 * API Builder — construct and document REST/GraphQL APIs
 */
export const apiBuilderTool: Tool = {
  type: 'function',
  function: {
    name: 'api_builder',
    description: 'Generate API client code, test endpoints, or document API schemas. Supports REST and GraphQL.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['generate_client', 'test_endpoint', 'generate_docs', 'validate_schema'],
          description: 'API builder action'
        },
        url: {
          type: 'string',
          description: 'API base URL or endpoint'
        },
        language: {
          type: 'string',
          enum: ['typescript', 'python', 'curl', 'javascript'],
          description: 'Target language for generated code'
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          description: 'HTTP method'
        },
        schema: {
          type: 'string',
          description: 'JSON schema or request body definition'
        },
        query: {
          type: 'string',
          description: 'For GraphQL: the query string'
        }
      },
      required: ['action']
    }
  },
  execute: async ({ action, url = '', language = 'typescript', method = 'GET', schema, query }: {
    action: string; url?: string; language?: string; method?: string; schema?: string; query?: string
  }) => {
    try {
      switch (action) {
        case 'generate_client': {
          if (!url) return 'Error: url required for generate_client';

          const safeName = url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);

          switch (language) {
            case 'typescript':
              return `// Auto-generated API client for: ${url}

interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

class ${safeName}Client {
  private config: ApiConfig;

  constructor(baseUrl: string, headers?: Record<string, string>) {
    this.config = {
      baseUrl,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', ...headers }
    };
  }

  async ${method.toLowerCase()}<T>(path: string, body?: any): Promise<T> {
    const response = await fetch(\`\${this.config.baseUrl}\${path}\`, {
      method: '${method}',
      headers: this.config.headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.status} \${response.statusText}\`);
    }

    return response.json() as Promise<T>;
  }
}

export const api = new ${safeName}Client('${url}');
export default api;`;

            case 'python':
              return `# Auto-generated API client for: ${url}

import requests
from typing import Any, Dict, Optional

class ${safeName}Client:
    def __init__(self, base_url: str = "${url}", headers: Optional[Dict[str, str]] = None):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        if headers:
            self.session.headers.update(headers)

    def ${method.toLowerCase()}(self, path: str, body: Optional[Dict] = None) -> Dict[str, Any]:
        response = self.session.${method.toLowerCase()}(
            f"{{self.base_url}}{{path}}",
            json=body,
            timeout=10
        )
        response.raise_for_status()
        return response.json()

api = ${safeName}Client()
`;

            case 'curl':
              return `# Auto-generated curl commands for: ${url}\n\n`;

            case 'javascript':
              return `// Auto-generated API client for: ${url}

class ${safeName}Client {
  constructor(baseUrl, headers = {}) {
    this.baseUrl = baseUrl;
    this.headers = { 'Content-Type': 'application/json', ...headers };
  }

  async ${method.toLowerCase()}(path, body) {
    const res = await fetch(\`\${this.baseUrl}\${path}\`, {
      method: '${method}',
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error(\`API \${res.status}\`);
    return res.json();
  }
}

const api = new ${safeName}Client('${url}');
module.exports = api;`;
          }
          break;
        }

        case 'test_endpoint': {
          if (!url) return 'Error: url required for test_endpoint';
          const start = Date.now();
          const res = await fetch(url, { method, signal: AbortSignal.timeout(10000) });
          const body = await res.text();
          const duration = Date.now() - start;
          return JSON.stringify({
            status: res.status,
            statusText: res.statusText,
            responseTime: `${duration}ms`,
            contentType: res.headers.get('content-type'),
            bodySize: `${body.length} bytes`,
            bodyPreview: body.substring(0, 2000)
          }, null, 2);
        }

        case 'generate_docs': {
          if (!schema) return 'Error: schema required for generate_docs';
          try {
            const parsed = JSON.parse(schema);
            let doc = `# API Documentation\n\n## Schema\n\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\`\n`;
            if (parsed.properties) {
              doc += '\n## Fields\n\n| Field | Type | Required | Description |\n|-------|------|----------|-------------|\n';
              const required = parsed.required || [];
              for (const [key, val] of Object.entries(parsed.properties)) {
                const v = val as any;
                doc += `| \`${key}\` | ${v.type || 'any'} | ${required.includes(key) ? '✅' : '❌'} | ${v.description || '-'} |\n`;
              }
            }
            return doc;
          } catch {
            return `Error: Invalid JSON schema`;
          }
        }

        case 'validate_schema': {
          if (!schema) return 'Error: schema required for validate_schema';
          try {
            const parsed = JSON.parse(schema);
            return `✅ Valid JSON Schema\n\nType: ${typeof parsed}\nKeys: ${Object.keys(parsed).join(', ')}\n\n${JSON.stringify(parsed, null, 2)}`;
          } catch (err: any) {
            return `❌ Invalid JSON Schema: ${err.message}`;
          }
        }
      }

      return `Unknown action: ${action}`;
    } catch (err: any) {
      return `API Builder error: ${err.message}`;
    }
  }
};

/**
 * CSS/Style Generator — generate CSS, Tailwind classes, or component styles
 */
export const styleGeneratorTool: Tool = {
  type: 'function',
  function: {
    name: 'style_generator',
    description: 'Generate CSS styles, Tailwind utility classes, or component layouts from descriptions. Supports themes, color palettes, responsive breakpoints.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['css', 'tailwind', 'palette', 'component', 'animation'],
          description: 'Style generation type'
        },
        description: {
          type: 'string',
          description: 'Description of the desired style (e.g., "dark card with red border and shadow")'
        },
        baseColor: {
          type: 'string',
          description: 'Base hex color for palette generation (default: #3b82f6)'
        },
        componentName: {
          type: 'string',
          description: 'Component name (e.g., "button", "card", "navbar")'
        }
      },
      required: ['type']
    }
  },
  execute: async ({ type, description = '', baseColor = '#3b82f6', componentName = 'component' }: {
    type: string; description?: string; baseColor?: string; componentName?: string
  }) => {
    try {
      switch (type) {
        case 'css': {
          const props = description.toLowerCase();
          let css = `.${componentName} {\n`;
          if (props.includes('dark') || props.includes('dark background')) css += `  background: #1a1a2e;\n  color: #eee;\n`;
          if (props.includes('border')) css += `  border: 2px solid ${baseColor};\n`;
          if (props.includes('shadow')) css += `  box-shadow: 0 4px 20px rgba(0,0,0,0.15);\n`;
          if (props.includes('rounded') || props.includes('round')) css += `  border-radius: 12px;\n`;
          if (props.includes('flex')) css += `  display: flex;\n  gap: 1rem;\n`;
          if (props.includes('grid')) css += `  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n`;
          if (props.includes('center')) css += `  text-align: center;\n  justify-content: center;\n`;
          if (props.includes('padding') || props.includes('padded')) css += `  padding: 1.5rem;\n`;
          if (props.includes('gradient')) css += `  background: linear-gradient(135deg, ${baseColor}, ${adjustHue(baseColor, 30)});\n`;
          if (props.includes('glass') || props.includes('glassmorphism')) css += `  background: rgba(255,255,255,0.1);\n  backdrop-filter: blur(10px);\n  border: 1px solid rgba(255,255,255,0.2);\n`;
          if (css === `.${componentName} {\n`) css += `  /* Add your styles */\n`;
          css += `}`;
          return css;
        }

        case 'tailwind': {
          const props = description.toLowerCase();
          let classes: string[] = [];
          if (props.includes('dark')) classes.push('bg-gray-900', 'text-white');
          if (props.includes('card')) classes.push('bg-white', 'rounded-lg', 'shadow-md', 'p-6');
          if (props.includes('button')) classes.push('px-4', 'py-2', 'rounded', 'font-semibold', 'transition');
          if (props.includes('primary')) classes.push(`bg-blue-600`, 'hover:bg-blue-700');
          if (props.includes('danger') || props.includes('red')) classes.push('bg-red-600', 'hover:bg-red-700');
          if (props.includes('success') || props.includes('green')) classes.push('bg-green-600', 'hover:bg-green-700');
          if (props.includes('flex')) classes.push('flex');
          if (props.includes('grid')) classes.push('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
          if (props.includes('center')) classes.push('items-center', 'justify-center');
          if (props.includes('full') || props.includes('w-full')) classes.push('w-full');
          if (props.includes('gap')) classes.push('gap-4');
          if (props.includes('padding')) classes.push('p-4');
          if (props.includes('margin')) classes.push('m-4');
          if (props.includes('text') || props.includes('font')) classes.push('text-lg', 'font-bold');
          if (props.includes('border')) classes.push('border-2', 'border-gray-300');
          if (props.includes('shadow')) classes.push('shadow-lg');
          if (props.includes('rounded')) classes.push('rounded-xl');
          if (props.includes('gradient')) classes.push('bg-gradient-to-r', 'from-blue-500', 'to-purple-600');
          if (classes.length === 0) classes.push('/* describe: dark, card, button, flex, grid, center, etc */');
          return `class="${classes.join(' ')}"`;
        }

        case 'palette': {
          const hex = baseColor.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);

          const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(weight => {
            const factor = weight / 500;
            const nr = Math.min(255, Math.round(r * factor + 255 * (1 - factor * 0.5)));
            const ng = Math.min(255, Math.round(g * factor + 255 * (1 - factor * 0.5)));
            const nb = Math.min(255, Math.round(b * factor + 255 * (1 - factor * 0.5)));
            return { weight: `-${weight}`, hex: `#${nr.toString(16).padStart(2,'0')}${ng.toString(16).padStart(2,'0')}${nb.toString(16).padStart(2,'0')}` };
          });

          const complementary = `#${(255-r).toString(16).padStart(2,'0')}${(255-g).toString(16).padStart(2,'0')}${(255-b).toString(16).padStart(2,'0')}`;
          const analogous1 = `#${Math.min(255,r+30).toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
          const analogous2 = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${Math.min(255,b+30).toString(16).padStart(2,'0')}`;

          return JSON.stringify({
            base: baseColor,
            shades,
            complementary,
            analogous: [analogous1, analogous2],
            usage: {
              primary: shades[4].hex,
              secondary: shades[6].hex,
              accent: analogous1,
              background: shades[0].hex,
              text: shades[9].hex
            }
          }, null, 2);
        }

        case 'component': {
          const name = componentName.toLowerCase();
          switch (name) {
            case 'button':
              return `.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  font-weight: 600;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.btn:active { transform: translateY(0); }
.btn-primary { background: ${baseColor}; color: white; }
.btn-secondary { background: #6b7280; color: white; }
.btn-danger { background: #ef4444; color: white; }
.btn-ghost { background: transparent; border: 1px solid #d1d5db; }`;

            case 'card':
              return `.card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: box-shadow 0.3s;
}
.card:hover { box-shadow: 0 10px 30px rgba(0,0,0,0.12); }
.card-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
.card-body { padding: 1.5rem; }
.card-footer { padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; background: #f9fafb; }`;

            case 'navbar':
              return `.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: ${baseColor};
  color: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.nav-brand { font-size: 1.25rem; font-weight: 700; }
.nav-links { display: flex; gap: 1.5rem; list-style: none; }
.nav-links a { color: rgba(255,255,255,0.85); text-decoration: none; font-weight: 500; }
.nav-links a:hover { color: white; }`;

            case 'modal':
              return `.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
.modal-body { padding: 1.5rem; }
.modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 0.75rem; }`;

            default:
              return `/* Component: ${componentName} */\n.${componentName} {\n  /* TODO: Describe your component style */\n}`;
          }
        }

        case 'animation': {
          return `@keyframes ${componentName || 'fade'}In {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes ${componentName || 'slide'}In {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-fade { animation: fadeIn 0.5s ease-out; }
.animate-slide { animation: slideIn 0.4s ease-out; }
.animate-pulse { animation: pulse 2s infinite; }
.animate-spin { animation: spin 1s linear infinite; }
.animate-bounce { animation: bounce 1s ease-in-out infinite; }`;
        }

        default:
          return `Unknown style type: ${type}`;
      }
    } catch (err: any) {
      return `Style generator error: ${err.message}`;
    }
  }
};

function adjustHue(hex: string, degrees: number): string {
  // Simple hue shift approximation
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  const nr = Math.min(255, r + Math.round(degrees * 0.5));
  const ng = Math.min(255, g + Math.round(degrees * 0.3));
  const nb = Math.min(255, b + Math.round(degrees * 0.7));
  return `#${nr.toString(16).padStart(2,'0')}${ng.toString(16).padStart(2,'0')}${nb.toString(16).padStart(2,'0')}`;
}
