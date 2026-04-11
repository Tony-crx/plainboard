// Error Recovery -- auto-resume crashed workers

import { Agent, Message, SwarmResponse } from '@/lib/swarm/types';

export interface CrashRecord {
  taskId: string;
  agentName: string;
  crashedAt: number;
  lastMessages: Message[];
  error: string;
  resumeAttempts: number;
  maxResumeAttempts: number;
}

class ErrorRecovery {
  private crashRecords: Map<string, CrashRecord> = new Map();
  private maxResumeAttempts = 2;

  recordCrash(
    taskId: string,
    agentName: string,
    lastMessages: Message[],
    error: string
  ): CrashRecord {
    const existing = this.crashRecords.get(taskId);
    const record: CrashRecord = {
      taskId,
      agentName,
      crashedAt: Date.now(),
      lastMessages,
      error,
      resumeAttempts: existing ? existing.resumeAttempts + 1 : 0,
      maxResumeAttempts: this.maxResumeAttempts,
    };

    this.crashRecords.set(taskId, record);
    return record;
  }

  canResume(taskId: string): boolean {
    const record = this.crashRecords.get(taskId);
    return !!record && record.resumeAttempts < record.maxResumeAttempts;
  }

  getResumeState(taskId: string): {
    agentName: string;
    messages: Message[];
    attemptsLeft: number;
  } | null {
    const record = this.crashRecords.get(taskId);
    if (!record) return null;

    return {
      agentName: record.agentName,
      messages: record.lastMessages,
      attemptsLeft: record.maxResumeAttempts - record.resumeAttempts,
    };
  }

  clearRecord(taskId: string): void {
    this.crashRecords.delete(taskId);
  }

  getAllCrashes(): CrashRecord[] {
    return Array.from(this.crashRecords.values());
  }

  getCrashStats(): {
    totalCrashes: number;
    recoverableCrashes: number;
    unrecoverableCrashes: number;
  } {
    const all = Array.from(this.crashRecords.values());
    return {
      totalCrashes: all.length,
      recoverableCrashes: all.filter(c => c.resumeAttempts < c.maxResumeAttempts).length,
      unrecoverableCrashes: all.filter(c => c.resumeAttempts >= c.maxResumeAttempts).length,
    };
  }
}

export const globalErrorRecovery = new ErrorRecovery();
