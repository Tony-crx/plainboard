import { z } from 'zod';
import { Tool, SwarmContext } from '../swarm/types';

export interface DefaultToolOptions<T extends z.ZodTypeAny> {
  name: string;
  description: string;
  inputSchema: T;
  execute: (args: z.infer<T>, context: SwarmContext) => Promise<any> | any;
  /** Activity description for progress indicators */
  getActivityDescription?: (args: z.infer<T>) => string;
  /** Whether the tool only reads and doesn't modify state */
  isReadOnly?: () => boolean;
  /** Whether the tool is safe to run concurrently */
  isConcurrencySafe?: () => boolean;
  /** Pre-permission validation */
  validateInput?: (args: z.infer<T>, context: SwarmContext) => { valid: boolean; error?: string };
}

/**
 * Creates a robust Tool with strict input validation using Zod.
 * This ensures that LLMs provide exact parameter shapes before execution.
 */
export function buildTool<T extends z.ZodTypeAny>(options: DefaultToolOptions<T>): Tool {
  // Use Zod v4 built-in JSON Schema generation
  const rawSchema: any = (options.inputSchema as any).toJSONSchema();

  const finalParameters = {
    type: "object",
    properties: rawSchema.properties || {},
    required: rawSchema.required || [],
    ...(rawSchema.additionalProperties !== undefined ? { additionalProperties: rawSchema.additionalProperties } : {})
  };

  return {
    type: 'function',
    function: {
      name: options.name,
      description: options.description,
      parameters: finalParameters,
    },
    
    // The execution wrapper that validates input before calling the actual implementation
    execute: async (rawArgs: any, context: SwarmContext) => {
      try {
        // 1. Validate JSON schema strictly with Zod
        const parsedArgs = await options.inputSchema.parseAsync(rawArgs);
        
        // 2. Run custom validation if present
        if (options.validateInput) {
          const validationResult = options.validateInput(parsedArgs, context);
          if (!validationResult.valid) {
            return `[SYSTEM ERROR] Input validation failed: ${validationResult.error}`;
          }
        }
        
        // 3. Execute actual logic
        return await options.execute(parsedArgs, context);
        
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          // Format Zod errors nicely for the AI to understand and correct
          const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
          return `[SYSTEM ERROR] Invalid arguments format. ${issues}. Please fix your parameters and try again.`;
        }
        return `[EXECUTION ERROR] ${error.message}`;
      }
    },

    getActivityDescription: options.getActivityDescription,
    isReadOnly: options.isReadOnly,
    isConcurrencySafe: options.isConcurrencySafe,
    validateInput: options.validateInput as any,
  };
}
