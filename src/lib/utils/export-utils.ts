/**
 * Export conversation utilities
 */

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

interface ChatSession {
  id: string;
  name: string;
  pinned: boolean;
  createdAt: number;
  agentMemories: Record<string, Message[]>;
  selectedModel: string;
  bookmarkedMessageIds: string[];
}

export interface ExportOptions {
  session: ChatSession;
  agentName?: string;
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
}

/**
 * Format a single message to markdown
 */
function formatMessageToMarkdown(
  msg: Message,
  agentName: string,
  includeTimestamps: boolean,
  index: number
): string {
  const timestamp = includeTimestamps
    ? ` _[${new Date().toISOString()}]_`
    : '';

  const speaker = msg.role === 'assistant'
    ? (msg.name || agentName)
    : msg.role === 'user'
      ? 'User'
      : msg.role === 'tool'
        ? `Tool (${msg.name || 'unknown'})`
        : 'System';

  const content = msg.content || '(empty message)';

  if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
    let toolCallsMd = msg.tool_calls.map((tc) => {
      const fnName = tc.function?.name || 'unknown';
      const args = tc.function?.arguments ? JSON.stringify(JSON.parse(tc.function.arguments), null, 2) : '{}';
      return `\n\`\`\`json\n{\n  "tool": "${fnName}",\n  "arguments": ${args}\n}\n\`\`\``;
    }).join('\n');
    return `**${speaker}**${timestamp}\n${toolCallsMd}\n`;
  }

  return `**${speaker}**${timestamp}:\n\n\`\`\`\n${content}\n\`\`\`\n`;
}

/**
 * Export the current session's conversation to a formatted Markdown file
 */
export function exportConversationToMarkdown(options: ExportOptions): void {
  const { session, agentName, includeMetadata = true, includeTimestamps = true } = options;

  let markdown = '';

  // Header
  markdown += `# ${session.name}\n\n`;

  // Metadata section
  if (includeMetadata) {
    const totalMessages = Object.values(session.agentMemories)
      .reduce((sum, msgs) => sum + msgs.length, 0);

    markdown += `## Metadata\n\n`;
    markdown += `- **Session ID**: \`${session.id}\`\n`;
    markdown += `- **Session Name**: ${session.name}\n`;
    markdown += `- **Created**: ${new Date(session.createdAt).toLocaleString()}\n`;
    markdown += `- **Exported**: ${new Date().toLocaleString()}\n`;
    markdown += `- **Model**: ${session.selectedModel}\n`;
    markdown += `- **Total Messages**: ${totalMessages}\n`;
    markdown += `- **Agents**: ${Object.keys(session.agentMemories).join(', ')}\n`;
    markdown += `- **Pinned**: ${session.pinned ? 'Yes' : 'No'}\n`;
    markdown += `\n---\n\n`;
  }

  // If a specific agent is specified, export only that agent's messages
  if (agentName && session.agentMemories[agentName]) {
    markdown += `## Agent: ${agentName}\n\n`;
    const messages = session.agentMemories[agentName];
    messages.forEach((msg, i) => {
      // Skip tool-only messages without content for cleaner output
      if (msg.role === 'tool' && !msg.content) return;
      markdown += formatMessageToMarkdown(msg, agentName, includeTimestamps, i);
      markdown += '\n---\n\n';
    });
  } else {
    // Export all agents
    for (const [agent, messages] of Object.entries(session.agentMemories)) {
      if (messages.length === 0) continue;

      markdown += `## Agent: ${agent}\n\n`;
      messages.forEach((msg, i) => {
        if (msg.role === 'tool' && !msg.content) return;
        markdown += formatMessageToMarkdown(msg, agent, includeTimestamps, i);
        markdown += '\n---\n\n';
      });
    }
  }

  // Footer
  markdown += `> Exported from Cortisolboard on ${new Date().toISOString()}\n`;

  // Download the file
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = session.name.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  a.download = `${safeName}_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Calculate approximate token count from text (1 token ~= 4 characters for English)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate total token count across all messages in a session
 */
export function calculateSessionTokenUsage(agentMemories: Record<string, Message[]>): number {
  let totalChars = 0;
  for (const messages of Object.values(agentMemories)) {
    for (const msg of messages) {
      totalChars += msg.content?.length || 0;
      if (msg.tool_calls) {
        totalChars += JSON.stringify(msg.tool_calls).length;
      }
      // Add overhead for role/name tokens
      totalChars += 20;
    }
  }
  return Math.ceil(totalChars / 4);
}

/**
 * Calculate localStorage usage in bytes
 */
export function getLocalStorageUsage(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      total += key.length * 2; // UTF-16 characters
      const value = localStorage.getItem(key) || '';
      total += value.length * 2;
    }
  }
  return total;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if a session should be auto-archived
 * Returns true if older than maxDays or has more than maxMessages
 */
export function shouldArchiveSession(
  session: { createdAt: number; agentMemories: Record<string, any[]> },
  maxDays: number = 30,
  maxMessages: number = 500
): boolean {
  const ageInDays = (Date.now() - session.createdAt) / (1000 * 60 * 60 * 24);
  const totalMessages = Object.values(session.agentMemories).reduce(
    (sum, msgs) => sum + msgs.length, 0
  );
  return ageInDays > maxDays || totalMessages > maxMessages;
}

/**
 * Get total message count from agent memories
 */
export function getTotalMessageCount(agentMemories: Record<string, any[]>): number {
  return Object.values(agentMemories).reduce((sum, msgs) => sum + msgs.length, 0);
}
