// Tool deferral system -- saves context tokens by loading tools on-demand
// Inspired by Claude Code's ToolSearchTool pattern

import { Tool } from '../swarm/types';

/**
 * Filter tools into "loaded" vs "deferred" categories.
 * Deferred tools are not shown in the initial prompt, saving context tokens.
 * They get loaded on-demand via a tool search mechanism.
 */
export function partitionTools(
  tools: Tool[]
): { loaded: Tool[]; deferred: Tool[] } {
  const loaded: Tool[] = [];
  const deferred: Tool[] = [];

  for (const tool of tools) {
    // Always load tools marked as alwaysLoad
    if (tool.alwaysLoad) {
      loaded.push(tool);
      continue;
    }

    // Defer tools marked as shouldDefer
    if (tool.shouldDefer) {
      deferred.push(tool);
      continue;
    }

    // Default: load the tool (backward compatible with existing tools)
    loaded.push(tool);
  }

  return { loaded, deferred };
}

/**
 * Build the tool schema for only loaded tools (saves context tokens)
 */
export function buildLoadedToolSchema(tools: Tool[]): any[] {
  return tools
    .filter(t => t.isEnabled?.() !== false)
    .map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.function.name,
        description: tool.dynamicDescription?.() || tool.function.description,
        parameters: tool.function.parameters,
      },
    }));
}

/**
 * Search deferred tools by name or description
 */
export function searchDeferredTools(
  deferredTools: Tool[],
  query: string
): Tool[] {
  const lowerQuery = query.toLowerCase();
  return deferredTools.filter(tool => {
    const name = tool.function.name.toLowerCase();
    const desc = (tool.dynamicDescription?.() || tool.function.description).toLowerCase();
    return name.includes(lowerQuery) || desc.includes(lowerQuery);
  });
}

/**
 * Create a tool_search tool that allows the agent to find and load deferred tools
 */
export function createToolSearchTool(deferredTools: Tool[]): Tool {
  return {
    type: 'function',
    function: {
      name: 'tool_search',
      description: 'Search for and load a tool by name or description. Use this when you need a tool that is not currently available in your toolset.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Name or description of the tool to search for',
          },
        },
        required: ['query'],
      },
    },
    execute: (args: { query: string }) => {
      const found = searchDeferredTools(deferredTools, args.query);
      if (found.length === 0) {
        return `No tools found for query: "${args.query}"`;
      }
      return found.map(t => {
        const params = JSON.stringify(t.function.parameters?.properties || {});
        return `- **${t.function.name}**: ${t.function.description}\n  Parameters: ${params}`;
      }).join('\n');
    },
  };
}

/**
 * Get tool usage statistics
 */
export function getToolStats(tools: Tool[]): {
  total: number;
  enabled: number;
  deferred: number;
  readOnly: number;
  concurrencySafe: number;
} {
  return {
    total: tools.length,
    enabled: tools.filter(t => t.isEnabled?.() !== false).length,
    deferred: tools.filter(t => t.shouldDefer).length,
    readOnly: tools.filter(t => t.isReadOnly?.()).length,
    concurrencySafe: tools.filter(t => t.isConcurrencySafe?.()).length,
  };
}
