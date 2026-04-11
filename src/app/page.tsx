"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Activity, ShieldAlert, Code2, Calculator, MessageSquare, Flame, Database, Settings2, Network, UserCog, BookOpen, Key, ChevronDown, Plus, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { CompactSidebar } from '@/components/ui/compact-sidebar';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { AgentStatusBadge, AgentStatus } from '@/components/ui/agent-status';
import { MemoryMCP } from '@/components/ui/memory-mcp';
import { AgentConfigurator } from '@/components/ui/agent-configurator';
import { ApiSettingsModal } from '@/components/ui/api-settings';
import { ModelSelectorModal } from '@/components/ui/model-selector';
import { SwarmTelemetry } from '@/components/ui/swarm-telemetry';
import { MemoryWarning } from '@/components/ui/context-awareness';
import { ErrorHistoryModal } from '@/components/ui/error-history';
import { MessageBubble, StreamingBubble } from '@/components/ui/message-bubble';
import { TopNavbar } from '@/components/ui/top-navbar';
import { InputBar } from '@/components/ui/input-bar';
import { exportConversationToMarkdown, calculateSessionTokenUsage, getLocalStorageUsage, shouldArchiveSession, getTotalMessageCount } from '@/lib/utils/export-utils';
import { indexedDB, localStorageHelpers } from '@/lib/storage/indexeddb';
import type { ErrorHistoryEntry } from '@/lib/storage/indexeddb';

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
  archived: boolean;
  createdAt: number;
  agentMemories: Record<string, Message[]>;
  selectedModel: string;
  bookmarkedMessageIds: string[];
}

const ALL_PROFILES = [
  { name: "Coordinator", desc: "Master swarm orchestrator", icon: Network, color: "text-purple-500", bg: "bg-purple-950/30", border: "border-purple-900/50", hasTools: true },
  { name: "Triage", desc: "Main coordinator routing system", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-950/30", border: "border-red-900/50", hasTools: false },
  { name: "Coder", desc: "Software engineering logic", icon: Code2, color: "text-red-500", bg: "bg-red-950/30", border: "border-red-900/50", hasTools: true },
  { name: "Math", desc: "Complex computations engine", icon: Calculator, color: "text-red-500", bg: "bg-red-950/30", border: "border-red-900/50", hasTools: false },
  { name: "Cyn", desc: "Anomaly/Cyberops Hacker", icon: UserCog, color: "text-red-500", bg: "bg-red-950/30", border: "border-red-900/50", hasTools: true },
  { name: "Adso", desc: "Clerical Observer/Archivist", icon: BookOpen, color: "text-red-500", bg: "bg-red-950/30", border: "border-red-900/50", hasTools: false }
];

export default function SuperDashboard() {
  const [agentMemories, setAgentMemories] = useState<Record<string, Message[]>>({ "Coordinator": [], "Triage": [], "Coder": [], "Math": [], "Cyn": [], "Adso": [] });
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewingAgent, setViewingAgent] = useState("Coordinator");
  const [activeRoutingAgent, setActiveRoutingAgent] = useState("Coordinator");

  const [selectedModel, setSelectedModel] = useState("meta-llama/llama-3.3-70b-instruct:free");
  const [models, setModels] = useState<any[]>([]);

  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isWarRoomMode, setIsWarRoomMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Chat Session Management
  const [sessionId, setSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Message Management State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  const [deleteMessageConfirmId, setDeleteMessageConfirmId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  // Pagination state
  const [messagePage, setMessagePage] = useState(1);
  const MESSAGES_PER_PAGE = 50;

  // localStorage warning
  const [localStorageUsage, setLocalStorageUsage] = useState(0);

  // Context window awareness
  const [contextTokenCount, setContextTokenCount] = useState(0);
  const [showContextAwareness, setShowContextAwareness] = useState(true);

  // Archive management
  const [showArchived, setShowArchived] = useState(false);

  // Error history and retry
  const [isErrorHistoryOpen, setIsErrorHistoryOpen] = useState(false);
  const [retryingMessage, setRetryingMessage] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<{ migrated: number; errors: string | null } | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [lastErrorAgent, setLastErrorAgent] = useState<string | null>(null);

  // Markdown export options
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Customizations - Support for both OpenRouter and Groq
  const [openRouterKeys, setOpenRouterKeys] = useState<string[]>([]);
  const [groqKeys, setGroqKeys] = useState<string[]>([]);
  const [agentOverrides, setAgentOverrides] = useState<Record<string, { name?: string, instructions?: string, model?: string }>>({});
  const [enabledAgents, setEnabledAgents] = useState<Record<string, boolean>>({
    "Coordinator": true, "Triage": true, "Coder": true, "Math": true, "Cyn": true, "Adso": true
  });

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMemories, viewingAgent, isLoading, isWarRoomMode]);

  // Auto-archive sessions older than 30 days or with >500 messages
  const autoArchiveSessions = useCallback(async () => {
    setSessions(prev => {
      let changed = false;
      const updated = prev.map(s => {
        if (!s.archived && shouldArchiveSession(s)) {
          changed = true;
          return { ...s, archived: true };
        }
        return s;
      });
      if (changed) {
        // Persist to IndexedDB
        updated.forEach(async (s) => {
          try { await indexedDB.saveSession(s as unknown as Record<string, unknown>); } catch (e) { /* ignore */ }
        });
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // Migrate from localStorage to IndexedDB
        const migration = await indexedDB.migrateFromLocalStorage();
        if (migration.migrated > 0 || migration.errors) {
          setMigrationStatus(migration);
        }

        // Load OpenRouter keys
        const orKeys = localStorageHelpers.getApiKeys('openrouter');
        if (orKeys.length > 0) {
          setOpenRouterKeys(orKeys);
        }

        // Load Groq keys
        const groqK = localStorageHelpers.getApiKeys('groq');
        if (groqK.length > 0) {
          setGroqKeys(groqK);
        }

        // Load sessions from IndexedDB
        const dbSessions = await indexedDB.getAllSessions();
        // Ensure all sessions have the pinned, archived, and bookmarkedMessageIds fields
        const migratedSessions: ChatSession[] = (dbSessions as unknown as ChatSession[]).map((s) => ({
          ...s,
          pinned: s.pinned ?? false,
          archived: s.archived ?? false,
          bookmarkedMessageIds: s.bookmarkedMessageIds ?? [],
        }));
        setSessions(migratedSessions);

        // Load active session or create new one
        const activeSessionId = localStorageHelpers.getActiveSessionId();
        if (activeSessionId && migratedSessions.length > 0) {
          const activeSession = migratedSessions.find((s) => s.id === activeSessionId);
          if (activeSession) {
            setSessionId(activeSession.id);
            setAgentMemories(activeSession.agentMemories);
            setSelectedModel(activeSession.selectedModel || "meta-llama/llama-3.3-70b-instruct:free");
          }
        }
      } catch (e) {
        console.error('Failed to initialize sessions:', e);
      }

      // Create initial session if none exists
      if (sessions.length === 0) {
        createNewSession();
      }

      // Auto-archive old sessions on initial load
      autoArchiveSessions();

      setIsClient(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate a descriptive session name
  const generateSessionName = (firstMessage?: string): string => {
    if (firstMessage && firstMessage.trim()) {
      const truncated = firstMessage.trim().substring(0, 50);
      return truncated.length < firstMessage.trim().length ? `${truncated}...` : truncated;
    }
    return `Session ${new Date().toLocaleString()}`;
  };

  // Create new chat session
  const createNewSession = async () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      name: generateSessionName(),
      pinned: false,
      archived: false,
      createdAt: Date.now(),
      agentMemories: { "Coordinator": [], "Triage": [], "Coder": [], "Math": [], "Cyn": [], "Adso": [] },
      selectedModel: selectedModel,
      bookmarkedMessageIds: []
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    setSessionId(newSession.id);
    setAgentMemories(newSession.agentMemories);
    setActiveRoutingAgent("Coordinator");
    setViewingAgent("Coordinator");
    try { await indexedDB.saveSession(newSession as unknown as Record<string, unknown>); } catch (e) { /* ignore */ }
    localStorageHelpers.setActiveSessionId(newSession.id);
  };

  // Save current session
  const saveCurrentSession = async () => {
    if (!sessionId) return;

    const updatedSessions = sessions.map(s =>
      s.id === sessionId
        ? { ...s, agentMemories, selectedModel }
        : s
    );

    setSessions(updatedSessions);
    const current = updatedSessions.find(s => s.id === sessionId);
    if (current) {
      try { await indexedDB.saveSession(current as unknown as Record<string, unknown>); } catch (e) { /* ignore */ }
    }
  };

  // Load a session
  const loadSession = (session: ChatSession) => {
    setSessionId(session.id);
    setAgentMemories(session.agentMemories);
    setSelectedModel(session.selectedModel);
    localStorageHelpers.setActiveSessionId(session.id);
  };

  // Delete a session
  const deleteSession = async (sessionToDelete: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionToDelete);
    setSessions(updatedSessions);
    try { await indexedDB.deleteSession(sessionToDelete); } catch (e) { /* ignore */ }

    // If deleted active session, create new one
    if (sessionToDelete === sessionId) {
      if (updatedSessions.length > 0) {
        loadSession(updatedSessions[0]);
      } else {
        createNewSession();
      }
    }
  };

  // Rename a session
  const renameSession = async (sessionIdToRename: string, newName: string) => {
    if (!newName.trim()) return;
    const updatedSession = sessions.find(s => s.id === sessionIdToRename);
    if (!updatedSession) return;
    const renamedSession = { ...updatedSession, name: newName.trim() };
    const updatedSessions = sessions.map(s =>
      s.id === sessionIdToRename ? renamedSession : s
    );
    setSessions(updatedSessions);
    try { await indexedDB.saveSession(renamedSession as unknown as Record<string, unknown>); } catch (e) { /* ignore */ }
    setEditingSessionId(null);
    setEditingName('');
  };

  // Toggle pin on a session
  const togglePinSession = async (sessionIdToToggle: string) => {
    const updatedSession = sessions.find(s => s.id === sessionIdToToggle);
    if (!updatedSession) return;
    const toggledSession = { ...updatedSession, pinned: !updatedSession.pinned };
    const updatedSessions = sessions.map(s =>
      s.id === sessionIdToToggle ? toggledSession : s
    );
    setSessions(updatedSessions);
    try { await indexedDB.saveSession(toggledSession as unknown as Record<string, unknown>); } catch (e) { /* ignore */ }
  };

  // Delete session with confirmation
  const deleteSessionWithConfirmation = async (sessionToDelete: string) => {
    if (deleteConfirmId === sessionToDelete) {
      // User confirmed
      await deleteSession(sessionToDelete);
      setDeleteConfirmId(null);
    } else {
      // Show confirmation
      setDeleteConfirmId(sessionToDelete);
    }
  };

  // Confirm deletion
  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteSession(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  // Generate a unique message ID
  const generateMessageId = (agentName: string, index: number): string => {
    return `${agentName}_${index}`;
  };

  // Edit a user message
  const editMessage = (agentName: string, messageId: string, newContent: string) => {
    if (!newContent.trim()) return;
    const updatedMemories = { ...agentMemories };
    const messages = [...(updatedMemories[agentName] || [])];
    // Parse messageId to get index (format: "agentName_index")
    const parts = messageId.split('_');
    const index = parseInt(parts[parts.length - 1], 10);
    if (isNaN(index) || index < 0 || index >= messages.length) return;
    messages[index] = { ...messages[index], content: newContent.trim() };
    updatedMemories[agentName] = messages;
    setAgentMemories(updatedMemories);
    setEditingMessageId(null);
    setEditingMessageContent('');
  };

  // Delete any message
  const deleteMessage = async (agentName: string, messageId: string) => {
    const updatedMemories = { ...agentMemories };
    const messages = [...(updatedMemories[agentName] || [])];
    const parts = messageId.split('_');
    const index = parseInt(parts[parts.length - 1], 10);
    if (isNaN(index) || index < 0 || index >= messages.length) return;
    messages.splice(index, 1);
    updatedMemories[agentName] = messages;
    setAgentMemories(updatedMemories);
    setDeleteMessageConfirmId(null);

    // Remove from bookmarks if bookmarked
    const currentSession = sessions.find(s => s.id === sessionId);
    if (currentSession) {
      const updatedBookmarks = currentSession.bookmarkedMessageIds.filter(id => id !== messageId);
      const updatedSession = { ...currentSession, bookmarkedMessageIds: updatedBookmarks };
      const updatedSessions = sessions.map(s =>
        s.id === sessionId ? updatedSession : s
      );
      setSessions(updatedSessions);
      try { await indexedDB.saveSession(updatedSession as unknown as Record<string, unknown>); } catch (e) { /* ignore */ }
    }
  };

  // Copy message content to clipboard
  const copyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  // Toggle bookmark on a message
  const toggleBookmark = async (agentName: string, messageId: string) => {
    const currentSession = sessions.find(s => s.id === sessionId);
    if (!currentSession) return;

    const isBookmarked = currentSession.bookmarkedMessageIds.includes(messageId);
    let updatedBookmarks: string[];
    if (isBookmarked) {
      updatedBookmarks = currentSession.bookmarkedMessageIds.filter(id => id !== messageId);
    } else {
      updatedBookmarks = [...currentSession.bookmarkedMessageIds, messageId];
    }

    const updatedSession = { ...currentSession, bookmarkedMessageIds: updatedBookmarks };
    const updatedSessions = sessions.map(s =>
      s.id === sessionId ? updatedSession : s
    );
    setSessions(updatedSessions);
    try { await indexedDB.saveSession(updatedSession as unknown as Record<string, unknown>); } catch (e) { /* ignore */ }
  };

  // Start editing a message
  const startEditingMessage = (agentName: string, messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingMessageContent(content);
  };

  // Cancel editing a message
  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditingMessageContent('');
  };

  // Start editing a session name
  const startEditing = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingName(session.name);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditingName('');
  };

  // Dismiss error message
  const dismissErrorMessage = (agentName: string, messageIndex: number) => {
    const updatedMemories = { ...agentMemories };
    const messages = updatedMemories[agentName] || [];
    // Filter out the error message at the specific index
    updatedMemories[agentName] = messages.filter((_, idx) => idx !== messageIndex);
    setAgentMemories(updatedMemories);
  };

  // Log error to IndexedDB
  const logError = async (agentName: string, errorMessage: string, context: string, userMessage?: string) => {
    try {
      const entry: ErrorHistoryEntry = {
        id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        timestamp: Date.now(),
        agentName,
        errorMessage,
        context,
        lastUserMessage: userMessage || lastUserMessage || undefined,
        sessionId: sessionId || undefined,
      };
      await indexedDB.addErrorEntry(entry);
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  };

  // Retry the last failed message
  const retryLastMessage = async () => {
    if (!lastUserMessage || !lastErrorAgent || isLoading) return;

    setRetryingMessage(lastUserMessage);
    setInputMessage(lastUserMessage);
    setViewingAgent(lastErrorAgent);
    setActiveRoutingAgent(lastErrorAgent);

    // Brief delay so state updates propagate
    await new Promise(r => setTimeout(r, 50));

    // Trigger send
    const prevInputMessage = lastUserMessage;
    setLastUserMessage(null);
    setLastErrorAgent(null);
    setRetryingMessage(null);

    // Reuse sendMessage flow by setting input and calling it
    setInputMessage(prevInputMessage);
    await sendMessage();
  };

  // Clear error history
  const clearErrorHistory = async () => {
    try { await indexedDB.clearErrorHistory(); } catch (e) { /* ignore */ }
  };

  // Cancel streaming
  const cancelStreaming = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  // Export current session to Markdown
  const exportSessionToMarkdown = () => {
    const currentSession = sessions.find(s => s.id === sessionId);
    if (!currentSession) return;
    exportConversationToMarkdown({
      session: currentSession,
      agentName: viewingAgent !== "WarRoom" ? viewingAgent : undefined,
      includeMetadata: true,
      includeTimestamps: true
    });
  };

  // Archive a session
  const archiveSession = async (sessionIdToArchive: string) => {
    const updatedSession = sessions.find(s => s.id === sessionIdToArchive);
    if (!updatedSession) return;
    const archivedSession = { ...updatedSession, archived: true };
    const updatedSessions = sessions.map(s =>
      s.id === sessionIdToArchive ? archivedSession : s
    );
    setSessions(updatedSessions);
    try { await indexedDB.saveSession(archivedSession as unknown as Record<string, unknown>); } catch (e) { /* ignore */ }

    // If archiving active session, switch to first non-archived
    if (sessionIdToArchive === sessionId) {
      const nonArchived = updatedSessions.filter(s => !s.archived);
      if (nonArchived.length > 0) {
        loadSession(nonArchived[0]);
      }
    }
  };

  // Unarchive a session
  const unarchiveSession = async (sessionIdToUnarchive: string) => {
    const updatedSession = sessions.find(s => s.id === sessionIdToUnarchive);
    if (!updatedSession) return;
    const unarchivedSession = { ...updatedSession, archived: false };
    const updatedSessions = sessions.map(s =>
      s.id === sessionIdToUnarchive ? unarchivedSession : s
    );
    setSessions(updatedSessions);
    try { await indexedDB.saveSession(unarchivedSession as unknown as Record<string, unknown>); } catch (e) { /* ignore */ }
  };

  // Export current session
  const exportSession = () => {
    const currentSession = sessions.find(s => s.id === sessionId);
    if (!currentSession) return;

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      session: currentSession
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${currentSession.name.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import session
  const importSession = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        if (!importData.session || !importData.session.id) {
          alert('Invalid session file format');
          return;
        }

        const importedSession: ChatSession = {
          id: `imported_${Date.now()}`,
          name: importData.session.name || 'Imported Session',
          pinned: importData.session.pinned ?? false,
          archived: false,
          createdAt: importData.session.createdAt || Date.now(),
          agentMemories: importData.session.agentMemories || { "Coordinator": [], "Triage": [], "Coder": [], "Math": [], "Cyn": [], "Adso": [] },
          selectedModel: importData.session.selectedModel || selectedModel,
          bookmarkedMessageIds: importData.session.bookmarkedMessageIds || []
        };

        const updatedSessions = [...sessions, importedSession];
        setSessions(updatedSessions);
        try { await indexedDB.saveSession(importedSession as unknown as Record<string, unknown>); } catch (err) { /* ignore */ }

        // Auto-load imported session
        loadSession(importedSession);
      } catch (err) {
        alert('Failed to import session: Invalid JSON file');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  // Persist session data anytime it changes
  useEffect(() => {
    if (isClient && sessionId) {
      saveCurrentSession();
    }
  }, [agentMemories, isClient, sessionId]);

  // Monitor localStorage usage
  useEffect(() => {
    if (!isClient) return;
    const checkUsage = () => {
      setLocalStorageUsage(getLocalStorageUsage());
    };
    checkUsage();
    const interval = setInterval(checkUsage, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [isClient]);

  // Calculate context window token usage
  useEffect(() => {
    if (!isClient) return;
    const tokens = calculateSessionTokenUsage(agentMemories);
    setContextTokenCount(tokens);
  }, [agentMemories, isClient]);

  // Reset pagination when viewing agent changes
  useEffect(() => {
    setMessagePage(1);
  }, [viewingAgent]);

  // Load models when AgentConfigurator opens
  useEffect(() => {
    if (isConfigOpen && models.length === 0) {
      async function fetchModels() {
        try {
          const res = await fetch('/api/models?provider=openrouter');
          if (res.ok) {
            const data = await res.json();
            setModels(data.models || []);
          }
        } catch (e) { }
      }
      fetchModels();
    }
  }, [isConfigOpen, models.length]);

  // Helper to get combined API keys based on selected model provider
  const getApiKeysForModel = () => {
    // If model is a Groq model, use Groq keys; otherwise use OpenRouter keys
    const isGroqModel = selectedModel.includes('groq') || selectedModel.includes('llama-3') || selectedModel.includes('mixtral') || selectedModel.includes('gemma');
    return isGroqModel ? groqKeys : openRouterKeys;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const activeAgentsNames = Object.keys(enabledAgents).filter(k => enabledAgents[k]);
    const userMessage: Message = { role: 'user', content: inputMessage };
    const messageText = inputMessage;

    setInputMessage("");
    setIsLoading(true);

    if (isWarRoomMode) {
      setViewingAgent("WarRoom");
      setActiveRoutingAgent("WarRoom");
      let currentThread = [...(agentMemories["WarRoom"] || [])];
      currentThread.push(userMessage);

      setAgentMemories((prev: any) => ({ ...prev, WarRoom: [...currentThread] }));

      let targetAgentsToRun = activeAgentsNames;

      try {
        const routerRes = await fetch('/api/war-room-router', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userPrompt: inputMessage,
            enabledAgents,
            selectedModel,
            apiKeys: getApiKeysForModel()
          })
        });
        if (routerRes.ok) {
          const rData = await routerRes.json();
          if (rData.activeAgentsNames && rData.activeAgentsNames.length > 0) {
            targetAgentsToRun = rData.activeAgentsNames;

            // Inject a system log to inform user who was selected
            currentThread.push({ role: 'system', content: `[WAR ROOM ROUTER]: Delegating response protocol exclusively to agents: ${targetAgentsToRun.join(', ')}.` });
            setAgentMemories((prev: any) => ({ ...prev, WarRoom: [...currentThread] }));
          }
        }
      } catch (e) {
        console.log("Router fallback, using all agents:", e);
      }

      for (let i = 0; i < targetAgentsToRun.length; i++) {
        const agentName = targetAgentsToRun[i];
        setActiveRoutingAgent(agentName); // For UI Typing indicator

        if (i > 0) {
          // War Room Rate Limit Pacing (2 seconds) to avoid OpenRouter Free-tier 429 limits
          await new Promise(res => setTimeout(res, 2000));
        }

        try {
          const localizedThread = currentThread.map(msg => {
            if (msg.role === 'assistant' && msg.name !== agentName) {
              return {
                ...msg,
                role: 'user',
                content: `[LOG FROM ALLIED AGENT '${msg.name || "Unknown"}']: ${msg.content}`
              } as Message;
            }
            return msg;
          });

          const warRoomOverrides = JSON.parse(JSON.stringify(agentOverrides));
          const bName = warRoomOverrides[agentName]?.name || agentName;
          if (!warRoomOverrides[agentName]) warRoomOverrides[agentName] = {};

          const baseInstructions = warRoomOverrides[agentName].instructions || ALL_PROFILES.find(p => p.name === agentName)?.desc || "";
          warRoomOverrides[agentName].instructions = `[WAR ROOM PROTOCOL ACTIVE: You are in a shared terminal. Your identity is strictly ${bName}. You must NEVER pretend to be another agent. Read the user's prompt and allied agents' logs. If you have nothing valuable to add to the objective, reply exactly with the word: [SILENCE]. Otherwise, speak your mind.]\n\n${baseInstructions}`;

          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentMemories: { [agentName]: localizedThread },
              activeAgentName: agentName,
              selectedModel,
              enabledAgents,
              agentOverrides: warRoomOverrides,
              apiKeys: getApiKeysForModel()
            })
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();

          // Extract what the agent just generated
          const agentLogs = data.agentMemories[agentName] || [];
          const newResponses = agentLogs.slice(currentThread.length);

          currentThread = [...currentThread, ...newResponses];
          setAgentMemories((prev: any) => ({ ...prev, WarRoom: [...currentThread] }));
        } catch (e: any) {
          currentThread.push({ role: 'system', content: `[WAR ROOM ERROR - ${agentName}]: ${e.message}` });
          setAgentMemories((prev: any) => ({ ...prev, WarRoom: [...currentThread] }));
          setLastUserMessage(messageText);
          setLastErrorAgent(agentName);
          logError(agentName, e.message, 'War Room', messageText);

          if (e.message.includes("Circuit breaker is open") || e.message.includes("Rate limit") || e.message.includes("OpenRouter Error")) {
            currentThread.push({ role: 'system', content: `[WAR ROOM ABORT]: Rantai terputus. Traffic hulu (upstream) kelebihan batas atau ditolak.` });
            setAgentMemories((prev: any) => ({ ...prev, WarRoom: [...currentThread] }));
            break; // Terminate agent loop early
          }
        }
      }
      setActiveRoutingAgent("WarRoom");
      setIsLoading(false);
      return;
    }

    let targetAgent = viewingAgent;
    if (targetAgent === "WarRoom") targetAgent = "Coordinator"; // Fallback if toggled off

    // Explicit Mentions override logic (@agent)
    for (const name of activeAgentsNames) {
      const checkName = (agentOverrides[name]?.name || name).toLowerCase();
      if (inputMessage.toLowerCase().includes(`@${checkName}`)) {
        targetAgent = name;
        break;
      }
    }

    setActiveRoutingAgent(targetAgent);
    setViewingAgent(targetAgent);

    const updatedMemories = { ...agentMemories };
    if (!updatedMemories[targetAgent]) updatedMemories[targetAgent] = [];
    updatedMemories[targetAgent] = [...updatedMemories[targetAgent], userMessage];

    setAgentMemories(updatedMemories);

    // Use streaming for regular chat
    const controller = new AbortController();
    setAbortController(controller);
    setStreamingContent('');

    try {
      const res = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMemories[targetAgent] || [],
          model: selectedModel,
          apiKeys: getApiKeysForModel()
        }),
        signal: controller.signal
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);
                if (parsed.token) {
                  streamedContent += parsed.token;
                  setStreamingContent(streamedContent);
                } else if (parsed.done) {
                  // Streaming complete
                  const finalContent = parsed.content || streamedContent;
                  const assistantMessage: Message = { role: 'assistant', content: finalContent, name: targetAgent };
                  updatedMemories[targetAgent] = [...updatedMemories[targetAgent], assistantMessage];
                  setAgentMemories(updatedMemories);
                  setStreamingContent('');
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.name !== 'AbortError') {
        const errMemories = { ...agentMemories };
        errMemories[targetAgent] = [...(errMemories[targetAgent] || []), { role: 'system', content: `[ERROR]: ${err.message}` }];
        setAgentMemories(errMemories);
        setLastUserMessage(messageText);
        setLastErrorAgent(targetAgent);
        logError(targetAgent, err.message, 'Chat', messageText);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
      setStreamingContent('');
    }
  };

  const currentMessages = agentMemories[viewingAgent] || [];
  const currentSession = sessions.find(s => s.id === sessionId);
  const bookmarkedIds = currentSession?.bookmarkedMessageIds || [];
  const chatMessagesRaw = currentMessages
    .map((m, i) => ({ ...m, _originalIndex: i }))
    .filter(m => m.role === 'user' || (m.role === 'assistant' && !m.tool_calls) || m.role === 'system');

  // Apply bookmark filter if enabled
  const filteredMessages = showBookmarkedOnly
    ? chatMessagesRaw.filter(m => {
      const msgId = generateMessageId(viewingAgent, m._originalIndex);
      return bookmarkedIds.includes(msgId);
    })
    : chatMessagesRaw;

  // Pagination
  const totalMessages = filteredMessages.length;
  const totalPages = Math.max(1, Math.ceil(totalMessages / MESSAGES_PER_PAGE));
  const startIndex = (messagePage - 1) * MESSAGES_PER_PAGE;
  const endIndex = Math.min(startIndex + MESSAGES_PER_PAGE, totalMessages);
  const chatMessages = filteredMessages.slice(startIndex, endIndex);

  const viewingAgentName = agentOverrides[viewingAgent]?.name || viewingAgent;

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-black overflow-hidden relative font-mono text-red-500 items-center justify-center">
        {/* Background Image Layer */}
        <div 
          className="absolute inset-0 login-bg-image blur-[2px] scale-105 bg-cover bg-center"
          style={{ backgroundImage: `url('/cyn.webp')` }} 
        />
        <div className="absolute inset-0 bg-black/60 z-0" />
        <div className="absolute inset-0 hud-vignette z-0" />
        
        {/* Radar Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] radar-ring z-10 opacity-30 pointer-events-none" />
        
        {/* Auth Interface */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 flex flex-col items-center glass-panel-strong p-12 bracket-corners max-w-md w-full"
        >
          <div className="flex items-center gap-4 mb-8">
            <Flame size={32} className="text-[#ff1a1a] drop-shadow-[0_0_15px_#ff1a1a]" />
            <h1 className="text-3xl font-black tracking-[0.3em] uppercase glow-text">Cortisol</h1>
          </div>

          <div className="w-full space-y-6">
            <div className="text-center space-y-2">
              <div className="section-label text-red-500/80 tracking-[0.5em]">System Secure</div>
              <p className="text-xs text-red-400/50 uppercase tracking-wider">Awaiting Override Protocol</p>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />

            <button 
              onClick={() => setIsAuthenticated(true)}
              className="w-full group relative px-6 py-4 bg-red-950/40 hover:bg-red-900/40 transition-all duration-300 border border-red-900/50 hover:border-[#ff1a1a] overflow-hidden clip-angled"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff1a1a]/0 via-[#ff1a1a]/10 to-[#ff1a1a]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="relative flex items-center justify-center gap-3">
                <Network size={16} className="text-red-500 group-hover:text-[#ff1a1a] transition-colors" />
                <span className="text-sm font-bold uppercase tracking-[0.2em] text-red-500 group-hover:text-red-100 transition-colors glow-text-sm">
                  Initialize Link
                </span>
              </div>
            </button>
          </div>
        </motion.div>
        
        <div className="scanlines z-50 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[35%_65%] grid-rows-[60%_40%] h-screen bg-[#000000] overflow-hidden text-gray-300 relative p-6 gap-6" style={{ fontFamily: 'var(--font-display)' }}>
      <div className="aurora-bg" />
      <div className="scanlines" />

      {/* Memory Usage Warning */}
      <AnimatePresence>
        <MemoryWarning currentUsage={localStorageUsage} />
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          PANEL 1: TERMINAL & SYSTEM LOG (Left Column, Full Height)
      ═══════════════════════════════════════════ */}
      <div className="col-start-1 col-end-2 row-start-1 row-end-3 w-full h-full flex flex-col z-10 border border-red-900/50 bg-[rgba(5,0,0,0.85)] relative clip-angled custom-panel-glow">
        {/* Terminal Header & Session Compact */}
        <div className="shrink-0 border-b border-red-900/30 px-4 py-3 bg-[#050000]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-red-500 shrink-0 drop-shadow-[0_0_5px_#ff1a1a]" />
              <span className="text-[13px] font-black text-red-500 tracking-widest glow-text-sm uppercase">Cortisol Terminal</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => deleteSessionWithConfirmation(sessionId)} className="text-red-900 hover:text-[#ff1a1a] transition-colors"><Trash2 size={12} /></button>
              <button onClick={exportSession} className="text-red-900 hover:text-[#ff1a1a] transition-colors"><Download size={12} /></button>
            </div>
          </div>
          <div className="max-h-[80px] overflow-y-auto no-scrollbar font-mono">
            <CompactSidebar
              sessions={sessions}
              sessionId={sessionId}
              sessionSearchQuery={sessionSearchQuery}
              setSessionSearchQuery={setSessionSearchQuery}
              editingSessionId={editingSessionId}
              editingName={editingName}
              setEditingName={setEditingName}
              deleteConfirmId={deleteConfirmId}
              createNewSession={createNewSession}
              deleteSessionWithConfirmation={deleteSessionWithConfirmation}
              confirmDelete={confirmDelete}
              cancelDelete={cancelDelete}
              exportSession={exportSession}
              importSession={importSession}
              loadSession={loadSession}
              renameSession={renameSession}
              cancelEditing={cancelEditing}
              startEditing={startEditing}
              togglePinSession={togglePinSession}
              archiveSession={archiveSession}
              unarchiveSession={unarchiveSession}
            />
          </div>
        </div>

        {/* ── Terminal Neural Stream (Chat History) ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar w-full px-4 py-4 pb-20 relative chat-grid-bg">
          {chatMessages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center gap-6"
            >
              <div className="relative bracket-corners p-8 opacity-50">
                <ShieldAlert size={60} className="text-red-700" />
              </div>
              <div className="text-center">
                <div className="section-label mb-2 tracking-[0.4em]">system idle</div>
                <p className="text-[10px] text-red-900/50 font-mono uppercase tracking-[0.2em] leading-relaxed">
                  Awaiting root command...<br />
                  Log empty.
                </p>
              </div>
            </motion.div>
          )}

          {/* Messages */}
          {chatMessages.map((msg, i) => {
            const isError = msg.role === 'system' && msg.content?.includes('[ERROR]');
            const originalIndex = msg._originalIndex ?? -1;
            const messageId = generateMessageId(viewingAgent, originalIndex);
            const isBookmarked = bookmarkedIds.includes(messageId);
            const isEditing = editingMessageId === messageId;
            const isDeleteConfirm = deleteMessageConfirmId === messageId;
            const isCopied = copiedMessageId === messageId;

            return (
              <MessageBubble
                key={`${messageId}_${i}`}
                msg={msg}
                index={i}
                messageId={messageId}
                isBookmarked={isBookmarked}
                isEditing={isEditing}
                isDeleteConfirm={isDeleteConfirm}
                isCopied={isCopied}
                editingMessageContent={editingMessageContent}
                viewingAgentName={viewingAgentName}
                isLoading={isLoading}
                lastUserMessage={lastUserMessage}
                lastErrorAgent={lastErrorAgent}
                viewingAgent={viewingAgent}
                onEdit={() => startEditingMessage(viewingAgent, messageId, msg.content || '')}
                onEditSave={() => editMessage(viewingAgent, messageId, editingMessageContent)}
                onEditCancel={cancelEditingMessage}
                onEditChange={setEditingMessageContent}
                onDelete={() => deleteMessage(viewingAgent, messageId)}
                onDeleteConfirm={() => setDeleteMessageConfirmId(messageId)}
                onDeleteCancel={() => setDeleteMessageConfirmId(null)}
                onCopy={() => copyMessage(msg.content || '', messageId)}
                onBookmark={() => toggleBookmark(viewingAgent, messageId)}
                onDismissError={() => dismissErrorMessage(viewingAgent, originalIndex)}
                onRetry={retryLastMessage}
              />
            );
          })}

          {/* Streaming / Typing */}
          {isLoading && viewingAgent === activeRoutingAgent && (
            <>
              {streamingContent ? (
                <StreamingBubble
                  agentName={agentOverrides[activeRoutingAgent]?.name || activeRoutingAgent}
                  content={streamingContent}
                />
              ) : (
                <TypingIndicator agentName={agentOverrides[activeRoutingAgent]?.name || activeRoutingAgent} />
              )}
            </>
          )}

          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Palette */}
        <div className="shrink-0 w-full z-50 p-2 bg-[#050000]">
          <InputBar
            inputMessage={inputMessage}
            isLoading={isLoading}
            viewingAgentName={viewingAgentName}
            isWarRoomMode={isWarRoomMode}
            onChange={setInputMessage}
            onSend={sendMessage}
            onCancel={cancelStreaming}
          />
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════
          PANEL 2: SWARM TOPOLOGY (Nodes) -> Top Right
      ═══════════════════════════════════════════════════════════════ */}
      <div className="col-start-2 col-end-3 row-start-1 row-end-2 w-full h-full flex flex-col z-10 border border-red-900/50 bg-[#080000] relative clip-angled custom-panel-glow">
        <div className="px-6 py-4 border-b border-red-900/30 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <div className="pulse-dot" />
            <div className="section-label tracking-[0.4em] text-red-500">Swarm Topology Grid</div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setIsConfigOpen(true)} className="p-1 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors"><Settings2 size={12} /></button>
             <button onClick={() => setIsMcpOpen(true)} className="p-1 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors"><Database size={12} /></button>
             <button onClick={() => setIsApiSettingsOpen(true)} className="p-1 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors"><Key size={12} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_PROFILES.map((prof) => {
            const Icon = prof.icon;
            const isViewing = viewingAgent === prof.name;
            const isActiveEngine = activeRoutingAgent === prof.name;
            const msgCount = (agentMemories[prof.name] || []).length;
            const displayName = agentOverrides[prof.name]?.name || prof.name;

            return (
              <div
                key={prof.name}
                onClick={() => setViewingAgent(prof.name)}
                className={`flex flex-col items-center justify-center p-4 border transition-all cursor-pointer clip-angled ${
                  isViewing 
                    ? 'border-[#ff1a1a] bg-red-950/20 shadow-[0_0_15px_rgba(255,0,0,0.15)] glow-border' 
                    : 'border-red-900/20 hover:border-red-600/50 bg-black/40'
                } ${!enabledAgents[prof.name] ? 'opacity-40' : ''}`}
              >
                <div className={`p-3 rounded-full mb-3 ${isActiveEngine && isLoading ? 'animate-pulse bg-[#ff1a1a]/20' : 'bg-red-950/40'}`}>
                  <Icon size={24} className={isViewing ? 'text-[#ff1a1a]' : 'text-red-700'} />
                </div>
                <div className="text-[12px] font-black uppercase tracking-widest text-gray-300 text-center glow-text-sm">
                  {displayName}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <AgentStatusBadge status={isActiveEngine && isLoading ? 'thinking' : 'idle'} />
                  {msgCount > 0 && <span className="text-[10px] text-red-900 ml-2 font-mono">[{msgCount}]</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          PANEL 3: TELEMETRY & ENGINE DECODER -> Bottom Right
      ═══════════════════════════════════════════════════════════════ */}
      <div className="col-start-2 col-end-3 row-start-2 row-end-3 w-full h-full flex z-10 border border-red-900/50 bg-[#060000] relative clip-angled custom-panel-glow">
        
        {/* Radar Animation Left side */}
        <div className="w-1/3 border-r border-red-900/30 flex items-center justify-center relative overflow-hidden bg-black/60">
           <div className="absolute inset-0 chat-grid-bg opacity-30" />
           <div className="w-40 h-40 radar-ring opacity-40 absolute" />
           <div className="w-64 h-64 radar-ring opacity-20 absolute" style={{ animationDirection: 'reverse', animationDuration: '20s' }} />
           
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 60, ease: "linear", repeat: Infinity }}
             className="w-24 h-24 border-2 border-dashed border-[#ff1a1a]/50 rounded-full flex items-center justify-center relative z-10 bg-black/50 backdrop-blur-sm"
           >
             <Activity size={24} className="text-[#ff1a1a] animate-pulse glow-text" />
             <div className="absolute inset-0 border border-[#ff1a1a] rounded-full scale-110 opacity-30" />
           </motion.div>
        </div>

        {/* Telemetry Right Side */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="section-label tracking-[0.3em]">Telemetry</div>
              <button 
                onClick={() => setIsModelSelectorOpen(true)}
                className="px-3 py-1 border border-red-900/50 text-[#c4c4c4] text-[10px] font-mono hover:bg-[#ff1a1a]/10 hover:border-[#ff1a1a] transition-all truncate max-w-[200px]"
              >
                {selectedModel}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mt-6">
              <div className="border border-red-900/20 bg-black/40 p-4 clip-bottom-right">
                <span className="text-[10px] text-red-600/70 uppercase block mb-1 font-bold">Context Limit</span>
                <div className="text-xl font-mono text-gray-200">
                  <span className={contextTokenCount > 100000 ? "text-red-500" : "text-[#c4c4c4]"}>{(contextTokenCount / 1000).toFixed(1)}k</span> <span className="text-red-900">/ 128k</span>
                </div>
              </div>
              <div className="border border-red-900/20 bg-black/40 p-4 clip-bottom-right">
                <span className="text-[10px] text-red-600/70 uppercase block mb-1 font-bold">Engine State</span>
                <div className={`text-xl font-mono ${isLoading ? "text-[#ff1a1a] animate-pulse glow-text-sm" : "text-gray-400"}`}>
                  {isLoading ? "PROCESSING" : "IDLE"}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-red-900/30 pt-4 flex gap-4">
             <button
               onClick={() => setIsWarRoomMode(!isWarRoomMode)}
               className={`flex-1 py-2 text-[11px] uppercase font-black tracking-widest clip-angled transition-all border ${
                 isWarRoomMode ? 'bg-[#ff1a1a]/20 border-[#ff1a1a] text-[#ff1a1a] shadow-[0_0_15px_rgba(255,0,0,0.3)]' : 'bg-black/50 border-red-900/40 text-red-500 hover:border-red-600'
               }`}
             >
               War Room Mode
             </button>
             <button 
               onClick={() => exportConversationToMarkdown({ session: sessions.find(s => s.id === sessionId)!, includeMetadata: true, includeTimestamps: true })}
               className="px-4 py-2 bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors clip-angled font-black tracking-widest text-[11px] uppercase"
             >
               Export Arch
             </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isMcpOpen && <MemoryMCP isOpen={isMcpOpen} onClose={() => setIsMcpOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isConfigOpen && (
          <AgentConfigurator
            frontendProfiles={ALL_PROFILES}
            enabledAgents={enabledAgents}
            setEnabledAgents={setEnabledAgents}
            agentOverrides={agentOverrides}
            setAgentOverrides={setAgentOverrides}
            models={models}
            isOpen={isConfigOpen}
            onClose={() => setIsConfigOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <SwarmTelemetry
          isOpen={isTelemetryOpen}
          onClose={() => setIsTelemetryOpen(false)}
          activeAgentsNames={activeRoutingAgent ? [activeRoutingAgent] : []}
          enabledAgents={enabledAgents}
        />
      </AnimatePresence>

      <AnimatePresence>
        {isApiSettingsOpen && (
          <ApiSettingsModal
            isOpen={isApiSettingsOpen}
            onClose={() => setIsApiSettingsOpen(false)}
            onSave={(keys, provider) => {
              if (provider === 'openrouter') setOpenRouterKeys(keys);
              else setGroqKeys(keys);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModelSelectorOpen && (
          <ModelSelectorModal
            isOpen={isModelSelectorOpen}
            onClose={() => setIsModelSelectorOpen(false)}
            selectedModel={selectedModel}
            onSelectModel={(modelId) => {
              setSelectedModel(modelId);
              setIsModelSelectorOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isErrorHistoryOpen && (
          <ErrorHistoryModal
            isOpen={isErrorHistoryOpen}
            onClose={() => setIsErrorHistoryOpen(false)}
            onRetry={(message, agentName) => {
              setViewingAgent(agentName);
              setActiveRoutingAgent(agentName);
              setInputMessage(message);
              setIsErrorHistoryOpen(false);
              setTimeout(() => {
                setLastUserMessage(null);
                setLastErrorAgent(null);
              }, 100);
            }}
          />
        )}
      </AnimatePresence>

      {/* Migration Status Banner */}
      <AnimatePresence>
        {migrationStatus && migrationStatus.migrated > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#060000] border border-red-900/50 px-5 py-2 text-red-500 text-[10px] font-mono uppercase tracking-widest shadow-[0_0_20px_rgba(200,0,0,0.15)] flex items-center gap-3"
          >
            Migrated {migrationStatus.migrated} session{migrationStatus.migrated > 1 ? 's' : ''} to IndexedDB
            <button onClick={() => setMigrationStatus(null)} className="text-red-800 hover:text-red-500 transition-colors">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

