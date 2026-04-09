export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface AgentProfile {
  description: string;
  avatar: string; // The preferred lucide icon name or image url
  specialty: string;
  themeColor: string; // Tailwincss color string for badge
}

export interface Agent {
  name: string;
  profile?: AgentProfile;
  instructions: string | ((variables: Record<string, any>) => string);
  model?: string; // Default to free model if undefined
  tools?: Tool[];
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any; // JSON schema object
  };
  // The actual implementation of the tool
  execute: (args: any, context: SwarmContext) => Promise<any> | any;
}

export interface SwarmContext {
  variables: Record<string, any>;
  agentMemories: Record<string, Message[]>; // Injected context memory
}

export interface SwarmResponse {
  agentMemories: Record<string, Message[]>;
  targetAgent: Agent;
  variables: Record<string, any>;
}
