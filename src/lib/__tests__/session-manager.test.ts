import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSession,
  renameSession,
  deleteSession,
  togglePinSession,
  archiveSession,
  unarchiveSession,
  exportSession,
  importSession,
  editMessage,
  deleteMessage,
  toggleBookmark,
  getTotalMessageCount,
  generateMessageId,
  getPaginatedMessages,
  filterSessions,
  sortSessions,
} from '@/lib/utils/session-manager';
import type { ChatSession, Message } from '@/lib/utils/session-manager';

// Helper to create a test session with controlled ID
function makeSession(overrides: Partial<ChatSession> = {}): ChatSession {
  return {
    id: overrides.id || `test_session_${Date.now()}`,
    name: overrides.name || 'Test Session',
    pinned: overrides.pinned ?? false,
    archived: overrides.archived ?? false,
    createdAt: overrides.createdAt ?? Date.now(),
    agentMemories: overrides.agentMemories ?? {
      Coordinator: [],
      Triage: [],
      Coder: [],
      Math: [],
      Cyn: [],
      Adso: [],
    },
    selectedModel: overrides.selectedModel || 'meta-llama/llama-3.3-70b-instruct:free',
    bookmarkedMessageIds: overrides.bookmarkedMessageIds ?? [],
  };
}

// Helper to create a test message
function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    role: overrides.role || 'user',
    content: overrides.content ?? 'test message',
    name: overrides.name,
    tool_calls: overrides.tool_calls,
    tool_call_id: overrides.tool_call_id,
  };
}

describe('Session Creation', () => {
  it('should create a new session with default values', () => {
    const result = createSession([]);

    expect(result.session).toBeDefined();
    expect(result.session.id).toMatch(/^session_/);
    expect(result.session.name).toContain('Session');
    expect(result.session.pinned).toBe(false);
    expect(result.session.archived).toBe(false);
    expect(result.session.bookmarkedMessageIds).toEqual([]);
    expect(result.session.agentMemories).toHaveProperty('Coordinator');
    expect(result.session.agentMemories).toHaveProperty('Triage');
    expect(result.session.agentMemories).toHaveProperty('Coder');
    expect(result.session.agentMemories).toHaveProperty('Math');
    expect(result.session.agentMemories).toHaveProperty('Cyn');
    expect(result.session.agentMemories).toHaveProperty('Adso');
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]).toBe(result.session);
  });

  it('should create a session with custom name', () => {
    const result = createSession([], { name: 'Custom Name' });

    expect(result.session.name).toBe('Custom Name');
  });

  it('should create a session with custom model', () => {
    const result = createSession([], { selectedModel: 'custom-model' });

    expect(result.session.selectedModel).toBe('custom-model');
  });

  it('should prepend new session to existing sessions', () => {
    const existing = [makeSession({ id: 'existing_1' })];
    const result = createSession(existing);

    expect(result.sessions).toHaveLength(2);
    expect(result.sessions[0]).toBe(result.session);
    expect(result.sessions[1].id).toBe('existing_1');
  });
});

describe('Session Renaming', () => {
  it('should rename a session successfully', () => {
    const sessions = [makeSession({ id: 's1', name: 'Old Name' })];
    const result = renameSession(sessions, 's1', 'New Name');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data![0].name).toBe('New Name');
    expect(result.data![0].id).toBe('s1');
  });

  it('should trim whitespace from session name', () => {
    const sessions = [makeSession({ id: 's1', name: 'Old Name' })];
    const result = renameSession(sessions, 's1', '  Trimmed  ');

    expect(result.success).toBe(true);
    expect(result.data![0].name).toBe('Trimmed');
  });

  it('should fail with empty name', () => {
    const sessions = [makeSession({ id: 's1' })];
    const result = renameSession(sessions, 's1', '');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Session name cannot be empty');
  });

  it('should fail with whitespace-only name', () => {
    const sessions = [makeSession({ id: 's1' })];
    const result = renameSession(sessions, 's1', '   ');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Session name cannot be empty');
  });

  it('should fail when session not found', () => {
    const sessions = [makeSession({ id: 's1' })];
    const result = renameSession(sessions, 'nonexistent', 'New Name');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Session not found');
  });

  it('should not mutate original sessions array', () => {
    const sessions = [makeSession({ id: 's1', name: 'Original' })];
    const result = renameSession(sessions, 's1', 'Renamed');

    expect(sessions[0].name).toBe('Original');
    expect(result.data![0].name).toBe('Renamed');
  });
});

describe('Session Deletion', () => {
  it('should delete a session successfully', () => {
    const sessions = [
      makeSession({ id: 's1' }),
      makeSession({ id: 's2' }),
    ];
    const result = deleteSession(sessions, 's1', 's2');

    expect(result.success).toBe(true);
    expect(result.data!.sessions).toHaveLength(1);
    expect(result.data!.sessions[0].id).toBe('s2');
    expect(result.data!.newActiveId).toBe('s2');
  });

  it('should switch to first remaining session when deleting active', () => {
    const sessions = [
      makeSession({ id: 's1' }),
      makeSession({ id: 's2' }),
      makeSession({ id: 's3' }),
    ];
    const result = deleteSession(sessions, 's1', 's1');

    expect(result.success).toBe(true);
    expect(result.data!.newActiveId).toBe('s2');
  });

  it('should return null active ID when deleting last session', () => {
    const sessions = [makeSession({ id: 's1' })];
    const result = deleteSession(sessions, 's1', 's1');

    expect(result.success).toBe(true);
    expect(result.data!.sessions).toHaveLength(0);
    expect(result.data!.newActiveId).toBeNull();
  });

  it('should keep active ID when deleting non-active session', () => {
    const sessions = [
      makeSession({ id: 's1' }),
      makeSession({ id: 's2' }),
    ];
    const result = deleteSession(sessions, 's2', 's1');

    expect(result.success).toBe(true);
    expect(result.data!.newActiveId).toBe('s1');
  });

  it('should fail when session not found', () => {
    const sessions = [makeSession({ id: 's1' })];
    const result = deleteSession(sessions, 'nonexistent', 's1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Session not found');
  });
});

describe('Session Export', () => {
  it('should export session to valid JSON', () => {
    const session = makeSession({ id: 's1', name: 'Export Test' });
    const exported = exportSession(session);

    const parsed = JSON.parse(exported);
    expect(parsed.version).toBe('1.0');
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.session.id).toBe('s1');
    expect(parsed.session.name).toBe('Export Test');
  });

  it('should include full session data in export', () => {
    const session = makeSession({
      id: 's1',
      name: 'Full Export',
      pinned: true,
      selectedModel: 'test-model',
      bookmarkedMessageIds: ['msg1', 'msg2'],
    });
    const exported = exportSession(session);
    const parsed = JSON.parse(exported);

    expect(parsed.session.pinned).toBe(true);
    expect(parsed.session.selectedModel).toBe('test-model');
    expect(parsed.session.bookmarkedMessageIds).toEqual(['msg1', 'msg2']);
  });
});

describe('Session Import', () => {
  it('should import a valid session', () => {
    const sessions = [makeSession({ id: 'existing' })];
    const exportData = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      session: makeSession({ id: 'imported_orig', name: 'Imported' }),
    });

    const result = importSession(sessions, exportData, 'default-model');

    expect(result.success).toBe(true);
    expect(result.data!.sessions).toHaveLength(2);
    expect(result.data!.session.name).toBe('Imported');
    expect(result.data!.session.id).toMatch(/^imported_/);
    expect(result.data!.session.archived).toBe(false);
  });

  it('should fail with invalid JSON', () => {
    const sessions = [makeSession()];
    const result = importSession(sessions, 'not json', 'model');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid JSON format');
  });

  it('should fail with missing session data', () => {
    const sessions = [makeSession()];
    const result = importSession(sessions, JSON.stringify({}), 'model');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid session file format');
  });

  it('should use default model if not specified in import', () => {
    const exportData = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      session: { id: 'orig', name: 'Test', createdAt: Date.now() },
    });

    const result = importSession([], exportData, 'fallback-model');

    expect(result.success).toBe(true);
    expect(result.data!.session.selectedModel).toBe('fallback-model');
  });
});

describe('Message Editing', () => {
  it('should edit a user message successfully', () => {
    const agentMemories = {
      Coordinator: [
        makeMessage({ role: 'user', content: 'Original message' }),
        makeMessage({ role: 'assistant', content: 'Response' }),
      ],
      Triage: [],
      Coder: [],
      Math: [],
      Cyn: [],
      Adso: [],
    };
    const messageId = 'Coordinator_0';
    const result = editMessage(agentMemories, 'Coordinator', messageId, 'Edited message');

    expect(result.success).toBe(true);
    expect(result.data!.Coordinator[0].content).toBe('Edited message');
    expect(result.data!.Coordinator[1].content).toBe('Response');
  });

  it('should trim whitespace from edited content', () => {
    const agentMemories = {
      Coordinator: [makeMessage({ role: 'user', content: 'Original' })],
      Triage: [], Coder: [], Math: [], Cyn: [], Adso: [],
    };
    const result = editMessage(agentMemories, 'Coordinator', 'Coordinator_0', '  Edited  ');

    expect(result.success).toBe(true);
    expect(result.data!.Coordinator[0].content).toBe('Edited');
  });

  it('should fail with empty content', () => {
    const agentMemories = {
      Coordinator: [makeMessage()],
      Triage: [], Coder: [], Math: [], Cyn: [], Adso: [],
    };
    const result = editMessage(agentMemories, 'Coordinator', 'Coordinator_0', '');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Message content cannot be empty');
  });

  it('should fail with invalid message index', () => {
    const agentMemories = {
      Coordinator: [makeMessage()],
      Triage: [], Coder: [], Math: [], Cyn: [], Adso: [],
    };
    const result = editMessage(agentMemories, 'Coordinator', 'Coordinator_99', 'New content');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid message ID');
  });

  it('should fail when agent memories not found', () => {
    const agentMemories: Record<string, Message[]> = {};
    const result = editMessage(agentMemories, 'Coordinator', 'Coordinator_0', 'New content');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Agent memories not found');
  });
});

describe('Message Deletion', () => {
  it('should delete a message successfully', () => {
    const agentMemories = {
      Coordinator: [
        makeMessage({ content: 'msg1' }),
        makeMessage({ content: 'msg2' }),
        makeMessage({ content: 'msg3' }),
      ],
      Triage: [], Coder: [], Math: [], Cyn: [], Adso: [],
    };
    const result = deleteMessage(agentMemories, 'Coordinator', 'Coordinator_1');

    expect(result.success).toBe(true);
    expect(result.data!.Coordinator).toHaveLength(2);
    expect(result.data!.Coordinator[0].content).toBe('msg1');
    expect(result.data!.Coordinator[1].content).toBe('msg3');
  });

  it('should fail with invalid message index', () => {
    const agentMemories = {
      Coordinator: [makeMessage()],
      Triage: [], Coder: [], Math: [], Cyn: [], Adso: [],
    };
    const result = deleteMessage(agentMemories, 'Coordinator', 'Coordinator_99');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid message ID');
  });

  it('should fail when agent memories not found', () => {
    const agentMemories: Record<string, Message[]> = {};
    const result = deleteMessage(agentMemories, 'Coordinator', 'Coordinator_0');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Agent memories not found');
  });
});

describe('Bookmark Management', () => {
  it('should add a bookmark', () => {
    const bookmarks = ['msg1', 'msg2'];
    const result = toggleBookmark(bookmarks, 'msg3');

    expect(result).toEqual(['msg1', 'msg2', 'msg3']);
  });

  it('should remove a bookmark', () => {
    const bookmarks = ['msg1', 'msg2', 'msg3'];
    const result = toggleBookmark(bookmarks, 'msg2');

    expect(result).toEqual(['msg1', 'msg3']);
  });

  it('should handle empty bookmark list', () => {
    const result = toggleBookmark([], 'msg1');

    expect(result).toEqual(['msg1']);
  });
});

describe('Pagination Logic', () => {
  it('should return correct page for first page', () => {
    const messages = Array.from({ length: 120 }, (_, i) => ({
      _originalIndex: i,
    })) as Array<{ _originalIndex: number }>;

    const result = getPaginatedMessages(messages, 1, 50);

    expect(result.messages).toHaveLength(50);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(50);
    expect(result.totalPages).toBe(3);
  });

  it('should return correct page for middle page', () => {
    const messages = Array.from({ length: 120 }, (_, i) => ({
      _originalIndex: i,
    })) as Array<{ _originalIndex: number }>;

    const result = getPaginatedMessages(messages, 2, 50);

    expect(result.messages).toHaveLength(50);
    expect(result.startIndex).toBe(50);
    expect(result.endIndex).toBe(100);
  });

  it('should handle last partial page', () => {
    const messages = Array.from({ length: 120 }, (_, i) => ({
      _originalIndex: i,
    })) as Array<{ _originalIndex: number }>;

    const result = getPaginatedMessages(messages, 3, 50);

    expect(result.messages).toHaveLength(20);
    expect(result.startIndex).toBe(100);
    expect(result.endIndex).toBe(120);
  });

  it('should handle fewer messages than one page', () => {
    const messages = Array.from({ length: 10 }, (_, i) => ({
      _originalIndex: i,
    })) as Array<{ _originalIndex: number }>;

    const result = getPaginatedMessages(messages, 1, 50);

    expect(result.messages).toHaveLength(10);
    expect(result.totalPages).toBe(1);
  });

  it('should handle empty messages', () => {
    const messages: Array<{ _originalIndex: number }> = [];

    const result = getPaginatedMessages(messages, 1, 50);

    expect(result.messages).toHaveLength(0);
    expect(result.totalPages).toBe(1);
  });
});

describe('Session Filtering', () => {
  it('should filter sessions by name', () => {
    const sessions = [
      makeSession({ id: 's1', name: 'Project Alpha' }),
      makeSession({ id: 's2', name: 'Project Beta' }),
      makeSession({ id: 's3', name: 'Other' }),
    ];

    const result = filterSessions(sessions, 'project');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('s1');
    expect(result[1].id).toBe('s2');
  });

  it('should return all sessions with empty query', () => {
    const sessions = [makeSession({ id: 's1' }), makeSession({ id: 's2' })];

    const result = filterSessions(sessions, '');

    expect(result).toHaveLength(2);
  });

  it('should return empty array when no matches', () => {
    const sessions = [makeSession({ id: 's1', name: 'Test' })];

    const result = filterSessions(sessions, 'nonexistent');

    expect(result).toHaveLength(0);
  });
});

describe('Session Sorting', () => {
  it('should sort pinned sessions first', () => {
    const sessions = [
      makeSession({ id: 's1', pinned: false, createdAt: 300 }),
      makeSession({ id: 's2', pinned: true, createdAt: 100 }),
      makeSession({ id: 's3', pinned: false, createdAt: 200 }),
    ];

    const result = sortSessions(sessions);

    expect(result[0].id).toBe('s2'); // pinned first
  });

  it('should sort by createdAt descending within same pin status', () => {
    const sessions = [
      makeSession({ id: 's1', pinned: false, createdAt: 100 }),
      makeSession({ id: 's2', pinned: false, createdAt: 300 }),
      makeSession({ id: 's3', pinned: false, createdAt: 200 }),
    ];

    const result = sortSessions(sessions);

    expect(result[0].id).toBe('s2'); // newest
    expect(result[1].id).toBe('s3');
    expect(result[2].id).toBe('s1'); // oldest
  });

  it('should not mutate original array', () => {
    const sessions = [
      makeSession({ id: 's1', createdAt: 100 }),
      makeSession({ id: 's2', createdAt: 200 }),
    ];

    sortSessions(sessions);

    expect(sessions[0].id).toBe('s1');
    expect(sessions[1].id).toBe('s2');
  });
});

describe('Utility Functions', () => {
  it('should generate correct message ID', () => {
    const id = generateMessageId('Coordinator', 5);
    expect(id).toBe('Coordinator_5');
  });

  it('should count total messages across agents', () => {
    const agentMemories = {
      Coordinator: [makeMessage(), makeMessage()],
      Triage: [makeMessage()],
      Coder: [makeMessage(), makeMessage(), makeMessage()],
      Math: [],
      Cyn: [makeMessage()],
      Adso: [],
    };

    const count = getTotalMessageCount(agentMemories);

    expect(count).toBe(7);
  });

  it('should return 0 for empty agent memories', () => {
    const agentMemories = {
      Coordinator: [],
      Triage: [],
      Coder: [],
      Math: [],
      Cyn: [],
      Adso: [],
    };

    const count = getTotalMessageCount(agentMemories);

    expect(count).toBe(0);
  });
});
