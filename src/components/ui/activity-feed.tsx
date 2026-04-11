"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Filter, Download, Pause, Play, Trash2 } from 'lucide-react';

export interface ActivityEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'warning' | 'error' | 'success' | 'agent' | 'tool' | 'system';
  agent?: string;
  message: string;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  entries: ActivityEntry[];
  onClear?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const TYPE_CONFIG = {
  info: { color: 'text-blue-400', border: 'border-blue-900/30', bg: 'bg-blue-950/10', icon: 'ℹ' },
  warning: { color: 'text-yellow-400', border: 'border-yellow-900/30', bg: 'bg-yellow-950/10', icon: '⚠' },
  error: { color: 'text-red-500', border: 'border-red-900/30', bg: 'bg-red-950/10', icon: '✕' },
  success: { color: 'text-green-400', border: 'border-green-900/30', bg: 'bg-green-950/10', icon: '✓' },
  agent: { color: 'text-orange-400', border: 'border-orange-900/30', bg: 'bg-orange-950/10', icon: '🤖' },
  tool: { color: 'text-purple-400', border: 'border-purple-900/30', bg: 'bg-purple-950/10', icon: '🔧' },
  system: { color: 'text-gray-400', border: 'border-gray-900/30', bg: 'bg-gray-950/10', icon: '⚙' }
};

export function ActivityFeed({ entries, onClear, isOpen = true, onClose }: ActivityFeedProps) {
  const [filter, setFilter] = useState<string>('all');
  const [isPaused, setIsPaused] = useState(false);
  const [displayedEntries, setDisplayedEntries] = useState<ActivityEntry[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (!isPaused) {
      const filtered = filter === 'all' 
        ? entries 
        : entries.filter(e => e.type === filter);
      setDisplayedEntries(filtered.slice(-100)); // Keep last 100 entries
    }
  }, [entries, filter, isPaused]);

  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [displayedEntries, autoScroll]);

  const handleScroll = () => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const exportFeed = () => {
    const data = JSON.stringify(displayedEntries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-feed-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full border-l border-red-900/30 bg-[#050000] flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-red-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-red-500" />
          <span className="text-[11px] font-black text-red-500 tracking-widest uppercase">Activity Feed</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play size={12} /> : <Pause size={12} />}
          </button>
          <button
            onClick={exportFeed}
            className="p-1 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors"
            title="Export"
          >
            <Download size={12} />
          </button>
          <button
            onClick={onClear}
            className="p-1 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors"
            title="Clear"
          >
            <Trash2 size={12} />
          </button>
          <button
            onClick={onClose}
            className="p-1 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="px-3 py-2 border-b border-red-900/20">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <Filter size={10} className="text-red-900 shrink-0" />
          {['all', 'info', 'warning', 'error', 'agent', 'tool', 'system'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2 py-0.5 text-[8px] uppercase tracking-wider border transition-colors whitespace-nowrap ${
                filter === type
                  ? 'border-[#ff1a1a] text-[#ff1a1a] bg-red-950/30'
                  : 'border-red-900/30 text-red-900 hover:text-red-500'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2"
      >
        <AnimatePresence>
          {displayedEntries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <Activity size={32} className="text-red-900/30 mb-2" />
              <p className="text-[10px] text-red-900/50 font-mono uppercase tracking-widest">
                No Activity
              </p>
            </motion.div>
          ) : (
            displayedEntries.map((entry) => {
              const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.info;
              
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`p-2 border ${config.border} ${config.bg} rounded`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-xs ${config.color} mt-0.5`}>{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[9px] font-mono uppercase tracking-wider ${config.color}`}>
                          {entry.agent || entry.type}
                        </span>
                        <span className="text-[8px] text-red-900 font-mono">
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-300 font-mono leading-relaxed break-words">
                        {entry.message}
                      </p>
                      {entry.metadata && (
                        <details className="mt-1">
                          <summary className="text-[8px] text-red-900 cursor-pointer hover:text-red-500">
                            Details
                          </summary>
                          <pre className="mt-1 p-1 bg-black/40 rounded text-[8px] text-red-800 overflow-x-auto">
                            {JSON.stringify(entry.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-red-900/30 flex items-center justify-between">
        <span className="text-[8px] text-red-900 font-mono">
          {displayedEntries.length} entries
        </span>
        {isPaused && (
          <span className="text-[8px] text-yellow-600 font-mono animate-pulse">
            PAUSED
          </span>
        )}
        {!autoScroll && displayedEntries.length > 0 && (
          <button
            onClick={() => {
              setAutoScroll(true);
              feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
            }}
            className="text-[8px] text-red-500 hover:text-[#ff1a1a] font-mono"
          >
            ↓ Scroll to bottom
          </button>
        )}
      </div>
    </motion.div>
  );
}
