import { useEffect, useState } from 'react';

interface MemoryStats {
  totalEntries: number;
  totalSize: number;
  byAgent: Record<string, { count: number; size: number }>;
}

export function useMemoryCompression(agentMemories: Record<string, any[]>, maxEntriesPerAgent = 100) {
  const [stats, setStats] = useState<MemoryStats>({
    totalEntries: 0,
    totalSize: 0,
    byAgent: {}
  });

  const [compressed, setCompressed] = useState(false);

  useEffect(() => {
    let totalSize = 0;
    const byAgent: Record<string, { count: number; size: number }> = {};

    Object.entries(agentMemories).forEach(([agent, messages]) => {
      let agentSize = 0;
      messages.forEach(msg => {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        agentSize += new Blob([content]).size;
      });

      byAgent[agent] = {
        count: messages.length,
        size: agentSize
      };
      totalSize += agentSize;
    });

    setStats({
      totalEntries: Object.values(byAgent).reduce((sum, a) => sum + a.count, 0),
      totalSize,
      byAgent
    });
  }, [agentMemories]);

  const compress = () => {
    const compressed: Record<string, any[]> = {};

    Object.entries(agentMemories).forEach(([agent, messages]) => {
      if (messages.length <= maxEntriesPerAgent) {
        compressed[agent] = messages;
        return;
      }

      // Keep first 10 and last (maxEntriesPerAgent - 10)
      const keep = maxEntriesPerAgent - 10;
      compressed[agent] = [
        ...messages.slice(0, 10),
        ...messages.slice(-keep)
      ];
    });

    setCompressed(true);
    return compressed;
  };

  const summarize = (messages: any[]) => {
    if (messages.length <= 10) return messages;

    // Create summary of removed messages
    const summary = {
      role: 'system' as const,
      content: `[MEMORY SUMMARY: ${messages.length - 10} messages compressed into this summary]`,
      timestamp: Date.now()
    };

    return [
      ...messages.slice(0, 5),
      summary,
      ...messages.slice(-5)
    ];
  };

  return {
    stats,
    compressed,
    compress,
    summarize
  };
}
