// Session persistence layer -- auto-save/restore agent memories
// Uses IndexedDB for durability across page refreshes

import { indexedDB, localStorageHelpers } from '@/lib/storage/indexeddb';
import { Message } from '@/lib/swarm/types';

export interface SessionData {
  id: string;
  name: string;
  agentMemories: Record<string, Message[]>;
  activeAgentName: string;
  contextVariables: Record<string, any>;
  selectedModel: string;
  enabledAgents: Record<string, boolean>;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

const ACTIVE_SESSION_KEY = 'cortisol_active_session';
const MAX_AUTO_SAVE_INTERVAL = 30000; // 30 seconds

class SessionManager {
  private _currentSessionId: string | null = null;
  private _autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private _pendingSave = false;

  /**
   * Create a new session with initial agent memories
   */
  async createSession(
    name: string,
    agentMemories: Record<string, Message[]>,
    activeAgentName: string,
    options: {
      selectedModel?: string;
      enabledAgents?: Record<string, boolean>;
    } = {}
  ): Promise<string> {
    const session: SessionData = {
      id: `session-${crypto.randomUUID()}`,
      name,
      agentMemories,
      activeAgentName,
      contextVariables: {},
      selectedModel: options.selectedModel || 'meta-llama/llama-3.3-70b-instruct:free',
      enabledAgents: options.enabledAgents || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
    };

    await indexedDB.saveSession(session as any);
    this._currentSessionId = session.id;
    localStorageHelpers.setActiveSessionId(session.id);

    return session.id;
  }

  /**
   * Load a session from IndexedDB
   */
  async loadSession(sessionId: string): Promise<SessionData | null> {
    const raw = await indexedDB.getSession(sessionId);
    if (!raw) return null;

    return raw as unknown as SessionData;
  }

  /**
   * Get the currently active session ID
   */
  getCurrentSessionId(): string | null {
    return this._currentSessionId || localStorageHelpers.getActiveSessionId();
  }

  /**
   * Load the active session
   */
  async loadActiveSession(): Promise<SessionData | null> {
    const id = this.getCurrentSessionId();
    if (!id) return null;
    return this.loadSession(id);
  }

  /**
   * Update the current session with new state
   * This is debounced to avoid excessive writes
   */
  updateSession(
    sessionId: string,
    updates: Partial<Omit<SessionData, 'id' | 'createdAt'>>
  ): void {
    this._currentSessionId = sessionId;
    localStorageHelpers.setActiveSessionId(sessionId);

    // Debounce saves
    if (this._autoSaveTimer) {
      clearTimeout(this._autoSaveTimer);
    }

    this._autoSaveTimer = setTimeout(async () => {
      await this._saveSessionUpdate(sessionId, updates);
      this._pendingSave = false;
      this._autoSaveTimer = null;
    }, Math.min(MAX_AUTO_SAVE_INTERVAL, 1000));
  }

  /**
   * Immediately save pending session updates
   */
  async flushSave(sessionId?: string): Promise<void> {
    const id = sessionId || this._currentSessionId;
    if (!id) return;

    if (this._autoSaveTimer) {
      clearTimeout(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }

    // Force save with current known state
    await this._saveSessionUpdate(id, {});
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await indexedDB.deleteSession(sessionId);
    if (this._currentSessionId === sessionId) {
      this._currentSessionId = null;
      localStorageHelpers.clearActiveSessionId();
    }
  }

  /**
   * List all saved sessions
   */
  async listSessions(): Promise<Array<{ id: string; name: string; updatedAt: number; messageCount: number }>> {
    const sessions = await indexedDB.getAllSessions();
    return sessions.map((s: any) => ({
      id: s.id,
      name: s.name,
      updatedAt: s.updatedAt,
      messageCount: s.messageCount || 0,
    })).sort((a: any, b: any) => b.updatedAt - a.updatedAt);
  }

  /**
   * Clear all sessions
   */
  async clearAllSessions(): Promise<void> {
    await indexedDB.clearAllSessions();
    this._currentSessionId = null;
    localStorageHelpers.clearActiveSessionId();
  }

  /**
   * Save a task notification to the session for cross-tab sync
   */
  async recordTaskNotification(
    sessionId: string,
    taskId: string,
    agentName: string,
    status: string,
    summary: string,
    result: string
  ): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (!session) return;

    const notifications = (session as any).taskNotifications || [];
    notifications.push({
      taskId,
      agentName,
      status,
      summary,
      result,
      timestamp: Date.now(),
    });

    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.splice(0, notifications.length - 50);
    }

    (session as any).taskNotifications = notifications;
    session.updatedAt = Date.now();

    await indexedDB.saveSession(session as any);
  }

  private async _saveSessionUpdate(
    sessionId: string,
    updates: Partial<Omit<SessionData, 'id' | 'createdAt'>>
  ): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (!session) return;

    Object.assign(session, updates, { updatedAt: Date.now() });
    await indexedDB.saveSession(session as any);
  }
}

export const sessionManager = new SessionManager();
