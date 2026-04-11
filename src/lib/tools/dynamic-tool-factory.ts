// Dynamic Tool Creation -- agents can create custom tools at runtime

import { Tool, SwarmContext, Message } from '@/lib/swarm/types';

export interface ToolBlueprint {
  name: string;
  description: string;
  parametersSchema: Record<string, unknown>;
  implementation: string; // JavaScript code as string
  category: 'text' | 'data' | 'network' | 'file' | 'system' | 'custom';
}

export interface CreatedTool {
  tool: Tool;
  blueprint: ToolBlueprint;
  createdAt: number;
  createdBy: string;
  usageCount: number;
}

class DynamicToolFactory {
  private createdTools: Map<string, CreatedTool> = new Map();
  private maxTools = 20;

  createTool(
    blueprint: ToolBlueprint,
    createdBy: string
  ): { success: boolean; tool?: Tool; error?: string } {
    // Check limit
    if (this.createdTools.size >= this.maxTools) {
      // Remove oldest unused tool
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [key, t] of this.createdTools) {
        if (t.usageCount === 0 && t.createdAt < oldestTime) {
          oldestKey = key;
          oldestTime = t.createdAt;
        }
      }
      if (oldestKey) {
        this.createdTools.delete(oldestKey);
      } else {
        return { success: false, error: `Maximum ${this.maxTools} dynamic tools reached` };
      }
    }

    try {
      // Validate blueprint
      if (!blueprint.name || !blueprint.description || !blueprint.parametersSchema) {
        return { success: false, error: 'Invalid blueprint: missing required fields' };
      }

      // Build the tool
      const tool: Tool = {
        type: 'function',
        function: {
          name: `custom_${blueprint.name}`,
          description: blueprint.description,
          parameters: {
            type: 'object',
            properties: blueprint.parametersSchema,
          },
        },
        execute: async (args: any, context: SwarmContext) => {
          try {
            // Create a safe execution context
            const safeContext = {
              input: args,
              variables: context.variables,
            };

            // Execute the implementation with safe context
            const fn = new Function('context', blueprint.implementation);
            const result = await fn(safeContext);
            return typeof result === 'string' ? result : JSON.stringify(result);
          } catch (err: any) {
            return `Error executing custom tool: ${err.message}`;
          }
        },
        isConcurrencySafe: () => false,
        shouldDefer: true,
      };

      const createdTool: CreatedTool = {
        tool,
        blueprint,
        createdAt: Date.now(),
        createdBy,
        usageCount: 0,
      };

      this.createdTools.set(blueprint.name, createdTool);

      return { success: true, tool };
    } catch (err: any) {
      return { success: false, error: `Failed to create tool: ${err.message}` };
    }
  }

  getTool(name: string): Tool | undefined {
    return this.createdTools.get(name)?.tool;
  }

  getAllTools(): CreatedTool[] {
    return Array.from(this.createdTools.values());
  }

  removeTool(name: string): boolean {
    return this.createdTools.delete(name);
  }

  getStats(): { total: number; totalUsage: number; oldest: string; newest: string } {
    const tools = Array.from(this.createdTools.values());
    return {
      total: tools.length,
      totalUsage: tools.reduce((s, t) => s + t.usageCount, 0),
      oldest: tools.length > 0 ? new Date(Math.min(...tools.map(t => t.createdAt))).toISOString() : 'N/A',
      newest: tools.length > 0 ? new Date(Math.max(...tools.map(t => t.createdAt))).toISOString() : 'N/A',
    };
  }
}

export const globalDynamicToolFactory = new DynamicToolFactory();

// Tool for creating tools
export const createToolTool: Tool = {
  type: 'function',
  function: {
    name: 'create_custom_tool',
    description: 'Create a new custom tool at runtime. Provide a name, description, parameter schema, and JavaScript implementation.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Tool name (alphanumeric, no spaces)' },
        description: { type: 'string', description: 'What the tool does' },
        parametersSchema: {
          type: 'object',
          description: 'JSON Schema for tool parameters',
        },
        implementation: {
          type: 'string',
          description: 'JavaScript code. Receives `context` object with `context.input` and `context.variables`. Return a string result.',
        },
        category: { type: 'string', enum: ['text', 'data', 'network', 'file', 'system', 'custom'] },
      },
      required: ['name', 'description', 'parametersSchema', 'implementation'],
    },
  },
  execute: async (args: { name: string; description: string; parametersSchema: Record<string, unknown>; implementation: string; category?: string }, ctx: SwarmContext) => {
    const result = globalDynamicToolFactory.createTool({
      name: args.name,
      description: args.description,
      parametersSchema: args.parametersSchema,
      implementation: args.implementation,
      category: (args.category as any) || 'custom',
    }, ctx.permissionContext?.mode || 'default');

    if (result.success && result.tool) {
      return `✅ Custom tool '${args.name}' created successfully. You can now use \`custom_${args.name}\`.`;
    }
    return `❌ Failed to create tool: ${result.error}`;
  },
  isConcurrencySafe: () => true,
  getActivityDescription: (args: any) => `Creating custom tool: ${args.name}...`,
};
