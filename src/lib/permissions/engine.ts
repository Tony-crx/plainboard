import {
  PermissionMode,
  PermissionRule,
  ToolPermissionContext,
  PermissionResult,
  PermissionBehavior,
  PermissionEngine,
  ALL_AGENT_DISALLOWED_TOOLS,
} from './types';

function matchesRule(toolName: string, pattern: string): boolean {
  if (pattern === toolName) return true;
  if (pattern.endsWith('__') && toolName.startsWith(pattern)) return true;
  if (pattern.includes('*')) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    return regex.test(toolName);
  }
  return false;
}

class DefaultPermissionEngine implements PermissionEngine {
  checkPermission(
    toolName: string,
    context: ToolPermissionContext,
    _input?: Record<string, unknown>
  ): PermissionResult {
    // Check allowed tools filter first
    if (context.allowedTools && context.allowedTools.length > 0) {
      if (!context.allowedTools.includes(toolName)) {
        return { behavior: 'deny', reason: `Tool '${toolName}' is not in the allowed tools list` };
      }
    }

    // Check deny rules (highest priority)
    for (const rule of context.alwaysDenyRules) {
      if (matchesRule(toolName, rule.pattern)) {
        return { behavior: 'deny', matchedRule: rule, reason: rule.reason || `Denied by ${rule.source} rule` };
      }
    }

    // Check allow rules
    for (const rule of context.alwaysAskRules) {
      if (matchesRule(toolName, rule.pattern)) {
        return { behavior: 'ask', matchedRule: rule };
      }
    }

    // Check always-allow rules
    for (const rule of context.alwaysAllowRules) {
      if (matchesRule(toolName, rule.pattern)) {
        return { behavior: 'allow', matchedRule: rule };
      }
    }

    // Mode-based defaults
    switch (context.mode) {
      case 'bypass':
        return { behavior: 'allow', reason: 'Bypass permissions mode' };
      case 'plan':
        return { behavior: 'deny', reason: 'Plan mode: no execution allowed' };
      case 'auto':
        return context.shouldAvoidPermissionPrompts
          ? { behavior: 'deny', reason: 'Auto mode: cannot prompt user' }
          : { behavior: 'ask' };
      default:
        return context.shouldAvoidPermissionPrompts
          ? { behavior: 'deny', reason: 'Cannot prompt user for permission' }
          : { behavior: 'ask' };
    }
  }

  buildContextForMode(mode: PermissionMode, overrides?: Partial<ToolPermissionContext>): ToolPermissionContext {
    const base: ToolPermissionContext = {
      mode,
      alwaysAllowRules: [],
      alwaysDenyRules: [],
      alwaysAskRules: [],
      workingDirectories: [process.cwd()],
      shouldAvoidPermissionPrompts: false,
    };

    if (overrides) {
      Object.assign(base, overrides);
    }

    return base;
  }

  buildContextForAgent(
    mode: PermissionMode,
    allowedTools?: string[],
    workingDirectories?: string[]
  ): ToolPermissionContext {
    return {
      mode,
      alwaysAllowRules: [],
      alwaysDenyRules: ALL_AGENT_DISALLOWED_TOOLS.map(name => ({
        toolName: name,
        pattern: name,
        behavior: 'deny' as PermissionBehavior,
        source: 'agent' as const,
        reason: 'Disallowed for all agents by default',
      })),
      alwaysAskRules: [],
      workingDirectories: workingDirectories || [process.cwd()],
      shouldAvoidPermissionPrompts: mode === 'auto' || mode === 'bypass',
      allowedTools,
    };
  }

  filterToolsForAgent(
    context: ToolPermissionContext,
    tools: Array<{ name: string }>,
    additionalDisallowed: string[] = []
  ): Array<{ name: string }> {
    const disallowed = new Set([...ALL_AGENT_DISALLOWED_TOOLS, ...additionalDisallowed]);

    if (context.allowedTools && context.allowedTools.length > 0) {
      return tools.filter(t => context.allowedTools!.includes(t.name) && !disallowed.has(t.name));
    }

    return tools.filter(t => !disallowed.has(t.name));
  }

  addRule(context: ToolPermissionContext, rule: PermissionRule): void {
    switch (rule.behavior) {
      case 'allow':
        context.alwaysAllowRules.push(rule);
        break;
      case 'deny':
        context.alwaysDenyRules.push(rule);
        break;
      case 'ask':
        context.alwaysAskRules.push(rule);
        break;
    }
  }

  removeRule(context: ToolPermissionContext, toolName: string): void {
    context.alwaysAllowRules = context.alwaysAllowRules.filter(r => r.pattern !== toolName);
    context.alwaysDenyRules = context.alwaysDenyRules.filter(r => r.pattern !== toolName);
    context.alwaysAskRules = context.alwaysAskRules.filter(r => r.pattern !== toolName);
  }
}

export const globalPermissionEngine: PermissionEngine = new DefaultPermissionEngine();
