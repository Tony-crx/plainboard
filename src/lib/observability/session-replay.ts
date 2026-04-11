// Session Replay -- record and playback swarm sessions

import { Message } from '@/lib/swarm/types';

export interface ReplayFrame {
  timestamp: number;
  agentName: string;
  message: Message;
  eventType: 'message' | 'tool_call' | 'tool_result' | 'handoff' | 'error';
  metadata?: Record<string, unknown>;
}

export interface ReplaySession {
  id: string;
  name: string;
  frames: ReplayFrame[];
  createdAt: number;
  duration: number;
  agentCount: number;
}

class SessionReplayRecorder {
  private sessions: Map<string, ReplaySession> = new Map();
  private currentSession: ReplaySession | null = null;
  private maxSessions = 50;

  startRecording(name: string): string {
    const id = `replay-${crypto.randomUUID()}`;
    this.currentSession = {
      id,
      name,
      frames: [],
      createdAt: Date.now(),
      duration: 0,
      agentCount: 0,
    };
    return id;
  }

  recordFrame(frame: Omit<ReplayFrame, 'timestamp'>): void {
    if (!this.currentSession) return;

    this.currentSession.frames.push({
      ...frame,
      timestamp: Date.now(),
    });

    // Update stats
    const agents = new Set(this.currentSession.frames.map(f => f.agentName));
    this.currentSession.agentCount = agents.size;
    this.currentSession.duration = Date.now() - this.currentSession.createdAt;
  }

  stopRecording(): ReplaySession | null {
    if (!this.currentSession) return null;

    const session = { ...this.currentSession };
    this.sessions.set(session.id, session);

    // Evict old sessions
    if (this.sessions.size > this.maxSessions) {
      const sorted = Array.from(this.sessions.entries()).sort((a, b) => a[1].createdAt - b[1].createdAt);
      this.sessions.delete(sorted[0][0]);
    }

    this.currentSession = null;
    return session;
  }

  getSession(id: string): ReplaySession | undefined {
    return this.sessions.get(id);
  }

  getAllSessions(): ReplaySession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  deleteSession(id: string): boolean {
    return this.sessions.delete(id);
  }
}

export const sessionReplayRecorder = new SessionReplayRecorder();
