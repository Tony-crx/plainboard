// Worker manager -- handles async/background agent execution
// Inspired by Claude Code's AgentTool/runAgent.ts and LocalAgentTask

import { Agent, Message, SwarmResponse, SwarmContext, WorkerState } from '../swarm/types';
import { globalTaskStore } from '../tasks/task-store';
import { ProgressTracker } from '../tasks/progress-tracker';
import { runSwarm } from './runner';

const activeWorkers = new Map<string, WorkerState>();

/**
 * Launch a worker agent asynchronously (fire-and-forget or awaitable)
 */
export async function launchWorker(
  agent: Agent,
  userMessage: string,
  agentMemories: Record<string, Message[]>,
  contextVariables: Record<string, any>,
  options: {
    runInBackground?: boolean;
    maxTurns?: number;
    selectedModel?: string;
    enabledAgents?: Record<string, boolean>;
    agentOverrides?: Record<string, { name?: string; instructions?: string; model?: string }>;
    apiKeys?: string[];
  } = {}
): Promise<WorkerState> {
  const taskId = `task-${crypto.randomUUID()}`;
  const abortController = new AbortController();

  // Create task record
  const task = globalTaskStore.create({
    name: agent.name,
    type: 'agent',
    agentName: agent.name,
    description: userMessage,
    runInBackground: options.runInBackground ?? false,
  });

  // Initialize worker memory with full context from parent (not lossy)
  const workerMemories = { ...agentMemories };
  if (!workerMemories[agent.name]) {
    workerMemories[agent.name] = [];
  }
  // Add handoff message WITH full conversation history for context transfer
  workerMemories[agent.name].push({
    role: 'user',
    content: `[SYSTEM HANDOFF FROM COORDINATOR]: ${userMessage}`,
  });

  // Create progress tracker
  const progressTracker = new ProgressTracker(agent.name);
  progressTracker.addActivity(`Worker launched: ${userMessage.substring(0, 100)}...`);

  // Build the worker promise
  const workerPromise = (async (): Promise<SwarmResponse> => {
    try {
      // Check if aborted
      if (abortController.signal.aborted) {
        throw new Error('Worker aborted');
      }

      const result = await runSwarm(
        agent,
        workerMemories,
        contextVariables,
        options.maxTurns,
        options.selectedModel,
        options.enabledAgents || {},
        options.agentOverrides || {},
        options.apiKeys || []
      );

      // Update task with results
      progressTracker.markComplete();
      globalTaskStore.complete(task.id, 'Worker completed successfully');

      return result;
    } catch (error: any) {
      if (error.message === 'Worker aborted' || abortController.signal.aborted) {
        globalTaskStore.stop(task.id);
        throw new Error('Worker was stopped');
      }
      globalTaskStore.fail(task.id, error.message);
      throw error;
    }
  })();

  const workerState: WorkerState = {
    taskId: task.id,
    agent,
    memories: workerMemories,
    variables: contextVariables,
    progress: progressTracker.getProgress(),
    abortController,
    promise: workerPromise,
    status: 'running',
  };

  activeWorkers.set(taskId, workerState);

  // If running in background, don't await -- let it run independently
  if (options.runInBackground) {
    workerPromise
      .then(() => {
        workerState.status = 'completed';
      })
      .catch(() => {
        workerState.status = 'failed';
      })
      .finally(() => {
        activeWorkers.delete(taskId);
      });
  }

  return workerState;
}

/**
 * Stop a running worker
 */
export function stopWorker(taskId: string): void {
  const worker = activeWorkers.get(taskId);
  if (worker) {
    worker.status = 'stopped';
    worker.abortController.abort();
    globalTaskStore.stop(taskId);
  }
}

/**
 * Get all active workers
 */
export function getActiveWorkers(): WorkerState[] {
  return Array.from(activeWorkers.values());
}

/**
 * Get a specific worker by task ID
 */
export function getWorker(taskId: string): WorkerState | undefined {
  return activeWorkers.get(taskId);
}

/**
 * Build a task notification from a completed worker
 */
export function buildWorkerNotification(workerState: WorkerState, result: SwarmResponse): {
  taskId: string;
  agentName: string;
  status: string;
  summary: string;
  result: string;
} {
  const lastMessage = result.agentMemories[workerState.agent.name]?.slice(-1)[0];
  const summary = lastMessage?.content?.substring(0, 200) || 'No output';

  return {
    taskId: workerState.taskId,
    agentName: workerState.agent.name,
    status: workerState.status,
    summary,
    result: lastMessage?.content || 'No output',
  };
}

/**
 * Launch multiple workers in parallel and wait for all to complete
 */
export async function launchParallelWorkers(
  tasks: Array<{
    agent: Agent;
    message: string;
    runInBackground?: boolean;
  }>,
  agentMemories: Record<string, Message[]>,
  contextVariables: Record<string, any>,
  options: {
    maxTurns?: number;
    selectedModel?: string;
    enabledAgents?: Record<string, boolean>;
    agentOverrides?: Record<string, { name?: string; instructions?: string; model?: string }>;
    apiKeys?: string[];
  } = {}
): Promise<WorkerState[]> {
  const workers = await Promise.all(
    tasks.map(task =>
      launchWorker(task.agent, task.message, agentMemories, contextVariables, {
        runInBackground: true,
        maxTurns: options.maxTurns,
        selectedModel: options.selectedModel,
        enabledAgents: options.enabledAgents,
        agentOverrides: options.agentOverrides,
        apiKeys: options.apiKeys,
      })
    )
  );

  // Wait for all workers to complete
  await Promise.all(workers.map(w => w.promise.catch(() => {})));

  return workers;
}

/**
 * Decide whether to spawn a fresh worker or continue an existing one
 * (Claude Code's "SendMessage vs Agent" decision heuristic)
 */
export function shouldContinueWorker(
  existingTaskId: string | null,
  newTaskDescription: string
): boolean {
  if (!existingTaskId) return false;

  const worker = getWorker(existingTaskId);
  if (!worker || worker.status !== 'running') return false;

  // Continue if the new message is related to the existing task
  // Simple heuristic: if the worker is still running, continue it
  return true;
}
