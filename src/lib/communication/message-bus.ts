export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'handoff' | 'query' | 'response' | 'broadcast' | 'tool_call' | 'tool_result' | 'worker_event' | 'notification';
  content: Record<string, unknown> | string;
  timestamp: number;
  priority: 'low' | 'normal' | 'high';
}

export class MessageBus {
  private messages: AgentMessage[] = [];
  private listeners: Map<string, ((message: AgentMessage) => void)[]> = new Map();

  async send(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<void> {
    const fullMessage: AgentMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    this.messages.push(fullMessage);

    // Notify listeners
    const toListeners = this.listeners.get(message.to) || [];
    toListeners.forEach(listener => listener(fullMessage));

    // Handle broadcasts
    if (message.type === 'broadcast') {
      this.listeners.forEach((listeners, agentName) => {
        listeners.forEach(listener => listener(fullMessage));
      });
    }
  }

  on(agentName: string, handler: (message: AgentMessage) => void): () => void {
    if (!this.listeners.has(agentName)) {
      this.listeners.set(agentName, []);
    }
    this.listeners.get(agentName)!.push(handler);

    return () => {
      const agentListeners = this.listeners.get(agentName) || [];
      this.listeners.set(
        agentName,
        agentListeners.filter(l => l !== handler)
      );
    };
  }

  getMessagesForAgent(agentName: string): AgentMessage[] {
    return this.messages.filter(m => m.to === agentName || m.type === 'broadcast');
  }
}

export const globalMessageBus = new MessageBus();
