import fs from 'fs/promises';
import path from 'path';
import { MemoryEntry, MemoryStore } from './types';

export class FileMemoryStore implements MemoryStore {
  private memories: MemoryEntry[] = [];
  private persistPath: string;

  constructor(persistPath: string = './data/memories.json') {
    this.persistPath = persistPath;
    this.load();
  }

  async add(entry: MemoryEntry): Promise<void> {
    this.memories.push(entry);
    await this.persist();
  }

  async search(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    // Simple keyword matching
    return this.memories
      .filter(m => m.content.toLowerCase().includes(query.toLowerCase()))
      .slice(-limit);
  }

  async getByAgent(agentName: string, limit: number = 10): Promise<MemoryEntry[]> {
    return this.memories
      .filter(m => m.agentName === agentName)
      .slice(-limit);
  }

  async clear(): Promise<void> {
    this.memories = [];
    await this.persist();
  }

  private async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.persistPath, 'utf-8');
      this.memories = JSON.parse(data);
    } catch {
      this.memories = [];
    }
  }

  private async persist(): Promise<void> {
    try {
       await fs.mkdir(path.dirname(this.persistPath), { recursive: true });
       await fs.writeFile(this.persistPath, JSON.stringify(this.memories, null, 2));
    } catch (err) {
       console.error("Failed to persist memory:", err);
    }
  }
}

export const globalMemoryStore = new FileMemoryStore();
