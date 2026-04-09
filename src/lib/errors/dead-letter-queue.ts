export interface DeadLetterEntry {
  id: string;
  agentName: string;
  payload: any;
  error: string;
  attempts: number;
  timestamp: number;
}

export class DeadLetterQueue {
  private queue: DeadLetterEntry[] = [];
  private maxSize: number = 1000;

  add(entry: Omit<DeadLetterEntry, 'id' | 'timestamp'>): void {
    const fullEntry: DeadLetterEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    this.queue.push(fullEntry);

    if (this.queue.length > this.maxSize) {
      this.queue = this.queue.slice(-this.maxSize);
    }
  }

  getAll(): DeadLetterEntry[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
  }
}

export const globalDeadLetterQueue = new DeadLetterQueue();
