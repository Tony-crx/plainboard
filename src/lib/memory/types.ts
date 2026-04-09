export interface MemoryEntry {
  id: string;
  agentName: string;
  content: string;
  embedding?: number[];
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

export interface SharedContext {
  conversationId: string;
  variables: Map<string, any>;
  summaries: Map<string, string>;
}

export interface MemoryStore {
  add(entry: MemoryEntry): Promise<void>;
  search(query: string, limit?: number): Promise<MemoryEntry[]>;
  getByAgent(agentName: string, limit?: number): Promise<MemoryEntry[]>;
  clear(): Promise<void>;
}
