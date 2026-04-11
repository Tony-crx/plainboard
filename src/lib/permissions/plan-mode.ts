// Plan Mode system -- inspired by Claude Code's EnterPlanMode/ExitPlanMode

import { Message } from '@/lib/swarm/types';
import { Tool } from '@/lib/swarm/types';

/**
 * Plan mode state
 */
export interface PlanModeState {
  isActive: boolean;
  /** The mode we were in before entering plan mode */
  previousMode: string;
  /** The plan content being built */
  planContent: string;
  /** Timestamp when plan mode was entered */
  enteredAt: number;
  /** Whether the plan has been approved */
  isApproved: boolean;
  /** Approval timestamp */
  approvedAt?: number;
}

/**
 * Plan mode manager
 */
class PlanModeManager {
  private state: PlanModeState = {
    isActive: false,
    previousMode: 'default',
    planContent: '',
    enteredAt: 0,
    isApproved: false,
  };

  getState(): PlanModeState {
    return { ...this.state };
  }

  /**
   * Enter plan mode
   */
  enter(currentMode: string = 'default'): PlanModeState {
    this.state = {
      isActive: true,
      previousMode: currentMode,
      planContent: '',
      enteredAt: Date.now(),
      isApproved: false,
    };
    return { ...this.state };
  }

  /**
   * Update the plan content
   */
  updatePlan(content: string): PlanModeState {
    if (!this.state.isActive) {
      throw new Error('Plan mode is not active');
    }
    this.state.planContent = content;
    return { ...this.state };
  }

  /**
   * Approve the plan and exit plan mode
   */
  approveAndExit(): { previousMode: string; planContent: string } {
    if (!this.state.isActive) {
      throw new Error('Plan mode is not active');
    }
    const previousMode = this.state.previousMode;
    const planContent = this.state.planContent;
    this.state = {
      ...this.state,
      isActive: false,
      isApproved: true,
      approvedAt: Date.now(),
    };
    return { previousMode, planContent };
  }

  /**
   * Cancel plan mode (discard plan)
   */
  cancel(): string {
    const previousMode = this.state.previousMode;
    this.state = {
      isActive: false,
      previousMode: 'default',
      planContent: '',
      enteredAt: 0,
      isApproved: false,
    };
    return previousMode;
  }

  /**
   * Check if a tool is allowed in plan mode
   */
  isToolAllowed(toolName: string): boolean {
    if (!this.state.isActive) return true;

    // In plan mode, only read-only tools and plan management tools are allowed
    const planModeAllowedTools = new Set([
      'file_read', 'file_ops', 'web_search', 'glob', 'grep',
      'code_analyze', 'json_query', 'text_extract', 'text_stats',
      'system_info', 'env_info', 'disk_usage', 'resource_monitor',
      'skill',
      'transfer_to_triage', 'transfer_to_coder', 'transfer_to_math',
      'transfer_to_cyn', 'transfer_to_adso', 'transfer_to_coordinator',
      'delegate_task',
    ]);

    return planModeAllowedTools.has(toolName);
  }

  /**
   * Get the system prompt suffix for plan mode
   */
  getSystemPromptSuffix(): string {
    return `\n\n## PLAN MODE ACTIVE
You are in PLAN MODE. You MUST NOT make any edits, run any commands, or modify files.
Your task is to:
1. Explore the codebase to understand the problem
2. Design a clear, step-by-step plan
3. Present the plan to the user for approval

### Rules:
- ONLY read files and analyze code
- DO NOT write, edit, or execute anything
- When ready, present your plan and ask for approval
- The user will approve or reject your plan
- After approval, you will exit plan mode and implement the plan

### Plan Format:
\`\`\`
## Plan: <title>

### Overview
<brief description>

### Steps
1. <step description>
   - Files: <affected files>
   - Changes: <what to change>

### Risks
<potential issues>
\`\`\`
`;
  }
}

export const globalPlanModeManager = new PlanModeManager();

/**
 * Tool to enter plan mode
 */
export const enterPlanModeTool: Tool = {
  type: 'function',
  function: {
    name: 'enter_plan_mode',
    description: 'Enter plan mode. In this mode, you can only read and analyze code -- no edits or executions. Use this before implementing complex changes to create a plan first.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'What you want to plan',
        },
      },
      required: ['topic'],
    },
  },
  execute: (args: { topic: string }) => {
    const state = globalPlanModeManager.enter('default');
    return `Plan mode activated. Topic: ${args.topic}. You can now only READ and ANALYZE. No edits allowed. Present your plan when ready.`;
  },
  getActivityDescription: (args: any) => `Entering plan mode: ${args.topic}...`,
};

/**
 * Tool to approve plan and exit plan mode
 */
export const approvePlanTool: Tool = {
  type: 'function',
  function: {
    name: 'approve_plan',
    description: 'Approve the current plan and exit plan mode to begin implementation.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  execute: () => {
    try {
      const result = globalPlanModeManager.approveAndExit();
      return `Plan approved. Previous mode: ${result.previousMode}. Plan content saved (${result.planContent.length} chars). You can now implement the plan.`;
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  },
  getActivityDescription: () => 'Approving plan and exiting plan mode...',
};

/**
 * Tool to cancel plan mode
 */
export const cancelPlanTool: Tool = {
  type: 'function',
  function: {
    name: 'cancel_plan',
    description: 'Cancel plan mode and return to normal operation without implementing the plan.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  execute: () => {
    const previousMode = globalPlanModeManager.cancel();
    return `Plan cancelled. Returned to ${previousMode} mode.`;
  },
  getActivityDescription: () => 'Cancelling plan mode...',
};

/**
 * Tool to update the plan while in plan mode
 */
export const updatePlanTool: Tool = {
  type: 'function',
  function: {
    name: 'update_plan',
    description: 'Update or replace the current plan content while in plan mode.',
    parameters: {
      type: 'object',
      properties: {
        plan: {
          type: 'string',
          description: 'The full plan content in markdown format',
        },
      },
      required: ['plan'],
    },
  },
  execute: (args: { plan: string }) => {
    try {
      globalPlanModeManager.updatePlan(args.plan);
      return `Plan updated (${args.plan.length} chars). Present to user for approval.`;
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  },
  getActivityDescription: () => 'Updating plan...',
};
