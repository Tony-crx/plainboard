"use client";

import { useState, useEffect, useCallback } from 'react';
import { X, Trash2, RotateCcw, Calendar, User, Filter, ShieldAlert, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { indexedDB } from '@/lib/storage/indexeddb';
import type { ErrorHistoryEntry } from '@/lib/storage/indexeddb';

interface ErrorHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: (message: string, agentName: string) => void;
}

export function ErrorHistoryModal({ isOpen, onClose, onRetry }: ErrorHistoryModalProps) {
  const [errors, setErrors] = useState<ErrorHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAgent, setFilterAgent] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const loadErrors = useCallback(async () => {
    setLoading(true);
    try {
      const options: { startDate?: number; endDate?: number; agentName?: string } = {};

      if (filterStartDate) {
        options.startDate = new Date(filterStartDate).getTime();
      }
      if (filterEndDate) {
        // Include the entire end date
        const endDate = new Date(filterEndDate);
        endDate.setHours(23, 59, 59, 999);
        options.endDate = endDate.getTime();
      }
      if (filterAgent) {
        options.agentName = filterAgent;
      }

      const results = await indexedDB.getErrorHistory(options);
      setErrors(results);
    } catch (e) {
      console.error('Failed to load error history:', e);
    } finally {
      setLoading(false);
    }
  }, [filterAgent, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (isOpen) {
      loadErrors();
    }
  }, [isOpen, loadErrors]);

  const clearHistory = async () => {
    if (!confirm('Clear all error history? This cannot be undone.')) return;
    try {
      await indexedDB.clearErrorHistory();
      setErrors([]);
    } catch (e) {
      console.error('Failed to clear error history:', e);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await indexedDB.deleteErrorEntry(id);
      setErrors(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      console.error('Failed to delete error entry:', e);
    }
  };

  const retryError = (entry: ErrorHistoryEntry) => {
    if (entry.lastUserMessage && onRetry) {
      onRetry(entry.lastUserMessage, entry.agentName);
      onClose();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getUniqueAgents = () => {
    const allEntries = errors;
    // We need all errors for agent list, not just filtered ones
    return Array.from(new Set(allEntries.map(e => e.agentName))).sort();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col glass-panel bg-[#050000] border-2 border-red-900 shadow-[0_0_50px_rgba(255,0,0,0.15)]"
      >
        {/* Header */}
        <div className="p-4 border-b border-red-900/50 flex justify-between items-center bg-[#0a0000]">
          <h2 className="text-red-500 font-black tracking-widest flex items-center gap-2 uppercase">
            <ShieldAlert className="text-red-600" size={18} />
            Error History
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-red-950 text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-red-900/30 bg-[#0a0000]/50">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={12} className="text-red-700" />
            <span className="text-red-800 text-[9px] uppercase tracking-widest font-bold">Filters</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-red-900 text-[8px] uppercase tracking-widest flex items-center gap-1 mb-1">
                <Calendar size={8} /> From
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full bg-black border border-red-900/30 text-red-500 text-[9px] px-2 py-1.5 focus:outline-none focus:border-red-900/60 font-mono"
              />
            </div>
            <div>
              <label className="text-red-900 text-[8px] uppercase tracking-widest flex items-center gap-1 mb-1">
                <Calendar size={8} /> To
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full bg-black border border-red-900/30 text-red-500 text-[9px] px-2 py-1.5 focus:outline-none focus:border-red-900/60 font-mono"
              />
            </div>
            <div>
              <label className="text-red-900 text-[8px] uppercase tracking-widest flex items-center gap-1 mb-1">
                <User size={8} /> Agent
              </label>
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="w-full bg-black border border-red-900/30 text-red-500 text-[9px] px-2 py-1.5 focus:outline-none focus:border-red-900/60 font-mono"
              >
                <option value="">All Agents</option>
                {getUniqueAgents().map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  setFilterAgent('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                className="flex-1 bg-black hover:bg-red-950/40 text-red-800 text-[8px] uppercase font-bold tracking-widest px-2 py-1.5 border border-red-900/30 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center text-red-900/50 py-10 font-mono text-[9px] uppercase tracking-widest">
              Loading error history...
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center text-red-900/50 py-10 font-mono text-[9px] uppercase tracking-widest">
              {filterAgent || filterStartDate || filterEndDate ? 'No errors match filters' : 'No errors recorded'}
            </div>
          ) : (
            <AnimatePresence>
              {errors.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#0a0000] border border-red-900/30 p-3 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldAlert size={10} className="text-red-600 flex-shrink-0" />
                        <span className="text-red-500 text-[9px] font-bold uppercase tracking-wider">{entry.agentName}</span>
                        <span className="text-red-900 text-[8px] font-mono flex items-center gap-1">
                          <Clock size={8} />
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                      <div className="bg-black/50 border border-red-900/20 p-2 mb-2">
                        <code className="text-red-400/80 text-[10px] font-mono break-all">{entry.errorMessage}</code>
                      </div>
                      {entry.context && (
                        <div className="text-red-900/60 text-[8px] font-mono uppercase tracking-widest">
                          Context: {entry.context}
                        </div>
                      )}
                      {entry.lastUserMessage && (
                        <div className="mt-2 text-red-800 text-[9px] font-mono truncate">
                          Last prompt: {entry.lastUserMessage}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {entry.lastUserMessage && (
                        <button
                          onClick={() => retryError(entry)}
                          className="p-1.5 bg-red-950 hover:bg-red-900 border border-red-900 text-red-500 transition-colors"
                          title="Retry this message"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="p-1.5 bg-black hover:bg-red-950/40 border border-red-900/30 text-red-900 hover:text-red-500 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-red-900/30 bg-[#0a0000] flex justify-between items-center">
          <span className="text-red-900 text-[8px] font-mono uppercase tracking-widest">
            {errors.length} error{errors.length !== 1 ? 's' : ''} recorded
          </span>
          {errors.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 bg-black hover:bg-red-950/40 text-red-800 hover:text-red-500 text-[8px] uppercase font-bold tracking-widest px-3 py-1.5 border border-red-900/30 transition-colors"
            >
              <Trash2 size={10} /> Clear All
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
