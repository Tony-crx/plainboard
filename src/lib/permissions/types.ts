// Permission system types

export type PermissionMode =
  | 'default'     // Standard: ask before destructive operations
  | 'plan'        // Plan mode: no execution, only planning
  | 'bypass'      // Bypass permissions: allow everything
  | 'auto';       // Auto mode: classifier reviews output

export type PermissionBehavior = 'allow' | 'deny' | 'ask';

export interface PermissionRule {
  toolName: string;       // Tool name or prefix (e.g., "FileWrite" or "mcp__")
  pattern: string;        // Glob-like pattern for matching
  behavior: PermissionBehavior;
  source: 'cli' | 'session' | 'agent' | 'project' | 'user-settings';
  reason?: string;
}

export interface ToolPermissionContext {
  mode: PermissionMode;
  alwaysAllowRules: PermissionRule[];
  alwaysDenyRules: PermissionRule[];
  alwaysAskRules: PermissionRule[];
  workingDirectories: string[];
  // Agent-specific flags
  shouldAvoidPermissionPrompts: boolean;  // true for async agents that can't show UI
  allowedTools?: string[];                // If set, ONLY these tools are allowed
}

export interface PermissionResult {
  behavior: PermissionBehavior;
  matchedRule?: PermissionRule;
  reason?: string;
}

export interface PermissionEngine {
  checkPermission(
    toolName: string,
    context: ToolPermissionContext,
    input?: Record<string, unknown>
  ): PermissionResult;

  buildContextForMode(mode: PermissionMode, overrides?: Partial<ToolPermissionContext>): ToolPermissionContext;

  buildContextForAgent(
    mode: PermissionMode,
    allowedTools?: string[],
    workingDirectories?: string[]
  ): ToolPermissionContext;

  filterToolsForAgent(
    context: ToolPermissionContext,
    tools: Array<{ name: string }>,
    disallowedTools?: string[]
  ): Array<{ name: string }>;

  addRule(context: ToolPermissionContext, rule: PermissionRule): void;
  removeRule(context: ToolPermissionContext, toolName: string): void;
}

// Predefined tool deny lists for all agents
export const ALL_AGENT_DISALLOWED_TOOLS = [
  'task_output',
  'exit_plan_mode',
  'enter_plan_mode',
  'ask_user_question',
  'task_stop',
];

export const COORDINATOR_ALLOWED_TOOLS = [
  'agent',
  'task_stop',
  'send_message',
  'synthetic_output',
  'delegate_task',
];

export const ASYNC_AGENT_ALLOWED_TOOLS = [
  'bash',
  'file_read',
  'file_edit',
  'file_write',
  'glob',
  'grep',
  'web_search',
  'web_fetch',
  'todo_write',
  'skill',
];
