/**
 * IndexedDB storage layer for sessions and large data.
 * Replaces localStorage for session storage to support 50MB+ capacity.
 * localStorage remains for small items (settings, active session id).
 */

const DB_NAME = 'cortisolboard';
const DB_VERSION = 1;

const STORE_SESSIONS = 'sessions';
const STORE_ERROR_HISTORY = 'error_history';

// Capture global indexedDB before class definition shadows it
const globalIDB = typeof window !== 'undefined' ? window.indexedDB : undefined;

export interface ErrorHistoryEntry {
  id: string;
  timestamp: number;
  agentName: string;
  errorMessage: string;
  context: string;
  lastUserMessage?: string;
  sessionId?: string;
}

class CortisolDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (!globalIDB) {
        reject(new Error('IndexedDB is not available'));
        return;
      }
      const request = globalIDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
          const sessionStore = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
          sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
          sessionStore.createIndex('archived', 'archived', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_ERROR_HISTORY)) {
          const errorStore = db.createObjectStore(STORE_ERROR_HISTORY, { keyPath: 'id' });
          errorStore.createIndex('timestamp', 'timestamp', { unique: false });
          errorStore.createIndex('agentName', 'agentName', { unique: false });
          errorStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  // ── Session CRUD ──

  async getAllSessions(): Promise<Record<string, unknown>[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSession(id: string): Promise<Record<string, unknown> | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveSession(session: Record<string, unknown>): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSession(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllSessions(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ── Error History CRUD ──

  async addErrorEntry(entry: ErrorHistoryEntry): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ERROR_HISTORY, 'readwrite');
      const store = tx.objectStore(STORE_ERROR_HISTORY);
      const request = store.add(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getErrorHistory(options?: {
    startDate?: number;
    endDate?: number;
    agentName?: string;
    limit?: number;
  }): Promise<ErrorHistoryEntry[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ERROR_HISTORY, 'readonly');
      const store = tx.objectStore(STORE_ERROR_HISTORY);
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result as ErrorHistoryEntry[];

        if (options?.startDate) {
          results = results.filter(e => e.timestamp >= options.startDate!);
        }
        if (options?.endDate) {
          results = results.filter(e => e.timestamp <= options.endDate!);
        }
        if (options?.agentName) {
          results = results.filter(e => e.agentName === options.agentName);
        }

        results.sort((a, b) => b.timestamp - a.timestamp);

        if (options?.limit) {
          results = results.slice(0, options.limit);
        }

        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteErrorEntry(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ERROR_HISTORY, 'readwrite');
      const store = tx.objectStore(STORE_ERROR_HISTORY);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearErrorHistory(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ERROR_HISTORY, 'readwrite');
      const store = tx.objectStore(STORE_ERROR_HISTORY);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ── Migration from localStorage ──

  async migrateFromLocalStorage(): Promise<{ migrated: number; errors: string | null }> {
    try {
      const sessionsStr = localStorage.getItem('cortisol_sessions');
      if (!sessionsStr || sessionsStr === '[]') {
        return { migrated: 0, errors: null };
      }

      const existingSessions = await this.getAllSessions();
      if (existingSessions.length > 0) {
        return { migrated: 0, errors: null };
      }

      const localStorageSessions: Record<string, unknown>[] = JSON.parse(sessionsStr);
      let migrated = 0;

      for (const session of localStorageSessions) {
        await this.saveSession(session);
        migrated++;
      }

      // Remove from localStorage after successful migration
      localStorage.removeItem('cortisol_sessions');

      return { migrated, errors: null };
    } catch (error) {
      return {
        migrated: 0,
        errors: error instanceof Error ? error.message : 'Unknown migration error',
      };
    }
  }

  async isMigrationComplete(): Promise<boolean> {
    const sessionsStr = localStorage.getItem('cortisol_sessions');
    if (!sessionsStr || sessionsStr === '[]') return true;

    const dbSessions = await this.getAllSessions();
    const localStorageSessions: Record<string, unknown>[] = JSON.parse(sessionsStr);
    return dbSessions.length >= localStorageSessions.length;
  }
}

export const indexedDB = new CortisolDB();

// ── LocalStorage helpers for small items ──

export const localStorageHelpers = {
  getActiveSessionId(): string | null {
    return localStorage.getItem('cortisol_active_session');
  },

  setActiveSessionId(id: string): void {
    localStorage.setItem('cortisol_active_session', id);
  },

  clearActiveSessionId(): void {
    localStorage.removeItem('cortisol_active_session');
  },

  getApiKeys(provider: string): string[] {
    const str = localStorage.getItem(`cortisol_api_keys_${provider}`);
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  },

  setApiKeys(provider: string, keys: string[]): void {
    localStorage.setItem(`cortisol_api_keys_${provider}`, JSON.stringify(keys));
  },

  getSetting<T>(key: string, defaultValue: T): T {
    const str = localStorage.getItem(`cortisol_setting_${key}`);
    if (str === null) return defaultValue;
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  },

  setSetting<T>(key: string, value: T): void {
    localStorage.setItem(`cortisol_setting_${key}`, JSON.stringify(value));
  },
};
