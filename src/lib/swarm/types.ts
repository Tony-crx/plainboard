import { PermissionMode, ToolPermissionContext } from '../permissions/types';
import { TaskProgress } from '../tasks/types';

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
  avatar: string;
  specialty: string;
  themeColor: string;
}

/**
 * Rich Tool definition -- inspired by Claude Code's Tool interface.
 * Extends the basic Tool with permissions, progress, validation, and deferral support.
 */
export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any;
  };
  execute: (args: any, context: SwarmContext) => Promise<any> | any;

  // --- Rich properties (optional, Claude Code-style) ---
  /** Whether this tool is currently enabled */
  isEnabled?: () => boolean;
  /** Whether the tool is safe to run concurrently */
  isConcurrencySafe?: () => boolean;
  /** Whether the tool only reads and doesn't modify state */
  isReadOnly?: () => boolean;
  /** Whether the tool performs destructive operations */
  isDestructive?: () => boolean;
  /** Dynamic description for prompt injection */
  dynamicDescription?: () => string;
  /** Help text shown when user asks about this tool */
  prompt?: () => string;
  /** Pre-permission validation */
  validateInput?: (args: any, context: SwarmContext) => { valid: boolean; error?: string };
  /** Activity description for progress indicators */
  getActivityDescription?: (args: any) => string;
  /** Max result size before persisting to disk/truncating */
  maxResultSizeChars?: number;
  /** Whether this tool should be deferred until needed (saves context tokens) */
  shouldDefer?: boolean;
  /** Whether this tool should always be loaded (never deferred) */
  alwaysLoad?: boolean;
  /** Tool-specific permission check override */
  checkPermissions?: (args: any, context: SwarmContext) => { behavior: 'allow' | 'deny' | 'ask'; reason?: string };
}

export interface Agent {
  name: string;
  profile?: AgentProfile;
  instructions: string | ((variables: Record<string, any>) => string);
  model?: string;
  tools?: Tool[];

  // --- Coordinator-mode properties ---
  /** Permission mode for this agent (default, plan, bypass, auto) */
  permissionMode?: PermissionMode;
  /** Whether this agent should run in background */
  runInBackground?: boolean;
  /** Custom allowed tools list (if set, only these tools are available) */
  allowedTools?: string[];
  /** Working directories for permission scoping */
  workingDirectories?: string[];
  /** Whether to avoid permission prompts (for async agents) */
  avoidPermissionPrompts?: boolean;
}

export interface SwarmContext {
  variables: Record<string, any>;
  agentMemories: Record<string, Message[]>;
  /** Permission context for tool execution */
  permissionContext?: ToolPermissionContext;
  /** Task ID if running within a task */
  taskId?: string;
}

export interface SwarmResponse {
  agentMemories: Record<string, Message[]>;
  targetAgent: Agent;
  variables: Record<string, any>;
  /** Task notifications from completed workers */
  taskNotifications?: TaskNotification[];
  /** Token usage across all agents */
  totalTokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface TaskNotification {
  taskId: string;
  agentName: string;
  status: string;
  summary: string;
  result: string;
}

/**
 * Worker state for async execution
 */
export interface WorkerState {
  taskId: string;
  agent: Agent;
  memories: Record<string, Message[]>;
  variables: Record<string, any>;
  progress: TaskProgress;
  abortController: AbortController;
  promise: Promise<SwarmResponse>;
  status: 'running' | 'completed' | 'failed' | 'stopped';
}
