import { Task, TaskStatus, TaskCreateParams, TaskStore, TaskNotification, TaskProgress } from './types';

class InMemoryTaskStore implements TaskStore {
  tasks: Map<string, Task> = new Map();

  create(params: TaskCreateParams): Task {
    const now = Date.now();
    const id = `task-${crypto.randomUUID()}`;
    const task: Task = {
      id,
      name: params.name,
      type: params.type,
      status: 'pending',
      agentName: params.agentName,
      description: params.description,
      runInBackground: params.runInBackground ?? false,
      parentTaskId: params.parentTaskId,
      progress: {
        toolCallCount: 0,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        recentActivities: [],
        lastActivityAt: now,
        startedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(id, task);
    return task;
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  update(id: string, updates: Partial<Task>): void {
    const task = this.tasks.get(id);
    if (!task) return;
    Object.assign(task, updates, { updatedAt: Date.now() });
  }

  complete(id: string, result: string, tokenUsage?: TaskProgress['tokenUsage']): void {
    const task = this.tasks.get(id);
    if (!task) return;
    task.status = 'completed';
    task.result = result;
    task.updatedAt = Date.now();
    task.progress.completedAt = Date.now();
    if (tokenUsage) {
      task.progress.tokenUsage = tokenUsage;
    }
  }

  fail(id: string, error: string): void {
    const task = this.tasks.get(id);
    if (!task) return;
    task.status = 'failed';
    task.error = error;
    task.updatedAt = Date.now();
    task.progress.completedAt = Date.now();
  }

  stop(id: string): void {
    const task = this.tasks.get(id);
    if (!task) return;
    task.status = 'stopped';
    task.updatedAt = Date.now();
    task.progress.completedAt = Date.now();
    task.abortController?.abort();
  }

  list(status?: TaskStatus): Task[] {
    const all = Array.from(this.tasks.values());
    if (!status) return all;
    return all.filter(t => t.status === status);
  }

  delete(id: string): void {
    this.tasks.delete(id);
  }

  generateNotification(id: string): TaskNotification | null {
    const task = this.tasks.get(id);
    if (!task) return null;
    return {
      taskId: task.id,
      agentName: task.agentName,
      status: task.status,
      summary: task.result || task.error || task.description,
      result: task.result || `Task ${task.status}: ${task.error || 'no result'}`,
      usage: task.progress.tokenUsage,
    };
  }
}

export const globalTaskStore: TaskStore = new InMemoryTaskStore();
