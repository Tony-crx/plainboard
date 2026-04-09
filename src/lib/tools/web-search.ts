import { Tool } from '@/lib/swarm/types';

// Simple web search fallback since we have no paid serper keys setup
export const webSearchTool: Tool = {
  type: 'function',
  function: {
    name: 'web_search',
    description: 'Search the web for current information',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return'
        }
      },
      required: ['query']
    }
  },
  execute: async ({ query, maxResults = 5 }: { query: string; maxResults?: number }) => {
    // In a real env this would map to a proper search API
    // We are mocking this or hitting an open API route if available
    try {
        const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
        const data = await response.json();
        return data.RelatedTopics?.slice(0, maxResults) || `No concrete search results. Simulated response for: ${query}`;
    } catch(err: any) {
        return `Web Search API failed: ${err.message}`;
    }
  }
};
