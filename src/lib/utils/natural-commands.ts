// Natural Language Commands -- parse natural language into actions
// E.g., "show me tasks" → opens task panel, "kill worker 3" → stops worker

export interface NLCommand {
  id: string;
  pattern: RegExp;
  action: (match: RegExpMatchArray) => NLCommandResult;
  description: string;
  category: 'navigation' | 'task' | 'session' | 'skill' | 'agent' | 'settings';
}

export interface NLCommandResult {
  type: 'navigate' | 'execute' | 'open' | 'close' | 'toggle' | 'set' | 'query';
  target?: string;
  payload?: Record<string, unknown>;
  responseMessage?: string;
}

export const nlCommands: NLCommand[] = [
  // === Navigation ===
  {
    id: 'open-tasks',
    pattern: /(?:open|show|view)\s+(my\s+)?tasks?/i,
    action: () => ({ type: 'open', target: 'taskPanel', responseMessage: 'Opening task manager...' }),
    description: 'Open the task manager panel',
    category: 'navigation',
  },
  {
    id: 'open-skills',
    pattern: /(?:open|show|view)\s+(my\s+)?skills?/i,
    action: () => ({ type: 'open', target: 'skillBrowser', responseMessage: 'Opening skill browser...' }),
    description: 'Open the skill browser',
    category: 'navigation',
  },
  {
    id: 'open-logs',
    pattern: /(?:open|show|view)\s+(worker\s+)?logs?/i,
    action: () => ({ type: 'open', target: 'workerLogs', responseMessage: 'Opening worker logs...' }),
    description: 'Open the worker log panel',
    category: 'navigation',
  },
  {
    id: 'open-timeline',
    pattern: /(?:open|show|view)\s+(message\s+)?timeline/i,
    action: () => ({ type: 'open', target: 'timeline', responseMessage: 'Opening message timeline...' }),
    description: 'Open the message timeline',
    category: 'navigation',
  },
  {
    id: 'open-audit',
    pattern: /(?:open|show|view)\s+audit\s+(log|logs)?/i,
    action: () => ({ type: 'open', target: 'auditLog', responseMessage: 'Opening audit log...' }),
    description: 'Open the audit log dashboard',
    category: 'navigation',
  },
  {
    id: 'open-feed',
    pattern: /(?:open|show|view)\s+(activity\s+)?feed/i,
    action: () => ({ type: 'open', target: 'activityFeed', responseMessage: 'Opening activity feed...' }),
    description: 'Open the activity feed',
    category: 'navigation',
  },
  {
    id: 'open-memory',
    pattern: /(?:open|show|view)\s+memor(y|ies)/i,
    action: () => ({ type: 'open', target: 'memoryBrowser', responseMessage: 'Opening memory browser...' }),
    description: 'Open the memory browser',
    category: 'navigation',
  },
  {
    id: 'open-plan',
    pattern: /(?:open|show|view)\s+plan/i,
    action: () => ({ type: 'open', target: 'planMode', responseMessage: 'Opening plan mode...' }),
    description: 'Open plan mode',
    category: 'navigation',
  },

  // === Task Commands ===
  {
    id: 'kill-task',
    pattern: /(?:kill|stop|terminate|abort)\s+(task|worker|agent)?\s*(.*)?/i,
    action: (match) => ({
      type: 'execute',
      target: 'stopTask',
      payload: { taskId: match[2]?.trim() },
      responseMessage: match[2] ? `Stopping task ${match[2].trim()}...` : 'Please specify which task to stop.',
    }),
    description: 'Kill a running task or worker',
    category: 'task',
  },
  {
    id: 'list-tasks',
    pattern: /(?:list|show|what)\s+(active\s+)?tasks?/i,
    action: () => ({ type: 'query', target: 'listTasks', responseMessage: 'Here are the active tasks.' }),
    description: 'List active tasks',
    category: 'task',
  },

  // === Session Commands ===
  {
    id: 'new-session',
    pattern: /(?:new|create|start)\s+(a\s+)?session/i,
    action: () => ({ type: 'execute', target: 'newSession', responseMessage: 'Creating new session...' }),
    description: 'Create a new chat session',
    category: 'session',
  },
  {
    id: 'clear-session',
    pattern: /(?:clear|reset|wipe)\s+(this\s+)?session/i,
    action: () => ({ type: 'execute', target: 'clearSession', responseMessage: 'Clearing current session...' }),
    description: 'Clear the current session',
    category: 'session',
  },

  // === Skill Commands ===
  {
    id: 'run-skill',
    pattern: /run\s+skill\s+(\w+)/i,
    action: (match) => ({
      type: 'execute',
      target: 'runSkill',
      payload: { skillName: match[1] },
      responseMessage: `Running skill: ${match[1]}...`,
    }),
    description: 'Run a specific skill',
    category: 'skill',
  },
  {
    id: 'list-skills',
    pattern: /(?:list|show|what)\s+(available\s+)?skills?/i,
    action: () => ({ type: 'query', target: 'listSkills', responseMessage: 'Here are the available skills.' }),
    description: 'List available skills',
    category: 'skill',
  },

  // === Agent Commands ===
  {
    id: 'switch-agent',
    pattern: /(?:switch|change|route)\s+to\s+(\w+)/i,
    action: (match) => ({
      type: 'set',
      target: 'activeAgent',
      payload: { agentName: match[1] },
      responseMessage: `Switching to ${match[1]}...`,
    }),
    description: 'Switch to a specific agent',
    category: 'agent',
  },

  // === Settings ===
  {
    id: 'toggle-war-room',
    pattern: /(?:toggle|enable|disable)\s+war\s+room/i,
    action: () => ({ type: 'toggle', target: 'warRoom', responseMessage: 'Toggling war room mode...' }),
    description: 'Toggle war room mode',
    category: 'settings',
  },
];

export function parseNaturalLanguage(input: string): NLCommandResult | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  for (const cmd of nlCommands) {
    const match = trimmed.match(cmd.pattern);
    if (match) {
      return cmd.action(match);
    }
  }

  return null;
}

export function getCommandSuggestions(query: string): NLCommand[] {
  const lower = query.toLowerCase();
  return nlCommands.filter(cmd =>
    cmd.description.toLowerCase().includes(lower) ||
    cmd.id.includes(lower)
  ).slice(0, 5);
}
