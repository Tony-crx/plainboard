/**
 * Session management utilities - pure functions for session CRUD operations.
 * These can be tested independently of React components.
 */

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export interface ChatSession {
  id: string;
  name: string;
  pinned: boolean;
  archived: boolean;
  createdAt: number;
  agentMemories: Record<string, Message[]>;
  selectedModel: string;
  bookmarkedMessageIds: string[];
}

export interface SessionManagerResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

const DEFAULT_AGENT_MEMORIES: Record<string, Message[]> = {
  Coordinator: [],
  Triage: [],
  Coder: [],
  Math: [],
  Cyn: [],
  Adso: [],
};

/**
 * Create a new chat session
 */
export function createSession(
  sessions: ChatSession[],
  options?: { name?: string; selectedModel?: string }
): { session: ChatSession; sessions: ChatSession[] } {
  const newSession: ChatSession = {
    id: `session_${Date.now()}`,
    name: options?.name || `Session ${new Date().toLocaleString()}`,
    pinned: false,
    archived: false,
    createdAt: Date.now(),
    agentMemories: { ...DEFAULT_AGENT_MEMORIES },
    selectedModel: options?.selectedModel || 'meta-llama/llama-3.3-70b-instruct:free',
    bookmarkedMessageIds: [],
  };

  return {
    session: newSession,
    sessions: [newSession, ...sessions],
  };
}

/**
 * Rename a session
 */
export function renameSession(
  sessions: ChatSession[],
  sessionId: string,
  newName: string
): SessionManagerResult<ChatSession[]> {
  const trimmed = newName.trim();
  if (!trimmed) {
    return { success: false, error: 'Session name cannot be empty' };
  }

  const index = sessions.findIndex(s => s.id === sessionId);
  if (index === -1) {
    return { success: false, error: 'Session not found' };
  }

  const updated = [...sessions];
  updated[index] = { ...updated[index], name: trimmed };
  return { success: true, data: updated };
}

/**
 * Delete a session
 */
export function deleteSession(
  sessions: ChatSession[],
  sessionId: string,
  activeSessionId: string
): SessionManagerResult<{ sessions: ChatSession[]; newActiveId: string | null }> {
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index === -1) {
    return { success: false, error: 'Session not found' };
  }

  const updated = sessions.filter(s => s.id !== sessionId);

  // Determine new active session
  let newActiveId: string | null = activeSessionId;
  if (activeSessionId === sessionId) {
    newActiveId = updated.length > 0 ? updated[0].id : null;
  }

  return { success: true, data: { sessions: updated, newActiveId } };
}

/**
 * Toggle pin on a session
 */
export function togglePinSession(
  sessions: ChatSession[],
  sessionId: string
): SessionManagerResult<ChatSession[]> {
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index === -1) {
    return { success: false, error: 'Session not found' };
  }

  const updated = [...sessions];
  updated[index] = { ...updated[index], pinned: !updated[index].pinned };
  return { success: true, data: updated };
}

/**
 * Archive a session
 */
export function archiveSession(
  sessions: ChatSession[],
  sessionId: string
): SessionManagerResult<ChatSession[]> {
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index === -1) {
    return { success: false, error: 'Session not found' };
  }

  const updated = [...sessions];
  updated[index] = { ...updated[index], archived: true };
  return { success: true, data: updated };
}

/**
 * Unarchive a session
 */
export function unarchiveSession(
  sessions: ChatSession[],
  sessionId: string
): SessionManagerResult<ChatSession[]> {
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index === -1) {
    return { success: false, error: 'Session not found' };
  }

  const updated = [...sessions];
  updated[index] = { ...updated[index], archived: false };
  return { success: true, data: updated };
}

/**
 * Export a session to JSON
 */
export function exportSession(session: ChatSession): string {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    session,
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import a session from JSON
 */
export function importSession(
  sessions: ChatSession[],
  jsonContent: string,
  defaultModel: string
): SessionManagerResult<{ session: ChatSession; sessions: ChatSession[] }> {
  try {
    const importData = JSON.parse(jsonContent);

    if (!importData.session || !importData.session.id) {
      return { success: false, error: 'Invalid session file format' };
    }

    const importedSession: ChatSession = {
      id: `imported_${Date.now()}`,
      name: importData.session.name || 'Imported Session',
      pinned: importData.session.pinned ?? false,
      archived: false,
      createdAt: importData.session.createdAt || Date.now(),
      agentMemories: importData.session.agentMemories || { ...DEFAULT_AGENT_MEMORIES },
      selectedModel: importData.session.selectedModel || defaultModel,
      bookmarkedMessageIds: importData.session.bookmarkedMessageIds || [],
    };

    return {
      success: true,
      data: { session: importedSession, sessions: [...sessions, importedSession] },
    };
  } catch {
    return { success: false, error: 'Invalid JSON format' };
  }
}

/**
 * Edit a user message in agent memories
 */
export function editMessage(
  agentMemories: Record<string, Message[]>,
  agentName: string,
  messageId: string,
  newContent: string
): SessionManagerResult<Record<string, Message[]>> {
  if (!newContent.trim()) {
    return { success: false, error: 'Message content cannot be empty' };
  }

  const memories = agentMemories[agentName];
  if (!memories) {
    return { success: false, error: 'Agent memories not found' };
  }

  // Parse messageId to get index (format: "agentName_index")
  const parts = messageId.split('_');
  const index = parseInt(parts[parts.length - 1], 10);

  if (isNaN(index) || index < 0 || index >= memories.length) {
    return { success: false, error: 'Invalid message ID' };
  }

  const updatedMemories = { ...agentMemories };
  updatedMemories[agentName] = [...memories];
  updatedMemories[agentName][index] = {
    ...updatedMemories[agentName][index],
    content: newContent.trim(),
  };

  return { success: true, data: updatedMemories };
}

/**
 * Delete a message from agent memories
 */
export function deleteMessage(
  agentMemories: Record<string, Message[]>,
  agentName: string,
  messageId: string
): SessionManagerResult<Record<string, Message[]>> {
  const memories = agentMemories[agentName];
  if (!memories) {
    return { success: false, error: 'Agent memories not found' };
  }

  // Parse messageId to get index (format: "agentName_index")
  const parts = messageId.split('_');
  const index = parseInt(parts[parts.length - 1], 10);

  if (isNaN(index) || index < 0 || index >= memories.length) {
    return { success: false, error: 'Invalid message ID' };
  }

  const updatedMemories = { ...agentMemories };
  updatedMemories[agentName] = [...memories];
  updatedMemories[agentName].splice(index, 1);

  return { success: true, data: updatedMemories };
}

/**
 * Toggle bookmark on a message
 */
export function toggleBookmark(
  bookmarkedIds: string[],
  messageId: string
): string[] {
  const isBookmarked = bookmarkedIds.includes(messageId);
  if (isBookmarked) {
    return bookmarkedIds.filter(id => id !== messageId);
  }
  return [...bookmarkedIds, messageId];
}

/**
 * Get total message count across all agents
 */
export function getTotalMessageCount(
  agentMemories: Record<string, Message[]>
): number {
  return Object.values(agentMemories).reduce(
    (sum, messages) => sum + messages.length,
    0
  );
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(agentName: string, index: number): string {
  return `${agentName}_${index}`;
}

/**
 * Get paginated messages
 */
export function getPaginatedMessages<T extends { _originalIndex: number }>(
  messages: T[],
  page: number,
  perPage: number
): { messages: T[]; totalPages: number; startIndex: number; endIndex: number } {
  const totalMessages = messages.length;
  const totalPages = Math.max(1, Math.ceil(totalMessages / perPage));
  const startIndex = (page - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalMessages);
  const paginatedMessages = messages.slice(startIndex, endIndex);

  return {
    messages: paginatedMessages,
    totalPages,
    startIndex,
    endIndex,
  };
}

/**
 * Filter sessions by search query
 */
export function filterSessions(
  sessions: ChatSession[],
  query: string
): ChatSession[] {
  if (!query.trim()) return sessions;
  const lowerQuery = query.toLowerCase();
  return sessions.filter(s => s.name.toLowerCase().includes(lowerQuery));
}

/**
 * Sort sessions: pinned first, then by creation date descending
 */
export function sortSessions(
  sessions: ChatSession[]
): ChatSession[] {
  return [...sessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt - a.createdAt;
  });
}
