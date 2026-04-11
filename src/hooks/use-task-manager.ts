// Hook for task/worker management
import { useState, useCallback, useEffect, useRef } from 'react';

export interface TaskInfo {
  id: string;
  name: string;
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped' | 'backgrounded';
  type: 'agent' | 'shell' | 'swarm';
  description: string;
  progress: {
    toolCallCount: number;
    tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
    recentActivities: string[];
    lastActivityAt: number;
    startedAt: number;
    completedAt?: number;
  };
  createdAt: number;
  updatedAt: number;
  result?: string;
  error?: string;
  runInBackground: boolean;
}

interface UseTaskManagerOptions {
  pollInterval?: number;
}

export function useTaskManager(options: UseTaskManagerOptions = {}) {
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTasks = useCallback(async (statusFilter?: string) => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `/api/tasks?status=${statusFilter}`
        : '/api/tasks';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data.tasks);
    } catch (error: any) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const stopTask = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/stop`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to stop task');
      await fetchTasks();
    } catch (error: any) {
      console.error('Failed to stop task:', error);
    }
  }, [fetchTasks]);

  const getTaskOutput = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/output`);
      if (!res.ok) throw new Error('Failed to get task output');
      return await res.json();
    } catch (error: any) {
      console.error('Failed to get task output:', error);
      return null;
    }
  }, []);

  const messageWorker = useCallback(async (taskId: string, message: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error('Failed to message worker');
      return await res.json();
    } catch (error: any) {
      console.error('Failed to message worker:', error);
      return null;
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return [];
      const data = await res.json();
      return data.notifications;
    } catch {
      return [];
    }
  }, []);

  // Auto-polling for active tasks
  useEffect(() => {
    const interval = options.pollInterval || 3000;
    pollIntervalRef.current = setInterval(() => {
      fetchTasks();
    }, interval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchTasks, options.pollInterval]);

  return {
    tasks,
    loading,
    activeTasks: tasks.filter(t => t.status === 'running'),
    completedTasks: tasks.filter(t => t.status === 'completed'),
    failedTasks: tasks.filter(t => t.status === 'failed'),
    fetchTasks,
    stopTask,
    getTaskOutput,
    messageWorker,
    fetchNotifications,
  };
}
