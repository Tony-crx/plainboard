// Real-Time Event Bus -- SSE-based push notifications
// Replaces polling with server-sent events

type EventType = 
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'task_stopped'
  | 'worker_launched'
  | 'worker_progress'
  | 'agent_handoff'
  | 'skill_executed'
  | 'plan_mode_changed'
  | 'session_updated'
  | 'message_received'
  | 'error_occurred';

export interface RealTimeEvent {
  id: string;
  type: EventType;
  timestamp: number;
  data: Record<string, unknown>;
  sessionId?: string;
}

type EventListener = (event: RealTimeEvent) => void;

class RealTimeEventBus {
  private listeners: Map<string, EventListener[]> = new Map();
  private eventLog: RealTimeEvent[] = [];
  private maxLogSize = 500;

  emit(event: Omit<RealTimeEvent, 'id' | 'timestamp'>): void {
    const fullEvent: RealTimeEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    // Log event
    this.eventLog.push(fullEvent);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }

    // Notify type-specific listeners
    const typeListeners = this.listeners.get(event.type) || [];
    typeListeners.forEach(fn => fn(fullEvent));

    // Notify wildcard listeners
    const wildcardListeners = this.listeners.get('*') || [];
    wildcardListeners.forEach(fn => fn(fullEvent));
  }

  on(type: EventType | '*', listener: EventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
    return () => {
      const list = this.listeners.get(type) || [];
      this.listeners.set(type, list.filter(l => l !== listener));
    };
  }

  getHistory(type?: EventType): RealTimeEvent[] {
    if (!type) return [...this.eventLog];
    return this.eventLog.filter(e => e.type === type);
  }

  clear(): void {
    this.eventLog = [];
    this.listeners.clear();
  }
}

export const globalRealTimeBus = new RealTimeEventBus();

// SSE endpoint helper
export function createSSEStream(res: Response, signal: AbortSignal): ReadableStream {
  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (event: RealTimeEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      const unsubscribe = globalRealTimeBus.on('*', sendEvent);

      signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });

      // Send heartbeat every 15 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 15000);

      signal.addEventListener('abort', () => clearInterval(heartbeat));
    },
  });
}
