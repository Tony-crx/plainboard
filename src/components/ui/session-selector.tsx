'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Plus, Trash2, ChevronDown, Clock, X, Check } from 'lucide-react';
import { SessionInfo } from '@/hooks/use-session-manager';

interface SessionSelectorProps {
  sessions: SessionInfo[];
  activeSessionId: string | null;
  loading: boolean;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: (name?: string) => Promise<string | null>;
  onDeleteSession: (sessionId: string) => void;
}

export function SessionSelector({
  sessions,
  activeSessionId,
  loading,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
}: SessionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCreate = useCallback(async () => {
    const id = await onCreateSession();
    if (id) onSelectSession(id);
    setIsOpen(false);
  }, [onCreateSession, onSelectSession]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] hover:bg-[#ff1a1a]/10 transition-all clip-angled tracking-[0.2em] uppercase"
      >
        <FolderOpen size={12} />
        <span>Sessions</span>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 z-50 w-72 bg-[#050000]/95 backdrop-blur-xl border border-red-900/50 rounded-none clip-angled shadow-[0_0_30px_rgba(200,0,0,0.15)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-red-900/30 bg-[#0a0000]">
                <span className="text-[9px] font-black text-[#ff1a1a] tracking-[0.3em] uppercase font-mono">Sessions</span>
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-1 px-2 py-0.5 text-[8px] font-bold bg-[#ff1a1a]/20 text-[#ff1a1a] rounded-sm hover:bg-[#ff1a1a]/30 transition-colors border border-[#ff1a1a]/30 font-mono uppercase tracking-wider"
                >
                  <Plus className="w-3 h-3" />
                  New
                </button>
              </div>

              {/* Session List */}
              <div className="max-h-64 overflow-y-auto">
                {loading && (
                  <div className="px-3 py-4 text-center text-[9px] text-gray-600 font-mono uppercase tracking-widest animate-pulse">
                    Loading...
                  </div>
                )}

                {!loading && sessions.length === 0 && (
                  <div className="px-3 py-4 text-center text-[9px] text-gray-600 font-mono uppercase tracking-widest">
                    No saved sessions
                  </div>
                )}

                {sessions.map(session => {
                  const isActive = session.id === activeSessionId;

                  return (
                    <div
                      key={session.id}
                      className={`flex items-center gap-2 px-3 py-2 hover:bg-[#ff1a1a]/5 transition-colors ${isActive ? 'bg-[#ff1a1a]/10 border-l-2 border-[#ff1a1a]' : 'border-l-2 border-transparent'
                        }`}
                    >
                      {/* Select Button */}
                      <button
                        onClick={() => {
                          onSelectSession(session.id);
                          setIsOpen(false);
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          {isActive && <Check className="w-3 h-3 text-[#ff1a1a] flex-shrink-0" />}
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-gray-200 font-mono truncate">
                              {session.name}
                            </div>
                            <div className="flex items-center gap-1 text-[8px] text-gray-600 font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              {formatTime(session.updatedAt)}
                              {session.messageCount > 0 && (
                                <span className="ml-1">· {session.messageCount} msgs</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => onDeleteSession(session.id)}
                        className="p-1 rounded-sm hover:bg-[#ff1a1a]/20 transition-colors opacity-0 hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
