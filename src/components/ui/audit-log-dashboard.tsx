'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Search, X, Filter, Calendar, Trash2 } from 'lucide-react';
import type { ErrorHistoryEntry } from '@/lib/storage/indexeddb';
import { indexedDB } from '@/lib/storage/indexeddb';

interface AuditLogDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogDashboard({ isOpen, onClose }: AuditLogDashboardProps) {
  const [entries, setEntries] = useState<ErrorHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAgent, setFilterAgent] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await indexedDB.getErrorHistory({ limit: 200 });
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpen = useCallback(() => {
    loadEntries();
  }, [loadEntries]);

  const filteredEntries = entries.filter(e => {
    const matchesAgent = filterAgent === 'all' || e.agentName === filterAgent;
    const matchesSearch = !searchQuery || 
      e.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.agentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAgent && matchesSearch;
  });

  const uniqueAgents = [...new Set(entries.map(e => e.agentName))];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            exit={{ y: 20 }}
            className="w-full max-w-4xl max-h-[80vh] bg-[#050000]/95 border border-red-900/50 rounded-none clip-angled shadow-[0_0_40px_rgba(200,0,0,0.15)] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-red-900/30 bg-[#0a0000]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#ff1a1a]" />
                <h2 className="text-[10px] font-black text-[#ff1a1a] tracking-[0.3em] uppercase font-mono">
                  Audit Log
                </h2>
                <span className="px-1.5 py-0.5 text-[8px] font-mono bg-[#ff1a1a]/20 text-[#ff1a1a] rounded-sm">
                  {filteredEntries.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => indexedDB.clearErrorHistory().then(loadEntries)}
                  className="flex items-center gap-1 px-2 py-1 text-[8px] font-bold bg-[#ff1a1a]/20 text-[#ff1a1a] rounded-sm hover:bg-[#ff1a1a]/30 transition-colors border border-[#ff1a1a]/30 font-mono uppercase"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
                <button onClick={onClose} className="p-1 hover:bg-[#ff1a1a]/10 rounded-sm">
                  <X className="w-3.5 h-3.5 text-gray-500 hover:text-[#ff1a1a]" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 px-4 py-2 border-b border-red-900/20 bg-black/30">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search errors..."
                  className="w-full bg-black/40 border border-red-900/30 rounded-sm pl-7 pr-3 py-1 text-[10px] text-gray-300 font-mono placeholder-gray-700 focus:outline-none focus:border-[#ff1a1a]/50"
                />
              </div>
              <select
                value={filterAgent}
                onChange={e => setFilterAgent(e.target.value)}
                className="bg-black/40 border border-red-900/30 text-[10px] text-gray-400 font-mono rounded-sm px-2 focus:outline-none"
              >
                <option value="all">All Agents</option>
                {uniqueAgents.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Log Entries */}
            <div className="flex-1 overflow-y-auto p-3">
              {loading && (
                <div className="text-center py-8 text-gray-600 text-[10px] font-mono animate-pulse">Loading...</div>
              )}
              {!loading && filteredEntries.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-[10px] font-mono">No audit entries</div>
              )}
              <div className="space-y-1">
                {filteredEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="bg-black/40 border border-red-900/15 px-3 py-2 hover:border-red-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-bold text-[#ff1a1a] font-mono">{entry.agentName}</span>
                      <span className="text-[8px] text-gray-600 font-mono">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">{entry.errorMessage}</div>
                    {entry.lastUserMessage && (
                      <div className="text-[9px] text-gray-600 font-mono mt-1 truncate">
                        User: {entry.lastUserMessage.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
