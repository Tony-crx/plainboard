// Multi-Tab Sync -- BroadcastChannel for cross-tab communication
// Syncs state between browser tabs of the same CortisolBoard instance

const CHANNEL_NAME = 'cortisolboard_sync';
const TAB_ID = `tab-${crypto.randomUUID()}`;

type SyncMessage = {
  type: 'state_update' | 'tab_presence' | 'tab_leave';
  tabId: string;
  payload?: Record<string, unknown>;
};

type TabInfo = {
  id: string;
  lastSeen: number;
  isAlive: boolean;
};

class MultiTabSync {
  private channel: BroadcastChannel | null = null;
  private activeTabs: Map<string, TabInfo> = new Map();
  private callbacks: Map<string, ((tabId: string, payload?: Record<string, unknown>) => void)[]> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window === 'undefined') return;
    this.init();
  }

  private init(): void {
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (e: MessageEvent<SyncMessage>) => this.handleMessage(e.data);

      // Register this tab
      this.activeTabs.set(TAB_ID, { id: TAB_ID, lastSeen: Date.now(), isAlive: true });

      // Announce presence
      this.channel.postMessage({ type: 'tab_presence', tabId: TAB_ID });

      // Heartbeat
      this.heartbeatInterval = setInterval(() => {
        this.activeTabs.forEach((tab, id) => {
          if (Date.now() - tab.lastSeen > 5000) {
            tab.isAlive = false;
          }
        });
        this.channel!.postMessage({ type: 'tab_presence', tabId: TAB_ID });
      }, 3000);

      // Cleanup on unload
      window.addEventListener('beforeunload', () => this.destroy());
    } catch {
      // BroadcastChannel not supported
      this.channel = null;
    }
  }

  private handleMessage(message: SyncMessage): void {
    if (message.tabId === TAB_ID) return; // Ignore own messages

    switch (message.type) {
      case 'state_update':
        // Forward to local event bus if needed
        break;
      case 'tab_presence':
        this.activeTabs.set(message.tabId, {
          id: message.tabId,
          lastSeen: Date.now(),
          isAlive: true,
        });
        break;
      case 'tab_leave':
        this.activeTabs.delete(message.tabId);
        break;
    }

    // Notify callbacks
    const cbs = this.callbacks.get(message.type) || [];
    cbs.forEach(cb => cb(message.tabId, message.payload));
  }

  broadcast(payload: Record<string, unknown>): void {
    if (!this.channel) return;
    this.channel.postMessage({ type: 'state_update', tabId: TAB_ID, payload });
  }

  on(type: string, callback: (tabId: string, payload?: Record<string, unknown>) => void): () => void {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, []);
    }
    this.callbacks.get(type)!.push(callback);
    return () => {
      const list = this.callbacks.get(type) || [];
      this.callbacks.set(type, list.filter(cb => cb !== callback));
    };
  }

  getTabCount(): number {
    return Array.from(this.activeTabs.values()).filter(t => t.isAlive).length;
  }

  getActiveTabs(): TabInfo[] {
    return Array.from(this.activeTabs.values()).filter(t => t.isAlive);
  }

  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.channel) {
      this.channel.postMessage({ type: 'tab_leave', tabId: TAB_ID });
      this.channel.close();
    }
  }
}

export const multiTabSync = new MultiTabSync();
export { TAB_ID };
