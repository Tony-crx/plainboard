// Cron Scheduler -- schedule swarm runs

export interface CronJob {
  id: string;
  name: string;
  schedule: string; // cron expression or interval
  prompt: string;
  agentName: string;
  model?: string;
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
  runCount: number;
  createdAt: number;
}

class CronScheduler {
  private jobs: Map<string, CronJob> = new Map();
  private interval: ReturnType<typeof setInterval> | null = null;
  private checkInterval = 60000; // Check every minute

  start(): void {
    if (this.interval) return;
    this.interval = setInterval(() => this.checkJobs(), this.checkInterval);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  addJob(job: Omit<CronJob, 'id' | 'createdAt' | 'runCount' | 'enabled'>): CronJob {
    const newJob: CronJob = {
      ...job,
      id: `cron-${crypto.randomUUID()}`,
      createdAt: Date.now(),
      enabled: true,
      runCount: 0,
    };
    this.jobs.set(newJob.id, newJob);
    this.updateNextRun(newJob);
    return newJob;
  }

  removeJob(id: string): boolean {
    return this.jobs.delete(id);
  }

  toggleJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;
    job.enabled = !job.enabled;
    if (job.enabled) this.updateNextRun(job);
    return true;
  }

  getJobs(): CronJob[] {
    return Array.from(this.jobs.values());
  }

  private checkJobs(): void {
    const now = Date.now();
    for (const job of this.jobs.values()) {
      if (!job.enabled) continue;
      if (job.nextRun && now >= job.nextRun) {
        this.runJob(job);
      }
    }
  }

  private async runJob(job: CronJob): Promise<void> {
    job.lastRun = Date.now();
    job.runCount++;

    // Trigger via custom event
    window.dispatchEvent(new CustomEvent('cron-job-trigger', {
      detail: { jobId: job.id, prompt: job.prompt, agentName: job.agentName },
    }));

    this.updateNextRun(job);
  }

  private updateNextRun(job: CronJob): void {
    job.nextRun = this.parseSchedule(job.schedule);
  }

  private parseSchedule(schedule: string): number {
    const now = Date.now();

    // Simple interval: "5m", "1h", "1d"
    const intervalMatch = schedule.match(/^(\d+)([mhd])$/);
    if (intervalMatch) {
      const value = parseInt(intervalMatch[1], 10);
      const unit = intervalMatch[2];
      const ms = unit === 'm' ? value * 60000 : unit === 'h' ? value * 3600000 : value * 86400000;
      return now + ms;
    }

    // Every N minutes
    if (schedule === '@every_minute') return now + 60000;
    if (schedule === '@every_5_minutes') return now + 300000;
    if (schedule === '@every_hour') return now + 3600000;
    if (schedule === '@every_day') return now + 86400000;

    // Default: 1 hour
    return now + 3600000;
  }
}

export const globalCronScheduler = new CronScheduler();
