// Memory Optimizer -- auto-summarize and prune old messages
// Keeps context window within limits while preserving critical info

import { Message } from '@/lib/swarm/types';

export interface MemorySummary {
  agentName: string;
  originalCount: number;
  compressedCount: number;
  summary: string;
  preservedMessages: Message[];
  timestamp: number;
}

class MemoryOptimizer {
  private summaries: Map<string, MemorySummary> = new Map();
  private maxMessagesPerAgent = 50;
  private preserveFirst = 3;
  private preserveLast = 10;

  optimize(
    agentName: string,
    messages: Message[]
  ): { messages: Message[]; summary?: MemorySummary } {
    if (messages.length <= this.maxMessagesPerAgent) {
      return { messages };
    }

    const messagesToKeep: Message[] = [
      ...messages.slice(0, this.preserveFirst),
      ...messages.slice(-this.preserveLast),
    ];

    const messagesToSummarize = messages.slice(
      this.preserveFirst,
      messages.length - this.preserveLast
    );

    const summary = this.summarizeMessages(agentName, messagesToSummarize);

    const summaryMessage: Message = {
      role: 'system',
      content: `[MEMORY SUMMARY - ${messagesToSummarize.length} messages compressed]:\n${summary}`,
      name: 'System',
    };

    // Insert summary after preserved first messages
    const optimized = [
      ...messages.slice(0, this.preserveFirst),
      summaryMessage,
      ...messages.slice(-this.preserveLast),
    ];

    const summaryRecord: MemorySummary = {
      agentName,
      originalCount: messages.length,
      compressedCount: optimized.length,
      summary,
      preservedMessages: messagesToKeep,
      timestamp: Date.now(),
    };

    this.summaries.set(agentName, summaryRecord);

    return { messages: optimized, summary: summaryRecord };
  }

  getSummary(agentName: string): MemorySummary | undefined {
    return this.summaries.get(agentName);
  }

  getAllSummaries(): MemorySummary[] {
    return Array.from(this.summaries.values());
  }

  clearSummaries(): void {
    this.summaries.clear();
  }

  private summarizeMessages(agentName: string, messages: Message[]): string {
    // Simple summarization: extract key topics and tool calls
    const toolCalls: string[] = [];
    const topics = new Set<string>();
    let userMsgCount = 0;
    let assistantMsgCount = 0;

    for (const msg of messages) {
      if (msg.role === 'user') {
        userMsgCount++;
        const content = (msg.content || '').substring(0, 100);
        topics.add(content);
      } else if (msg.role === 'assistant') {
        assistantMsgCount++;
      }

      if (msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          toolCalls.push(tc.function.name);
        }
      }
    }

    const parts: string[] = [];
    parts.push(`Agent: ${agentName}`);
    parts.push(`Messages: ${userMsgCount} user, ${assistantMsgCount} assistant`);
    parts.push(`Tools used: ${toolCalls.length > 0 ? [...new Set(toolCalls)].join(', ') : 'none'}`);

    if (topics.size > 0) {
      const topicList = Array.from(topics).slice(0, 5);
      parts.push(`Topics: ${topicList.join(' | ')}`);
    }

    return parts.join('\n');
  }
}

export const globalMemoryOptimizer = new MemoryOptimizer();
