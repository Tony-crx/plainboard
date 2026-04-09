import { Message } from '@/lib/swarm/types';
import { MemoryEntry } from './types';

export class ContextBuilder {
  private maxContextTokens: number = 4000;

  buildContext(
    currentMessages: Message[],
    relevantMemories: MemoryEntry[]
  ): Message[] {
    if (relevantMemories.length === 0) {
      return currentMessages;
    }

    const memoryContext: Message = {
      role: 'system',
      content: [
        '## Relevant Context from Previous Sessions:',
        ...relevantMemories.map(m => `- ${m.content}`)
      ].join('\n')
    };

    return [memoryContext, ...currentMessages];
  }

  truncateToContextLimit(messages: Message[]): Message[] {
    // Simple truncation to prevent context blowup
    const truncated = [...messages];
    while (truncated.length > 20) {
      // Remove oldest non-system string
       const oldestUserIndex = truncated.findIndex(m => m.role !== 'system');
       if (oldestUserIndex >= 0) {
           truncated.splice(oldestUserIndex, 1);
       } else {
           break;
       }
    }
    return truncated;
  }
}

export const globalContextBuilder = new ContextBuilder();
