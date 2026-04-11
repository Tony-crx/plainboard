"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Database, Trash2, Download, Eye, Filter } from 'lucide-react';

interface MemoryEntry {
  agent: string;
  message: any;
  index: number;
  timestamp: number;
  size: number;
}

interface MemoryBrowserProps {
  agentMemories: Record<string, any[]>;
  onClear?: (agent: string) => void;
  onClearAll?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function MemoryBrowser({ agentMemories, onClear, onClearAll, isOpen, onClose }: MemoryBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [viewingEntry, setViewingEntry] = useState<MemoryEntry | null>(null);
  const [sortBy, setSortBy] = useState<'time' | 'size'>('time');

  const allMemories = useMemo(() => {
    const entries: MemoryEntry[] = [];
    
    Object.entries(agentMemories).forEach(([agent, messages]) => {
      messages.forEach((msg, idx) => {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        entries.push({
          agent,
          message: msg,
          index: idx,
          timestamp: Date.now(),
          size: new Blob([content]).size
        });
      });
    });

    return entries.sort((a, b) => {
      if (sortBy === 'time') return b.timestamp - a.timestamp;
      return b.size - a.size;
    });
  }, [agentMemories, sortBy]);

  const filteredMemories = useMemo(() => {
    let filtered = allMemories;

    if (selectedAgent !== 'all') {
      filtered = filtered.filter(m => m.agent === selectedAgent);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => {
        const content = typeof m.message.content === 'string' ? m.message.content : JSON.stringify(m.message.content);
        return content.toLowerCase().includes(query) || m.agent.toLowerCase().includes(query);
      });
    }

    return filtered.slice(0, 100);
  }, [allMemories, selectedAgent, searchQuery]);

  const stats = useMemo(() => {
    const totalEntries = allMemories.length;
    const totalSize = allMemories.reduce((sum, m) => sum + m.size, 0);
    const agents = Object.keys(agentMemories);
    const largestAgent = agents.reduce((max, agent) => {
      const size = agentMemories[agent].reduce((sum, msg) => {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        return sum + new Blob([content]).size;
      }, 0);
      return size > (max?.size || 0) ? { agent, size } : max;
    }, null as { agent: string; size: number } | null);

    return { totalEntries, totalSize, agents: agents.length, largestAgent };
  }, [allMemories, agentMemories]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const exportMemories = () => {
    const data = JSON.stringify(agentMemories, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memories-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-4xl max-h-[80vh] bg-[#050000] border border-red-900/50 rounded-lg overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-red-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database size={20} className="text-red-500" />
              <div>
                <h2 className="text-lg font-black text-red-500 tracking-widest uppercase">Memory Browser</h2>
                <p className="text-[9px] text-red-900 font-mono">
                  {stats.totalEntries} entries • {formatSize(stats.totalSize)} • {stats.agents} agents
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportMemories}
                className="px-3 py-1.5 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5"
              >
                <Download size={12} />
                Export
              </button>
              <button
                onClick={onClearAll}
                className="px-3 py-1.5 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5"
              >
                <Trash2 size={12} />
                Clear All
              </button>
              <button
                onClick={onClose}
                className="p-1.5 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-3 border-b border-red-900/20 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-900" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search memories..."
                className="w-full bg-black/40 border border-red-900/30 rounded px-10 py-2 text-[11px] text-gray-300 font-mono placeholder:text-red-900/50 focus:border-[#ff1a1a] outline-none"
              />
            </div>
            <select
              value={selectedAgent}
              onChange={e => setSelectedAgent(e.target.value)}
              className="bg-black/40 border border-red-900/30 rounded px-3 py-2 text-[11px] text-gray-300 font-mono focus:border-[#ff1a1a] outline-none"
            >
              <option value="all">All Agents</option>
              {Object.keys(agentMemories).map(agent => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>
            <button
              onClick={() => setSortBy(sortBy === 'time' ? 'size' : 'time')}
              className="px-3 py-2 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors text-[10px] font-mono uppercase flex items-center gap-1.5"
            >
              <Filter size={12} />
              {sortBy === 'time' ? 'Time' : 'Size'}
            </button>
          </div>

          {/* Memory List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredMemories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Database size={40} className="text-red-900/30 mb-3" />
                <p className="text-[11px] text-red-900/50 font-mono uppercase tracking-widest">
                  No memories found
                </p>
              </div>
            ) : (
              filteredMemories.map((entry, idx) => (
                <motion.div
                  key={`${entry.agent}-${entry.index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.01, 0.3) }}
                  className="p-3 border border-red-900/20 bg-black/40 rounded hover:border-red-900/40 transition-colors cursor-pointer"
                  onClick={() => setViewingEntry(entry)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-orange-400 uppercase tracking-wider">{entry.agent}</span>
                      <span className="text-[8px] text-red-900 font-mono">#{entry.index}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] text-red-900 font-mono">{formatSize(entry.size)}</span>
                      <Eye size={12} className="text-red-900" />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono line-clamp-2">
                    {typeof entry.message.content === 'string' 
                      ? entry.message.content 
                      : JSON.stringify(entry.message.content)}
                  </p>
                </motion.div>
              ))
            )}
          </div>

          {/* Entry Detail Modal */}
          <AnimatePresence>
            {viewingEntry && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setViewingEntry(null)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="w-full max-w-2xl max-h-[60vh] bg-[#050000] border border-red-900/50 rounded-lg overflow-hidden flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="px-6 py-4 border-b border-red-900/30 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-red-500 tracking-widest uppercase">{viewingEntry.agent}</h3>
                      <p className="text-[9px] text-red-900 font-mono">Entry #{viewingEntry.index}</p>
                    </div>
                    <button
                      onClick={() => setViewingEntry(null)}
                      className="p-1.5 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <pre className="text-[11px] text-gray-300 font-mono whitespace-pre-wrap">
                      {JSON.stringify(viewingEntry.message, null, 2)}
                    </pre>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
