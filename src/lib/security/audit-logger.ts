export interface AuditEntry {
  id: string;
  timestamp: number;
  userId?: string;
  agentName: string;
  action: string;
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high';
}

export class AuditLogger {
  private logs: AuditEntry[] = [];
  private persistPath: string;

  constructor(persistPath: string = './data/audit-log.json') {
    this.persistPath = persistPath;
  }

  async log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry: AuditEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    this.logs.push(fullEntry);

    // Keep last 10000 entries
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000);
    }

    await this.persist();
  }

  async getLogs(options?: {
    agentName?: string;
    riskLevel?: string;
    limit?: number;
  }): Promise<AuditEntry[]> {
    let filtered = this.logs;

    if (options?.agentName) {
      filtered = filtered.filter(log => log.agentName === options.agentName);
    }

    if (options?.riskLevel) {
      filtered = filtered.filter(log => log.riskLevel === options.riskLevel);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  private async persist(): Promise<void> {
    try {
        const fs = await import('fs/promises');
        const path = await import('path');
        await fs.mkdir(path.dirname(this.persistPath), { recursive: true });
        await fs.writeFile(this.persistPath, JSON.stringify(this.logs, null, 2));
    } catch (err) {
        console.error("Audit log persist failure:", err);
    }
  }
}

export const globalAuditLogger = new AuditLogger();
