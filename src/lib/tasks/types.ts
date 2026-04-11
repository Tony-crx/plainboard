// Task type definitions for the Coordinator system

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'stopped'
  | 'backgrounded';

export type TaskType = 'agent' | 'shell' | 'swarm';

export interface TaskProgress {
  toolCallCount: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  recentActivities: string[];
  lastActivityAt: number;
  startedAt: number;
  completedAt?: number;
}

export interface TaskNotification {
  taskId: string;
  agentName: string;
  status: TaskStatus;
  summary: string;
  result: string;
  usage?: TaskProgress['tokenUsage'];
}

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  status: TaskStatus;
  agentName: string;
  description: string;
  progress: TaskProgress;
  abortController?: AbortController;
  result?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
  // For agent tasks
  parentTaskId?: string;
  runInBackground: boolean;
  // Notification when task completes/fails
  notification?: TaskNotification;
}

export interface TaskCreateParams {
  name: string;
  type: TaskType;
  agentName: string;
  description: string;
  runInBackground?: boolean;
  parentTaskId?: string;
}

export interface TaskStore {
  tasks: Map<string, Task>;
  create(params: TaskCreateParams): Task;
  get(id: string): Task | undefined;
  update(id: string, updates: Partial<Task>): void;
  complete(id: string, result: string, tokenUsage?: TaskProgress['tokenUsage']): void;
  fail(id: string, error: string): void;
  stop(id: string): void;
  list(status?: TaskStatus): Task[];
  delete(id: string): void;
  generateNotification(id: string): TaskNotification | null;
}
