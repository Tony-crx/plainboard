// Worker Live Logs -- real-time terminal output streaming
// Workers push log lines to a shared log buffer

export interface WorkerLogEntry {
  id: string;
  taskId: string;
  agentName: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: 'tool_call' | 'tool_result' | 'llm' | 'system' | 'handoff';
  metadata?: Record<string, unknown>;
}

class WorkerLogStore {
  private logs: Map<string, WorkerLogEntry[]> = new Map();
  private globalLog: WorkerLogEntry[] = [];
  private maxLogsPerTask = 200;
  private maxGlobalLogs = 1000;

  addLog(entry: Omit<WorkerLogEntry, 'id' | 'timestamp'>): void {
    const fullEntry: WorkerLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    // Per-task log
    if (!this.logs.has(entry.taskId)) {
      this.logs.set(entry.taskId, []);
    }
    const taskLogs = this.logs.get(entry.taskId)!;
    taskLogs.push(fullEntry);
    if (taskLogs.length > this.maxLogsPerTask) {
      this.logs.set(entry.taskId, taskLogs.slice(-this.maxLogsPerTask));
    }

    // Global log
    this.globalLog.push(fullEntry);
    if (this.globalLog.length > this.maxGlobalLogs) {
      this.globalLog = this.globalLog.slice(-this.maxGlobalLogs);
    }
  }

  getTaskLogs(taskId: string): WorkerLogEntry[] {
    return this.logs.get(taskId) || [];
  }

  getGlobalLogs(level?: WorkerLogEntry['level'], limit = 100): WorkerLogEntry[] {
    let logs = this.globalLog;
    if (level) logs = logs.filter(l => l.level === level);
    return logs.slice(-limit);
  }

  clearTaskLogs(taskId: string): void {
    this.logs.delete(taskId);
  }

  clearAll(): void {
    this.logs.clear();
    this.globalLog = [];
  }
}

export const globalWorkerLogStore = new WorkerLogStore();

// Helper: inject log into both worker logs and activity feed
export function logWorkerEvent(
  taskId: string,
  agentName: string,
  level: WorkerLogEntry['level'],
  message: string,
  source: WorkerLogEntry['source'],
  metadata?: Record<string, unknown>
): void {
  globalWorkerLogStore.addLog({
    taskId,
    agentName,
    level,
    message,
    source,
    metadata,
  });
}
