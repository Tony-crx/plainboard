"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Activity, ShieldAlert, Code2, Calculator, MessageSquare, Flame, Database, Settings2, Network, UserCog, BookOpen, Key, ChevronDown, Plus, Trash2, Download, ClipboardList, ScrollText, Terminal, Zap, Trophy, Clock } from 'lucide-react';
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
import { NeuralTopology3D, AgentNode3D, Connection3D } from '@/components/ui/neural-topology-3d';
import { NeuralTopology2D, AgentNode2D, Connection2D } from '@/components/ui/neural-topology-2d';
import { ActivityFeed, ActivityEntry } from '@/components/ui/activity-feed';
import { MemoryBrowser } from '@/components/ui/memory-browser';
import { useCostTracking } from '@/lib/utils/cost-tracker';
import { validateInput } from '@/lib/security/input-validator';
import { CommandPalette, useKeyboardShortcuts } from '@/components/ui/command-palette';
import { TraceViewer } from '@/components/ui/trace-viewer';
import { AgentCreator } from '@/components/ui/agent-creator';
import { WarRoomVisualization } from '@/components/ui/war-room-visual';
import { useMemoryCompression } from '@/lib/utils/memory-compression';
import { TaskPanel } from '@/components/ui/task-panel';
import { SessionSelector } from '@/components/ui/session-selector';
import { ExportButton } from '@/components/ui/export-button';
import { SkillBrowser } from '@/components/ui/skill-browser';
import { PlanModeUI } from '@/components/ui/plan-mode-ui';
import { PlanModeBadge } from '@/components/ui/plan-mode-badge';
import { useTaskManager, useSessionManager } from '@/hooks';
import { globalMessageBus } from '@/lib/communication/message-bus';
import { globalTaskStore } from '@/lib/tasks/task-store';
import { globalSkillRegistry } from '@/lib/skills/skill-registry';
import { globalPlanModeManager } from '@/lib/permissions/plan-mode';
import { WorkerLogPanel } from '@/components/ui/worker-log-panel';
import { AuditLogDashboard } from '@/components/ui/audit-log-dashboard';
import { MessageThreadTimeline } from '@/components/ui/message-thread-timeline';
import { SessionReplayViewer } from '@/components/ui/session-replay-viewer';
import { AgentLeaderboard } from '@/components/ui/agent-leaderboard';
import { CronManager } from '@/components/ui/cron-manager';
import { QuickCommands } from '@/components/ui/quick-commands';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { PIIWarning } from '@/components/ui/pii-warning';
import { globalWorkerLogStore } from '@/lib/communication/worker-live-logs';
import { globalSmartRouter } from '@/lib/swarm/smart-router';
import { globalMemoryOptimizer } from '@/lib/memory/memory-optimizer';
import { globalHealthMonitor } from '@/lib/observability/health-check';
import { globalRateLimiter } from '@/lib/queue/rate-limiter';
import { globalCronScheduler } from '@/lib/queue/cron-scheduler';
import { promptTemplates, searchTemplates, PromptTemplate } from '@/lib/utils/prompt-templates';
import { parseNaturalLanguage, NLCommandResult } from '@/lib/utils/natural-commands';
import { multiTabSync } from '@/lib/communication/multi-tab-sync';
import { sessionReplayRecorder } from '@/lib/observability/session-replay';

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

  // Activity feed
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [isActivityFeedOpen, setIsActivityFeedOpen] = useState(false);
  const [isMemoryBrowserOpen, setIsMemoryBrowserOpen] = useState(false);

  // New features state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTraceViewerOpen, setIsTraceViewerOpen] = useState(false);
  const [isAgentCreatorOpen, setIsAgentCreatorOpen] = useState(false);
  const [showWarRoomVisual, setShowWarRoomVisual] = useState(false);
  const [topologyMode, setTopologyMode] = useState<'3d' | '2d'>('3d');

  // Custom agents
  const [customAgents, setCustomAgents] = useState<Array<{ name: string; instructions: string; model: string; tools: string[]; temperature: number; maxTokens: number }>>([]);

  // Memory compression
  const { stats: memoryStats, compress, summarize } = useMemoryCompression(agentMemories, 100);

  // Trace spans for debugging
  const [traceSpans, setTraceSpans] = useState<any[]>([]);

  // Cost tracking
  const { totalCost, todayCost } = useCostTracking(agentMemories);

  // Task manager (workers, notifications, progress)
  const taskManager = useTaskManager({ pollInterval: 3000 });
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);

  // Session manager (persistence, restore)
  const sessionManager = useSessionManager();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Dead component state
  const [isExportButtonVisible, setIsExportButtonVisible] = useState(true);

  // Skill system
  const [isSkillBrowserOpen, setIsSkillBrowserOpen] = useState(false);

  // Plan mode
  const [planModeState, setPlanModeState] = useState(globalPlanModeManager.getState());
  const [isPlanModeUIOpen, setIsPlanModeUIOpen] = useState(false);

  // New Phase 2-6 features
  const [isWorkerLogOpen, setIsWorkerLogOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [activeTabCount, setActiveTabCount] = useState(1);

  // Phase 7+ new features
  const [isSessionReplayOpen, setIsSessionReplayOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isCronManagerOpen, setIsCronManagerOpen] = useState(false);
  const [isThemeToggleVisible, setIsThemeToggleVisible] = useState(true);

  // Prompt templates
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Poll plan mode state + tab count
  useEffect(() => {
    const interval = setInterval(() => {
      setPlanModeState(globalPlanModeManager.getState());
      setActiveTabCount(multiTabSync.getTabCount());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const addActivity = useCallback((entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
    setActivityEntries(prev => [...prev, {
      ...entry,
      id: `activity_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: Date.now()
    }].slice(-200)); // Keep last 200 entries
  }, []);

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
        updated.forEach(async (s) => {
          try { await indexedDB.saveSession(s as unknown as Record<string, unknown>); } catch (e) { /* ignore */ }
        });
      }
      return updated;
    });
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
      s.id === sessionId ? { ...s, agentMemories, selectedModel } : s
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
    const updatedSessions = sessions.map(s => s.id === sessionIdToRename ? renamedSession : s);
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
    const updatedSessions = sessions.map(s => s.id === sessionIdToToggle ? toggledSession : s);
    setSessions(updatedSessions);
    try { await indexedDB.saveSession(toggledSession as unknown as Record<string, unknown>); } catch (e) { /* ignore */ }
  };

  // Delete session with confirmation
  const deleteSessionWithConfirmation = async (sessionToDelete: string) => {
    if (deleteConfirmId === sessionToDelete) {
      await deleteSession(sessionToDelete);
      setDeleteConfirmId(null);
    } else {
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

  // --- New Component Handlers ---

  // Session management via new session manager
  const handleSelectSession = useCallback(async (sessionId: string) => {
    const session = await sessionManager.loadSession(sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setAgentMemories(session.agentMemories);
      setViewingAgent(session.activeAgentName || 'Coordinator');
      setActiveRoutingAgent(session.activeAgentName || 'Coordinator');
      setSelectedModel(session.selectedModel || selectedModel);
    }
  }, [sessionManager]);

  const handleCreateSession = useCallback(async (name?: string) => {
    const id = await sessionManager.createSession(name);
    if (id) {
      setActiveSessionId(id);
      // Reset memories
      setAgentMemories({ "Coordinator": [], "Triage": [], "Coder": [], "Math": [], "Cyn": [], "Adso": [] });
      setViewingAgent('Coordinator');
      setActiveRoutingAgent('Coordinator');
    }
    return id;
  }, [sessionManager]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await sessionManager.deleteSession(sessionId);
    if (activeSessionId === sessionId) setActiveSessionId(null);
  }, [sessionManager, activeSessionId]);

  // Export handler
  const handleExportMemories = useCallback(() => {
    // ExportButton component handles this internally
  }, []);

  // Skill execution
  const handleExecuteSkill = useCallback(async (skillName: string, args?: Record<string, string>) => {
    const result = await globalSkillRegistry.execute(skillName, args);
    addActivity({
      type: result.success ? 'success' : 'error',
      agent: 'Skill',
      message: result.success ? `Executed skill: ${skillName}` : `Skill failed: ${skillName}`,
      metadata: { skill: skillName, outputLength: result.output.length }
    });
    // Inject skill output into current agent's memory
    if (result.success && result.messages.length > 0) {
      const updatedMemories = { ...agentMemories };
      if (!updatedMemories[viewingAgent]) updatedMemories[viewingAgent] = [];
      updatedMemories[viewingAgent].push(...result.messages as any);
      setAgentMemories(updatedMemories);
    }
  }, [agentMemories, viewingAgent, addActivity]);

  // Plan mode handlers
  const handleEnterPlanMode = useCallback(() => {
    const state = globalPlanModeManager.enter('default');
    setPlanModeState(state);
    setIsPlanModeUIOpen(true);
    addActivity({
      type: 'info',
      agent: 'System',
      message: 'Plan mode activated',
      metadata: {}
    });
  }, [addActivity]);

  const handleUpdatePlan = useCallback((content: string) => {
    globalPlanModeManager.updatePlan(content);
    setPlanModeState(globalPlanModeManager.getState());
  }, []);

  const handleApprovePlan = useCallback(() => {
    const result = globalPlanModeManager.approveAndExit();
    setPlanModeState(globalPlanModeManager.getState());
    setIsPlanModeUIOpen(false);
    addActivity({
      type: 'success',
      agent: 'System',
      message: `Plan approved and implemented. Returned to ${result.previousMode} mode.`,
      metadata: {}
    });
  }, [addActivity]);

  const handleCancelPlan = useCallback(() => {
    globalPlanModeManager.cancel();
    setPlanModeState(globalPlanModeManager.getState());
    setIsPlanModeUIOpen(false);
    addActivity({
      type: 'warning',
      agent: 'System',
      message: 'Plan cancelled',
      metadata: {}
    });
  }, [addActivity]);

  // Natural Language Command Handler
  const handleNaturalCommand = useCallback((result: NLCommandResult) => {
    switch (result.target) {
      case 'taskPanel': setIsTaskPanelOpen(true); break;
      case 'skillBrowser': setIsSkillBrowserOpen(true); break;
      case 'workerLogs': setIsWorkerLogOpen(true); break;
      case 'timeline': setIsTimelineOpen(true); break;
      case 'auditLog': setIsAuditLogOpen(true); break;
      case 'activityFeed': setIsActivityFeedOpen(true); break;
      case 'memoryBrowser': setIsMemoryBrowserOpen(true); break;
      case 'planMode': setIsPlanModeUIOpen(true); break;
      case 'newSession': createNewSession(); break;
      case 'clearSession':
        setAgentMemories({ "Coordinator": [], "Triage": [], "Coder": [], "Math": [], "Cyn": [], "Adso": [] });
        break;
      case 'stopTask':
        if (result.payload?.taskId) taskManager.stopTask(result.payload.taskId as string);
        break;
      default:
        if (result.responseMessage) {
          addActivity({ type: 'info', agent: 'Command', message: result.responseMessage, metadata: {} });
        }
    }
  }, [addActivity, taskManager]);

  // Start cron scheduler on mount
  useEffect(() => {
    globalCronScheduler.start();
    return () => globalCronScheduler.stop();
  }, []);

  // Session Timeout -- auto-logout after 30 minutes of inactivity
  useEffect(() => {
    const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    let timeout: ReturnType<typeof setTimeout>;

    const resetTimeout = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isAuthenticated) {
          setIsAuthenticated(false);
          addActivity({
            type: 'warning',
            agent: 'System',
            message: 'Session timed out due to inactivity',
            metadata: { timeout: TIMEOUT_MS }
          });
        }
      }, TIMEOUT_MS);
    };

    // Reset on any user interaction
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimeout));
    resetTimeout();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimeout));
      if (timeout) clearTimeout(timeout);
    };
  }, [isAuthenticated, addActivity]);

  // Auto-save session persistence

  // Generate a unique message ID
  const generateMessageId = (agentName: string, index: number): string => {
    return `${agentName}_${index}`;
  };

  // Edit a user message
  const editMessage = (agentName: string, messageId: string, newContent: string) => {
    if (!newContent.trim()) return;
    const updatedMemories = { ...agentMemories };
    const messages = [...(updatedMemories[agentName] || [])];
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
    const currentSession = sessions.find(s => s.id === sessionId);
    if (currentSession) {
      const updatedBookmarks = currentSession.bookmarkedMessageIds.filter(id => id !== messageId);
      const updatedSession = { ...currentSession, bookmarkedMessageIds: updatedBookmarks };
      const updatedSessions = sessions.map(s => s.id === sessionId ? updatedSession : s);
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
    const updatedSessions = sessions.map(s => s.id === sessionId ? updatedSession : s);
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
    await new Promise(r => setTimeout(r, 50));
    const prevInputMessage = lastUserMessage;
    setLastUserMessage(null);
    setLastErrorAgent(null);
    setRetryingMessage(null);
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
    const updatedSessions = sessions.map(s => s.id === sessionIdToArchive ? archivedSession : s);
    setSessions(updatedSessions);
    try { await indexedDB.saveSession(archivedSession as unknown as Record<string, unknown>); } catch (e) { /* ignore */ }
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
    const updatedSessions = sessions.map(s => s.id === sessionIdToUnarchive ? unarchivedSession : s);
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
        loadSession(importedSession);
      } catch (err) {
        alert('Failed to import session: Invalid JSON file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // NOW useEffect hooks AFTER all function declarations
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMemories, viewingAgent, isLoading, isWarRoomMode]);

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

    // Input validation
    const validation = validateInput(inputMessage);
    if (!validation.isValid) {
      addActivity({
        type: 'error',
        agent: 'System',
        message: `Input validation failed: ${validation.errors.join(', ')}`,
        metadata: { riskLevel: validation.riskLevel }
      });
      return;
    }

    // Sanitize input
    const sanitizedInput = validation.sanitized || inputMessage;

    addActivity({
      type: 'info',
      agent: 'User',
      message: `Message sent to ${viewingAgent}`,
      metadata: { length: sanitizedInput.length }
    });

    const activeAgentsNames = Object.keys(enabledAgents).filter(k => enabledAgents[k]);
    const userMessage: Message = { role: 'user', content: sanitizedInput };
    const messageText = sanitizedInput;

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

                  // Log activity
                  addActivity({
                    type: 'success',
                    agent: targetAgent,
                    message: `Response generated (${finalContent.length} chars)`,
                    metadata: { tokens: Math.round(finalContent.length / 4) }
                  });
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

        // Log error activity
        addActivity({
          type: 'error',
          agent: targetAgent,
          message: `Error: ${err.message}`,
          metadata: { context: 'Chat' }
        });
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
      setStreamingContent('');
      // Auto-save session persistence
      if (activeSessionId) {
        sessionManager.saveSessionState(activeSessionId, {
          agentMemories,
          activeAgentName: viewingAgent,
          selectedModel,
        });
      }
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

  // Prepare 3D topology data
  const topologyAgents = useMemo(() => {
    const agentConfigs = [
      { id: 'Coordinator', position: [0, 1.5, 0] as [number, number, number] },
      { id: 'Triage', position: [-2, 0, 0] as [number, number, number] },
      { id: 'Coder', position: [2, 0, 0] as [number, number, number] },
      { id: 'Math', position: [-1.5, -1.5, 1] as [number, number, number] },
      { id: 'Cyn', position: [1.5, -1.5, 1] as [number, number, number] },
      { id: 'Adso', position: [0, -2, -1] as [number, number, number] },
    ];

    return agentConfigs.map((config) => {
      const profile = ALL_PROFILES.find(p => p.name === config.id);
      const isActiveEngine = activeRoutingAgent === config.id;
      const msgCount = (agentMemories[config.id] || []).length;
      const displayName = agentOverrides[config.id]?.name || config.id;

      let status: AgentStatus = 'idle';
      if (isActiveEngine && isLoading) {
        status = 'thinking';
      }

      return {
        id: config.id,
        name: config.id,
        displayName,
        icon: profile?.icon || Network,
        status,
        position: config.position,
        messageCount: msgCount,
      } as AgentNode3D;
    });
  }, [activeRoutingAgent, isLoading, agentMemories, agentOverrides]);

  const topologyConnections = useMemo(() => {
    const conns: Connection3D[] = [
      { from: 'Coordinator', to: 'Triage', active: activeRoutingAgent === 'Coordinator' || activeRoutingAgent === 'Triage' },
      { from: 'Coordinator', to: 'Coder', active: activeRoutingAgent === 'Coordinator' || activeRoutingAgent === 'Coder' },
      { from: 'Coordinator', to: 'Math', active: activeRoutingAgent === 'Coordinator' || activeRoutingAgent === 'Math' },
      { from: 'Coordinator', to: 'Cyn', active: activeRoutingAgent === 'Coordinator' || activeRoutingAgent === 'Cyn' },
      { from: 'Coordinator', to: 'Adso', active: activeRoutingAgent === 'Coordinator' || activeRoutingAgent === 'Adso' },
      { from: 'Triage', to: 'Coder', active: false },
      { from: 'Triage', to: 'Math', active: false },
      { from: 'Triage', to: 'Cyn', active: false },
    ];
    return conns;
  }, [activeRoutingAgent]);

  // 2D Topology data (must be at top level, before any conditional returns)
  const topology2DAgents = useMemo(() => {
    // Hexagonal grid layout with proper spacing
    const defaultAgentConfigs = [
      { id: 'Coordinator', position: { x: 50, y: 20 } },  // Center top
      { id: 'Triage', position: { x: 25, y: 40 } },       // Left middle
      { id: 'Coder', position: { x: 75, y: 40 } },        // Right middle
      { id: 'Math', position: { x: 25, y: 70 } },         // Left bottom
      { id: 'Cyn', position: { x: 75, y: 70 } },          // Right bottom
      { id: 'Adso', position: { x: 50, y: 85 } },         // Center bottom
    ];

    const defaultAgents = defaultAgentConfigs.map((config) => {
      const profile = ALL_PROFILES.find(p => p.name === config.id);
      const isActiveEngine = activeRoutingAgent === config.id;
      const msgCount = (agentMemories[config.id] || []).length;
      const displayName = agentOverrides[config.id]?.name || config.id;

      let status: AgentStatus = 'idle';
      if (isActiveEngine && isLoading) {
        status = 'thinking';
      }

      return {
        id: config.id,
        name: config.id,
        displayName,
        icon: profile?.icon || Network,
        status: status as 'idle' | 'thinking' | 'executing' | 'handoff' | 'error',
        x: config.position.x,
        y: config.position.y,
        messageCount: msgCount,
      } as AgentNode2D;
    });

    // Custom agents positioned below in a row with proper spacing
    const customAgentNodes = customAgents.map((agent, idx) => ({
      id: agent.name,
      name: agent.name,
      displayName: agent.name,
      icon: Network,
      status: 'idle' as const,
      x: 20 + (idx * 25),  // Better spacing: 20%, 45%, 70%, etc.
      y: 95,
      messageCount: (agentMemories[agent.name] || []).length,
      custom: true,
    })) as AgentNode2D[];

    return [...defaultAgents, ...customAgentNodes] as AgentNode2D[];
  }, [activeRoutingAgent, isLoading, agentMemories, agentOverrides, customAgents]);

  const topology2DConnections = useMemo(() => {
    const conns: Connection2D[] = [
      { from: 'Coordinator', to: 'Triage', active: activeRoutingAgent === 'Coordinator' || activeRoutingAgent === 'Triage' },
      { from: 'Coordinator', to: 'Coder', active: activeRoutingAgent === 'Coordinator' || activeRoutingAgent === 'Coder' },
      { from: 'Coordinator', to: 'Math', active: activeRoutingAgent === 'Coordinator' || activeRoutingAgent === 'Math' },
      { from: 'Coordinator', to: 'Cyn', active: activeRoutingAgent === 'Coordinator' || activeRoutingAgent === 'Cyn' },
      { from: 'Coordinator', to: 'Adso', active: activeRoutingAgent === 'Coordinator' || activeRoutingAgent === 'Adso' },
      { from: 'Triage', to: 'Coder', active: false },
      { from: 'Triage', to: 'Math', active: false },
      { from: 'Triage', to: 'Cyn', active: false },
    ];

    customAgents.forEach(agent => {
      conns.push({
        from: 'Coordinator',
        to: agent.name,
        active: activeRoutingAgent === agent.name
      });
    });

    return conns;
  }, [activeRoutingAgent, customAgents]);

  // Keyboard shortcuts (after all function declarations)
  const shortcuts = useMemo(() => [
    { key: 'k', modifiers: ['Cmd'], action: () => setIsCommandPaletteOpen(true), description: 'Open Command Palette', category: 'system' as const },
    { key: 'n', modifiers: ['Cmd'], action: () => createNewSession(), description: 'New Session', category: 'sessions' as const },
    { key: 'w', modifiers: ['Cmd'], action: () => setIsWarRoomMode(!isWarRoomMode), description: 'Toggle War Room', category: 'tools' as const },
    { key: 'f', modifiers: ['Cmd'], action: () => setIsActivityFeedOpen(true), description: 'Open Activity Feed', category: 'tools' as const },
    { key: 'm', modifiers: ['Cmd'], action: () => setIsMemoryBrowserOpen(true), description: 'Open Memory Browser', category: 'tools' as const },
    { key: 'c', modifiers: ['Cmd', 'Shift'], action: () => setIsAgentCreatorOpen(true), description: 'Create Agent', category: 'agents' as const },
    { key: 't', modifiers: ['Cmd'], action: () => setIsTelemetryOpen(true), description: 'Open Telemetry', category: 'tools' as const },
  ], [isWarRoomMode]);

  useKeyboardShortcuts(shortcuts);

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
    <div className="grid grid-cols-[35%_65%] grid-rows-[55%_45%] h-screen bg-[#000000] overflow-hidden text-gray-300 relative p-4 gap-4" style={{ fontFamily: 'var(--font-display)' }}>
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
          PANEL 2: 3D NEURAL TOPOLOGY -> Top Right
      ═══════════════════════════════════════════════════════════════ */}
      <div className="col-start-2 col-end-3 row-start-1 row-end-2 w-full h-full flex flex-col z-10 border border-red-900/50 bg-[#080000] relative clip-angled custom-panel-glow">
        <div className="px-6 py-4 border-b border-red-900/30 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <div className="pulse-dot" />
            <div className="section-label tracking-[0.4em] text-red-500">
              {topologyMode === '3d' ? 'Neural Topology 3D' : 'Neural Topology 2D'}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTopologyMode(topologyMode === '3d' ? '2d' : '3d')}
              className="p-1 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors text-[9px] font-mono uppercase"
              title={`Switch to ${topologyMode === '3d' ? '2D' : '3D'} mode`}
            >
              {topologyMode === '3d' ? '2D' : '3D'}
            </button>
            <button onClick={() => setIsConfigOpen(true)} className="p-1 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors"><Settings2 size={12} /></button>
            <button onClick={() => setIsMcpOpen(true)} className="p-1 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors"><Database size={12} /></button>
            <button onClick={() => setIsApiSettingsOpen(true)} className="p-1 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors"><Key size={12} /></button>
          </div>
        </div>

        {/* Neural Network Visualization */}
        <div className="flex-1 relative">
          {topologyMode === '3d' ? (
            <NeuralTopology3D
              agents={topologyAgents}
              connections={topologyConnections}
              onAgentClick={(agentId) => {
                setViewingAgent(agentId);
              }}
            />
          ) : (
            <NeuralTopology2D
              agents={topology2DAgents}
              connections={topology2DConnections}
              onAgentClick={(agentId) => {
                setViewingAgent(agentId);
              }}
            />
          )}

          {/* Overlay legend (only for 3D mode, 2D has built-in legend) */}
          {topologyMode === '3d' && (
            <div className="absolute top-4 left-4 glass-panel-strong p-3 space-y-2">
              <div className="text-[9px] text-red-500 font-mono uppercase tracking-widest mb-2">Legend</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-600" />
                <span className="text-[9px] text-gray-400 font-mono">Idle</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-[9px] text-gray-400 font-mono">Thinking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-[9px] text-gray-400 font-mono">Executing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-[9px] text-gray-400 font-mono">Routing</span>
              </div>
            </div>
          )}
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
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="section-label tracking-[0.3em]">Telemetry</div>
              <button
                onClick={() => setIsModelSelectorOpen(true)}
                className="px-3 py-1 border border-red-900/50 text-[#c4c4c4] text-[10px] font-mono hover:bg-[#ff1a1a]/10 hover:border-[#ff1a1a] transition-all truncate max-w-[200px]"
              >
                {selectedModel}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border border-red-900/20 bg-black/40 p-3 clip-bottom-right">
                <span className="text-[9px] text-red-600/70 uppercase block mb-1 font-bold">Context Limit</span>
                <div className="text-lg font-mono text-gray-200">
                  <span className={contextTokenCount > 100000 ? "text-red-500" : "text-[#c4c4c4]"}>{(contextTokenCount / 1000).toFixed(1)}k</span> <span className="text-red-900">/ 128k</span>
                </div>
              </div>
              <div className="border border-red-900/20 bg-black/40 p-3 clip-bottom-right">
                <span className="text-[9px] text-red-600/70 uppercase block mb-1 font-bold">Engine State</span>
                <div className={`text-lg font-mono ${isLoading ? "text-[#ff1a1a] animate-pulse glow-text-sm" : "text-gray-400"}`}>
                  {isLoading ? "PROCESSING" : "IDLE"}
                </div>
              </div>
            </div>
          </div>

          {/* Cost display */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-red-900/20 bg-black/40 p-2 clip-bottom-right">
              <span className="text-[8px] text-red-600/70 uppercase block mb-1 font-bold">Today's Cost</span>
              <div className="text-sm font-mono text-green-400">${todayCost.toFixed(4)}</div>
            </div>
            <div className="border border-red-900/20 bg-black/40 p-2 clip-bottom-right">
              <span className="text-[8px] text-red-600/70 uppercase block mb-1 font-bold">Total Cost</span>
              <div className="text-sm font-mono text-orange-400">${totalCost.toFixed(4)}</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setIsWarRoomMode(!isWarRoomMode)}
              className={`flex-1 py-2 text-[10px] uppercase font-black tracking-widest clip-angled transition-all border ${isWarRoomMode ? 'bg-[#ff1a1a]/20 border-[#ff1a1a] text-[#ff1a1a] shadow-[0_0_15px_rgba(255,0,0,0.3)]' : 'bg-black/50 border-red-900/40 text-red-500 hover:border-red-600'
                }`}
            >
              War Room
            </button>
            {isWarRoomMode && (
              <button
                onClick={() => setShowWarRoomVisual(!showWarRoomVisual)}
                className="px-3 py-2 bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors clip-angled font-black tracking-widest text-[10px] uppercase"
              >
                Visual
              </button>
            )}
            {/* Task Manager button */}
            <button
              onClick={() => setIsTaskPanelOpen(!isTaskPanelOpen)}
              className="relative px-3 py-2 bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors clip-angled font-black tracking-widest text-[10px] uppercase flex items-center gap-1"
            >
              <Activity size={12} />
              Tasks
              {taskManager.activeTasks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                  {taskManager.activeTasks.length}
                </span>
              )}
            </button>
            {/* Skills button */}
            <button
              onClick={() => setIsSkillBrowserOpen(!isSkillBrowserOpen)}
              className="px-3 py-2 bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors clip-angled font-black tracking-widest text-[10px] uppercase flex items-center gap-1"
            >
              <ScrollText size={12} />
              Skills
            </button>
            {/* Worker Logs */}
            <button
              onClick={() => setIsWorkerLogOpen(!isWorkerLogOpen)}
              className="px-3 py-2 bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors clip-angled font-black tracking-widest text-[10px] uppercase flex items-center gap-1"
            >
              <Terminal size={12} />
              Logs
            </button>
            {/* Message Timeline */}
            <button
              onClick={() => setIsTimelineOpen(!isTimelineOpen)}
              className="px-3 py-2 bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors clip-angled font-black tracking-widest text-[10px] uppercase flex items-center gap-1"
            >
              <MessageSquare size={12} />
              Timeline
            </button>
            {/* Audit Log */}
            <button
              onClick={() => setIsAuditLogOpen(!isAuditLogOpen)}
              className="px-3 py-2 bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors clip-angled font-black tracking-widest text-[10px] uppercase flex items-center gap-1"
            >
              <ShieldAlert size={12} />
              Audit
            </button>
            <button
              onClick={() => setIsActivityFeedOpen(true)}
              className="px-3 py-2 bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors clip-angled font-black tracking-widest text-[10px] uppercase flex items-center gap-1"
            >
              <Activity size={12} />
              Feed
            </button>
            <button
              onClick={() => setIsMemoryBrowserOpen(true)}
              className="px-3 py-2 bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors clip-angled font-black tracking-widest text-[10px] uppercase flex items-center gap-1"
            >
              <Database size={12} />
              Memory
            </button>
            <button
              onClick={() => setIsAgentCreatorOpen(true)}
              className="px-3 py-2 bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors clip-angled font-black tracking-widest text-[10px] uppercase flex items-center gap-1"
            >
              <Plus size={12} />
              Agent
            </button>
            {/* Session Replay */}
            <button
              onClick={() => { sessionReplayRecorder.stopRecording(); setIsSessionReplayOpen(true); }}
              className="px-3 py-2 bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors clip-angled font-black tracking-widest text-[10px] uppercase flex items-center gap-1"
            >
              <Zap size={12} />
              Replay
            </button>
            {/* Agent Leaderboard */}
            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="px-3 py-2 bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors clip-angled font-black tracking-widest text-[10px] uppercase flex items-center gap-1"
            >
              <Trophy size={12} />
              Rank
            </button>
            {/* Cron Scheduler */}
            <button
              onClick={() => setIsCronManagerOpen(!isCronManagerOpen)}
              className="px-3 py-2 bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors clip-angled font-black tracking-widest text-[10px] uppercase flex items-center gap-1"
            >
              <Clock size={12} />
              Cron
            </button>
            {/* Theme Toggle */}
            {isThemeToggleVisible && <ThemeToggle />}
          </div>

          {/* NEW: Plan Mode badge */}
          <div className="flex gap-2 items-center">
            <PlanModeBadge
              planState={planModeState}
              onClick={() => setIsPlanModeUIOpen(true)}
              onToggle={handleEnterPlanMode}
            />
            <SessionSelector
              sessions={sessionManager.sessions}
              activeSessionId={activeSessionId}
              loading={sessionManager.loading}
              onSelectSession={handleSelectSession}
              onCreateSession={handleCreateSession}
              onDeleteSession={handleDeleteSession}
            />
          </div>

          <button
            onClick={() => exportConversationToMarkdown({ session: sessions.find(s => s.id === sessionId)!, includeMetadata: true, includeTimestamps: true })}
            className="w-full py-2 bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors clip-angled font-black tracking-widest text-[10px] uppercase"
          >
            Export Arch
          </button>
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

      {/* Activity Feed Modal */}
      <AnimatePresence>
        {isActivityFeedOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsActivityFeedOpen(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-[350px] bg-[#050000] border-l border-red-900/50"
              onClick={e => e.stopPropagation()}
            >
              <ActivityFeed
                entries={activityEntries}
                onClear={() => setActivityEntries([])}
                isOpen={true}
                onClose={() => setIsActivityFeedOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory Browser Modal */}
      <AnimatePresence>
        {isMemoryBrowserOpen && (
          <MemoryBrowser
            agentMemories={agentMemories}
            onClear={(agent) => {
              setAgentMemories(prev => ({ ...prev, [agent]: [] }));
            }}
            onClearAll={() => {
              const cleared = Object.keys(agentMemories).reduce((acc, agent) => {
                acc[agent] = [];
                return acc;
              }, {} as Record<string, any[]>);
              setAgentMemories(cleared);
            }}
            isOpen={isMemoryBrowserOpen}
            onClose={() => setIsMemoryBrowserOpen(false)}
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

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        shortcuts={shortcuts}
      />

      {/* Agent Creator */}
      <AgentCreator
        isOpen={isAgentCreatorOpen}
        onClose={() => setIsAgentCreatorOpen(false)}
        onSave={(agent) => {
          setCustomAgents(prev => [...prev, agent]);
          addActivity({
            type: 'success',
            agent: 'System',
            message: `Created custom agent: ${agent.name}`,
            metadata: { tools: agent.tools, model: agent.model }
          });
        }}
        existingAgents={[...ALL_PROFILES.map(p => p.name), ...customAgents.map(a => a.name)]}
      />

      {/* Trace Viewer */}
      <TraceViewer
        spans={traceSpans}
        isOpen={isTraceViewerOpen}
        onClose={() => setIsTraceViewerOpen(false)}
      />

      {/* Task Panel - Real-time worker management */}
      <TaskPanel
        isOpen={isTaskPanelOpen}
        onClose={() => setIsTaskPanelOpen(false)}
        tasks={taskManager.tasks}
        activeTasks={taskManager.activeTasks}
        loading={taskManager.loading}
        onStopTask={taskManager.stopTask}
        onMessageWorker={taskManager.messageWorker}
        onGetTaskOutput={taskManager.getTaskOutput}
      />

      {/* Skill Browser */}
      <SkillBrowser
        onExecute={handleExecuteSkill}
        isOpen={isSkillBrowserOpen}
        onClose={() => setIsSkillBrowserOpen(false)}
      />

      {/* Plan Mode UI */}
      <PlanModeUI
        planState={planModeState}
        onUpdatePlan={handleUpdatePlan}
        onApprove={handleApprovePlan}
        onCancel={handleCancelPlan}
        isOpen={isPlanModeUIOpen}
        onClose={() => setIsPlanModeUIOpen(false)}
      />

      {/* Worker Log Panel */}
      <WorkerLogPanel
        isOpen={isWorkerLogOpen}
        onClose={() => setIsWorkerLogOpen(false)}
      />

      {/* Message Thread Timeline */}
      <MessageThreadTimeline
        messages={(agentMemories[viewingAgent] || [])}
        agentName={viewingAgent}
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
      />

      {/* Audit Log Dashboard */}
      <AuditLogDashboard
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
      />

      {/* Session Replay Viewer */}
      <SessionReplayViewer
        isOpen={isSessionReplayOpen}
        onClose={() => setIsSessionReplayOpen(false)}
      />

      {/* Agent Leaderboard */}
      <AgentLeaderboard
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* Cron Manager */}
      <CronManager
        isOpen={isCronManagerOpen}
        onClose={() => setIsCronManagerOpen(false)}
      />

      {/* War Room Visualization Toggle */}
      {
        isWarRoomMode && showWarRoomVisual && (
          <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowWarRoomVisual(false)}>
            <div className="w-full max-w-4xl h-[600px] bg-[#050000] border border-red-900/50 rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
              <WarRoomVisualization
                activeAgents={Object.keys(enabledAgents).filter(k => enabledAgents[k])}
                isRunning={isLoading}
                currentSpeaker={activeRoutingAgent}
              />
            </div>
          </div>
        )
      }
    </div >
  );
}

