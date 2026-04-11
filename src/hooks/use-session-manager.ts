// Hook for session management
import { useState, useCallback, useEffect } from 'react';
import { Message } from '@/lib/swarm/types';

export interface SessionInfo {
  id: string;
  name: string;
  updatedAt: number;
  messageCount: number;
}

export interface SessionData {
  id: string;
  name: string;
  agentMemories: Record<string, Message[]>;
  activeAgentName: string;
  contextVariables: Record<string, any>;
  selectedModel: string;
  enabledAgents: Record<string, boolean>;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

export function useSessionManager() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) {
        console.warn('Sessions API returned', res.status);
        setSessions([]);
        return;
      }
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (error: any) {
      // Silently fail -- sessions are optional for UX
      setSessions([]);
    }
  }, []);

  const createSession = useCallback(async (name?: string) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      await fetchSessions();
      return data.sessionId;
    } catch (error: any) {
      console.error('Failed to create session:', error);
      return null;
    }
  }, [fetchSessions]);

  const loadSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Failed to load session');
      const data = await res.json();
      setActiveSession(data.session);
      return data.session;
    } catch (error: any) {
      console.error('Failed to load session:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete session');
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
      }
      await fetchSessions();
    } catch (error: any) {
      console.error('Failed to delete session:', error);
    }
  }, [activeSession, fetchSessions]);

  const saveSessionState = useCallback(async (
    sessionId: string,
    updates: {
      agentMemories?: Record<string, Message[]>;
      activeAgentName?: string;
      selectedModel?: string;
    }
  ) => {
    // Use the session update endpoint via the main chat API
    // This is a lightweight update that just saves state without running swarm
    try {
      await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, ...updates }),
      });
    } catch (error: any) {
      console.error('Failed to save session state:', error);
    }
  }, []);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    activeSession,
    loading,
    fetchSessions,
    createSession,
    loadSession,
    deleteSession,
    saveSessionState,
  };
}
