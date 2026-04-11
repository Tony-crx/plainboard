// Hook for SSE streaming chat with full swarm support
import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, TaskNotification } from '@/lib/swarm/types';

export interface StreamEvent {
  type: 'turn' | 'token' | 'tool_calls' | 'tool_start' | 'tool_result' | 'handoff' |
  'worker_launched' | 'worker_completed' | 'done' | 'error';
  turn?: number;
  agent?: string;
  token?: string;
  toolCalls?: any[];
  toolCallId?: string;
  toolName?: string;
  args?: any;
  content?: string;
  error?: boolean;
  from?: string;
  to?: string;
  message?: string;
  taskId?: string;
  agentName?: string;
  runInBackground?: boolean;
  result?: string;
  agentMemories?: Record<string, Message[]>;
  newAgentName?: string;
  variables?: Record<string, any>;
}

interface UseSwarmStreamOptions {
  enabledAgents: Record<string, boolean>;
  agentOverrides: Record<string, { name?: string; instructions?: string; model?: string }>;
  apiKeys: string[];
  sessionId?: string | null;
  onDone?: (memories: Record<string, Message[]>, newAgentName: string) => void;
  onError?: (error: string) => void;
}

export function useSwarmStream(
  activeAgentName: string,
  selectedModel: string,
  agentMemories: Record<string, Message[]>,
  options: UseSwarmStreamOptions
) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [streamingAgent, setStreamingAgent] = useState(activeAgentName);
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (isStreaming) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);
    setStreamContent('');
    setStreamEvents([]);
    setCurrentTurn(0);

    // Add user message to memory
    const updatedMemories = { ...agentMemories };
    if (!updatedMemories[activeAgentName]) {
      updatedMemories[activeAgentName] = [];
    }
    updatedMemories[activeAgentName].push({
      role: 'user',
      content: userMessage,
    });

    try {
      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentMemories: updatedMemories,
          activeAgentName,
          selectedModel,
          enabledAgents: options.enabledAgents,
          agentOverrides: options.agentOverrides,
          apiKeys: options.apiKeys,
          sessionId: options.sessionId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const event: StreamEvent = JSON.parse(line.slice(6));
            setStreamEvents(prev => [...prev, event]);

            switch (event.type) {
              case 'turn':
                setCurrentTurn(event.turn || 0);
                setStreamingAgent(event.agent || activeAgentName);
                setStreamContent('');
                break;

              case 'token':
                setStreamContent(prev => prev + (event.token || ''));
                if (event.agent) setStreamingAgent(event.agent);
                break;

              case 'tool_start':
                setStreamContent(prev => prev + `\n[_Running: ${event.toolName}...]`);
                break;

              case 'tool_result':
                // Tool results are handled by the next turn
                break;

              case 'handoff':
                setStreamContent(prev => prev + `\n\n[Handoff: ${event.from} → ${event.to}]`);
                if (event.to) setStreamingAgent(event.to);
                break;

              case 'worker_launched':
                setStreamContent(prev =>
                  prev + `\n\n[_Worker launched: ${event.agentName} (Task: ${event.taskId})_]`
                );
                break;

              case 'worker_completed':
                setStreamContent(prev =>
                  prev + `\n\n[_Worker ${event.agentName} completed_]`
                );
                break;

              case 'done':
                if (event.agentMemories && event.newAgentName) {
                  options.onDone?.(event.agentMemories, event.newAgentName);
                }
                break;

              case 'error':
                options.onError?.(String(event.error || 'Unknown error'));
                break;
            }
          } catch {
            // Skip malformed SSE events
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        options.onError?.(error.message);
      }
    } finally {
      setIsStreaming(false);
      setStreamContent('');
      abortRef.current = null;
    }
  }, [activeAgentName, selectedModel, agentMemories, options, isStreaming]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    isStreaming,
    streamContent,
    streamingAgent,
    streamEvents,
    currentTurn,
    sendMessage,
    stopStreaming,
  };
}
