// SendMessage pattern -- continue an existing worker instead of spawning fresh
// Inspired by Claude Code's SendMessageTool

import { Message, SwarmResponse } from '../swarm/types';
import { getWorker } from './worker-manager';
import { globalTaskStore } from '../tasks/task-store';
import { ProgressTracker } from '../tasks/progress-tracker';

/**
 * Send a follow-up message to a running worker (continue existing context)
 *
 * This is more efficient than spawning fresh because:
 * - Preserves the worker's context window
 * - Avoids redundant context building
 * - Maintains conversation continuity
 */
export function sendMessageToWorker(
  taskId: string,
  followUpMessage: string
): { success: boolean; message: string; taskId: string } {
  const worker = getWorker(taskId);

  if (!worker) {
    return { success: false, message: `Worker ${taskId} not found`, taskId };
  }

  if (worker.status !== 'running') {
    return {
      success: false,
      message: `Worker ${taskId} is ${worker.status}, cannot send message`,
      taskId,
    };
  }

  // Add the follow-up message to the worker's memory
  // The worker will see this on its next LLM call turn
  worker.memories[worker.agent.name].push({
    role: 'user',
    content: `[FOLLOW-UP FROM COORDINATOR]: ${followUpMessage}`,
  });

  // Track activity (progress is a snapshot, we update the worker state directly)
  const tracker = new ProgressTracker(worker.agent.name);
  const currentProgress = worker.progress;
  tracker.recordTokenUsage(
    currentProgress.tokenUsage.promptTokens,
    currentProgress.tokenUsage.completionTokens
  );
  tracker.addActivity(`Received follow-up: ${followUpMessage.substring(0, 80)}...`);
  worker.progress = tracker.getProgress();

  return {
    success: true,
    message: `Message sent to worker ${worker.agent.name} (task: ${taskId})`,
    taskId,
  };
}

/**
 * Generate a send_message tool that can be used by the coordinator
 * to continue existing workers
 */
export function createSendMessageTool() {
  return {
    type: 'function' as const,
    function: {
      name: 'send_message',
      description: 'Send a follow-up message to a running worker agent (continue existing context). Use this instead of spawning a new worker when the task is related to an already-running agent.',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'The task ID of the worker to send a message to',
          },
          message: {
            type: 'string',
            description: 'The follow-up message to send',
          },
        },
        required: ['task_id', 'message'],
      },
    },
    execute: (args: { task_id: string; message: string }) => {
      return sendMessageToWorker(args.task_id, args.message);
    },
  };
}

/**
 * Create a task_stop tool that can stop a running worker
 */
export function createTaskStopTool() {
  return {
    type: 'function' as const,
    function: {
      name: 'task_stop',
      description: 'Stop a running worker agent by task ID',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'The task ID of the worker to stop',
          },
        },
        required: ['task_id'],
      },
    },
    execute: (args: { task_id: string }) => {
      const { stopWorker } = require('./worker-manager');
      stopWorker(args.task_id);
      return `Worker ${args.task_id} has been stopped.`;
    },
  };
}

/**
 * Create a task_list tool to show active workers
 */
export function createTaskListTool() {
  return {
    type: 'function' as const,
    function: {
      name: 'task_list',
      description: 'List all active worker agents and their status',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
    execute: () => {
      const { getActiveWorkers } = require('./worker-manager');
      const workers = getActiveWorkers();
      if (workers.length === 0) {
        return 'No active workers.';
      }
      return workers.map((w: any) => {
        const task = globalTaskStore.get(w.taskId);
        return `- **${w.agent.name}** (task: ${w.taskId}) | Status: ${w.status} | Activity: ${w.progress.recentActivities.at(-1) || 'N/A'}`;
      }).join('\n');
    },
  };
}

/**
 * Create a task_output tool to get worker results
 */
export function createTaskOutputTool() {
  return {
    type: 'function' as const,
    function: {
      name: 'task_output',
      description: 'Get the current output/result from a worker agent',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'The task ID of the worker',
          },
        },
        required: ['task_id'],
      },
    },
    execute: (args: { task_id: string }) => {
      const { getWorker } = require('./worker-manager');
      const worker = getWorker(args.task_id);
      if (!worker) {
        return `Worker ${args.task_id} not found.`;
      }
      const messages = worker.memories[worker.agent.name] || [];
      const lastAssistant = [...messages].reverse().find((m: Message) => m.role === 'assistant');
      return lastAssistant?.content || `Worker ${worker.agent.name} is still running. No output yet.`;
    },
  };
}
