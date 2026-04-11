import { Tool } from '@/lib/swarm/types';
import { truncate } from '@/lib/utils/string-utils';

/**
 * Summarize long text
 */
export const textSummarizeTool: Tool = {
  type: 'function',
  function: {
    name: 'text_summarize',
    description: 'Summarize text by extracting key sentences or truncating to a word/character limit.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to summarize'
        },
        method: {
          type: 'string',
          enum: ['sentences', 'words', 'chars', 'percentage'],
          description: 'Summarization method'
        },
        limit: {
          type: 'number',
          description: 'Limit value (number of sentences/words/chars, or percentage 1-100)'
        }
      },
      required: ['text']
    }
  },
  execute: async ({ text, method = 'words', limit = 100 }: { text: string; method?: string; limit?: number }) => {
    try {
      switch (method) {
        case 'sentences': {
          const sentences = text.split(/(?<=[.!?])\s+/);
          const count = Math.min(limit, sentences.length);
          return sentences.slice(0, count).join(' ');
        }

        case 'words': {
          const words = text.split(/\s+/);
          return words.slice(0, limit).join(' ') + (words.length > limit ? '...' : '');
        }

        case 'chars': {
          return truncate(text, limit);
        }

        case 'percentage': {
          const targetLength = Math.floor(text.length * (limit / 100));
          const sentences = text.split(/(?<=[.!?])\s+/);
          let result = '';
          for (const sentence of sentences) {
            if ((result + sentence).length > targetLength) break;
            result += (result ? ' ' : '') + sentence;
          }
          return result;
        }

        default:
          return 'Error: Unknown summarization method';
      }
    } catch (err: any) {
      return `Summarize error: ${err.message}`;
    }
  }
};

/**
 * Convert text between formats
 */
export const textConvertTool: Tool = {
  type: 'function',
  function: {
    name: 'text_convert',
    description: 'Convert text format: uppercase, lowercase, title case, camelCase, snake_case, kebab-case, base64 encode/decode.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to convert'
        },
        format: {
          type: 'string',
          enum: ['upper', 'lower', 'title', 'camel', 'snake', 'kebab', 'base64_encode', 'base64_decode', 'reverse'],
          description: 'Target format'
        }
      },
      required: ['text', 'format']
    }
  },
  execute: async ({ text, format }: { text: string; format: string }) => {
    try {
      switch (format) {
        case 'upper': return text.toUpperCase();
        case 'lower': return text.toLowerCase();
        case 'title': return text.replace(/\b\w/g, c => c.toUpperCase());
        case 'camel': return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (w, i) => i === 0 ? w.toLowerCase() : w.toUpperCase()).replace(/\s+/g, '');
        case 'snake': return text.toLowerCase().replace(/\s+/g, '_');
        case 'kebab': return text.toLowerCase().replace(/\s+/g, '-');
        case 'base64_encode': return Buffer.from(text).toString('base64');
        case 'base64_decode': return Buffer.from(text, 'base64').toString('utf-8');
        case 'reverse': return text.split('').reverse().join('');
        default: return `Error: Unknown format "${format}"`;
      }
    } catch (err: any) {
      return `Text convert error: ${err.message}`;
    }
  }
};

/**
 * Extract patterns from text (emails, URLs, phone numbers, etc.)
 */
export const textExtractTool: Tool = {
  type: 'function',
  function: {
    name: 'text_extract',
    description: 'Extract specific patterns from text: emails, URLs, phone numbers, hashtags, mentions, numbers, or custom regex.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to extract patterns from'
        },
        pattern: {
          type: 'string',
          enum: ['email', 'url', 'phone', 'hashtag', 'mention', 'number', 'date', 'custom'],
          description: 'Pattern to extract'
        },
        regex: {
          type: 'string',
          description: 'Custom regex pattern (required when pattern="custom")'
        }
      },
      required: ['text', 'pattern']
    }
  },
  execute: async ({ text, pattern, regex }: { text: string; pattern: string; regex?: string }) => {
    try {
      let result: string[] = [];

      switch (pattern) {
        case 'email':
          result = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
          break;
        case 'url':
          result = text.match(/https?:\/\/[^\s<>"'`)]+/g) || [];
          break;
        case 'phone':
          result = text.match(/[\+]?[\d\s\-\(\)]{7,20}/g) || [];
          break;
        case 'hashtag':
          result = text.match(/#[\w]+/g) || [];
          break;
        case 'mention':
          result = text.match(/@[\w]+/g) || [];
          break;
        case 'number':
          result = text.match(/-?\d+\.?\d*/g) || [];
          break;
        case 'date':
          result = text.match(/\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}/g) || [];
          break;
        case 'custom':
          if (!regex) return 'Error: regex parameter required when pattern="custom"';
          result = text.match(new RegExp(regex, 'g')) || [];
          break;
      }

      if (result.length === 0) return 'No matches found.';
      return `Found ${result.length} match(es):\n${result.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;
    } catch (err: any) {
      return `Extract error: ${err.message}`;
    }
  }
};

/**
 * Replace text using patterns or simple search
 */
export const textReplaceTool: Tool = {
  type: 'function',
  function: {
    name: 'text_replace',
    description: 'Find and replace text. Supports simple string replacement or regex-based replacement.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Source text'
        },
        find: {
          type: 'string',
          description: 'Text or regex pattern to find'
        },
        replace: {
          type: 'string',
          description: 'Replacement text'
        },
        useRegex: {
          type: 'boolean',
          description: 'Treat find parameter as regex'
        },
        caseSensitive: {
          type: 'boolean',
          description: 'Case-sensitive matching'
        }
      },
      required: ['text', 'find', 'replace']
    }
  },
  execute: async ({ text, find, replace, useRegex = false, caseSensitive = true }: { text: string; find: string; replace: string; useRegex?: boolean; caseSensitive?: boolean }) => {
    try {
      if (useRegex) {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(find, flags);
        return text.replace(regex, replace);
      }

      if (caseSensitive) {
        return text.split(find).join(replace);
      }

      const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      return text.replace(regex, replace);
    } catch (err: any) {
      return `Replace error: ${err.message}`;
    }
  }
};

/**
 * Count and analyze text statistics
 */
export const textStatsTool: Tool = {
  type: 'function',
  function: {
    name: 'text_stats',
    description: 'Analyze text and return statistics: character count, word count, line count, sentence count, reading time, etc.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to analyze'
        }
      },
      required: ['text']
    }
  },
  execute: async ({ text }: { text: string }) => {
    try {
      const chars = text.length;
      const charsNoSpaces = text.replace(/\s/g, '').length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const lines = text.split(/\r?\n/).length;
      const sentences = text.split(/[.!?]+/).filter(Boolean).length;
      const paragraphs = text.split(/\n\s*\n/).filter(Boolean).length;
      const avgWordLength = words > 0 ? (charsNoSpaces / words).toFixed(1) : '0';
      const readingTimeMin = Math.ceil(words / 200);
      const speakingTimeMin = Math.ceil(words / 130);

      return JSON.stringify({
        characters: chars,
        charactersNoSpaces: charsNoSpaces,
        words,
        lines,
        sentences,
        paragraphs: paragraphs || 1,
        avgWordLength: `${avgWordLength} chars`,
        readingTime: `${readingTimeMin} min (200 wpm)`,
        speakingTime: `${speakingTimeMin} min (130 wpm)`
      }, null, 2);
    } catch (err: any) {
      return `Text stats error: ${err.message}`;
    }
  }
};
