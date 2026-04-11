'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, X, ScrollText, Terminal, BarChart3 } from 'lucide-react';
import { globalWorkerLogStore, WorkerLogEntry } from '@/lib/communication/worker-live-logs';
import { useState, useEffect, useCallback } from 'react';

interface WorkerLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const levelColors: Record<string, string> = {
  info: 'text-gray-300',
  warn: 'text-yellow-400',
  error: 'text-[#ff1a1a]',
  debug: 'text-cyan-400',
};

const sourceIcons: Record<string, React.ReactNode> = {
  tool_call: <Terminal size={10} />,
  tool_result: <CheckCircle size={10} />,
  llm: <Activity size={10} />,
  system: <AlertTriangle size={10} />,
  handoff: <ScrollText size={10} />,
};

export function WorkerLogPanel({ isOpen, onClose }: WorkerLogPanelProps) {
  const [logs, setLogs] = useState<WorkerLogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterTask, setFilterTask] = useState<string>('all');

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setLogs(globalWorkerLogStore.getGlobalLogs(filterLevel === 'all' ? undefined : filterLevel as WorkerLogEntry['level']));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, filterLevel]);

  const taskIds = [...new Set(logs.map(l => l.taskId))];
  const filteredLogs = filterTask === 'all' ? logs : logs.filter(l => l.taskId === filterTask);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-4 z-50 w-[600px] max-h-[60vh] bg-[#050000]/95 backdrop-blur-xl border border-red-900/50 rounded-none clip-angled shadow-[0_0_30px_rgba(200,0,0,0.15)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-red-900/30 bg-[#0a0000]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-[#ff1a1a]" />
              <h3 className="text-[10px] font-black text-[#ff1a1a] tracking-[0.3em] uppercase font-mono">
                Worker Logs
              </h3>
              <span className="px-1 py-0.5 text-[8px] font-mono bg-[#ff1a1a]/20 text-[#ff1a1a] rounded-sm">
                {logs.length}
              </span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-[#ff1a1a]/10 rounded-sm">
              <X className="w-3.5 h-3.5 text-gray-500 hover:text-[#ff1a1a]" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-1 px-3 py-1.5 border-b border-red-900/20 bg-black/30">
            {['all', 'info', 'warn', 'error'].map(level => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-2 py-0.5 text-[8px] font-mono uppercase rounded-sm border transition-colors ${
                  filterLevel === level
                    ? 'bg-[#ff1a1a]/20 border-[#ff1a1a]/50 text-[#ff1a1a]'
                    : 'bg-black/40 border-red-900/20 text-gray-600 hover:text-gray-400'
                }`}
              >
                {level}
              </button>
            ))}
            <select
              value={filterTask}
              onChange={e => setFilterTask(e.target.value)}
              className="ml-auto bg-black/40 border border-red-900/20 text-[9px] text-gray-400 font-mono rounded-sm px-1.5 focus:outline-none"
            >
              <option value="all">All Tasks</option>
              {taskIds.map(id => (
                <option key={id} value={id}>{id.substring(0, 16)}...</option>
              ))}
            </select>
          </div>

          {/* Log Entries */}
          <div className="overflow-y-auto max-h-[calc(60vh-80px)] p-2 font-mono text-[9px] space-y-0.5">
            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-gray-700">No logs yet</div>
            )}
            {filteredLogs.map(log => (
              <div key={log.id} className="flex items-start gap-2 px-2 py-1 hover:bg-[#ff1a1a]/5 rounded-sm">
                <span className="text-gray-600 flex-shrink-0 mt-0.5">
                  {sourceIcons[log.source] || <Activity size={10} />}
                </span>
                <span className="text-gray-600 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`font-bold uppercase flex-shrink-0 ${levelColors[log.level]}`}>
                  [{log.level}]
                </span>
                <span className="text-gray-500 flex-shrink-0">{log.agentName}</span>
                <span className={levelColors[log.level]}>{log.message}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
