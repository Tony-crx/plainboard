'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Trash2,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Terminal,
  X,
} from 'lucide-react';
import { TaskInfo } from '@/hooks/use-task-manager';

interface TaskPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskInfo[];
  activeTasks: TaskInfo[];
  loading: boolean;
  onStopTask: (taskId: string) => void;
  onMessageWorker: (taskId: string, message: string) => Promise<any>;
  onGetTaskOutput: (taskId: string) => Promise<any>;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  running: { icon: Activity, color: 'text-[#ff1a1a]', label: 'Running' },
  completed: { icon: CheckCircle, color: 'text-emerald-400', label: 'Completed' },
  failed: { icon: AlertTriangle, color: 'text-orange-400', label: 'Failed' },
  stopped: { icon: Square, color: 'text-gray-500', label: 'Stopped' },
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  backgrounded: { icon: Play, color: 'text-cyan-400', label: 'Background' },
};

export function TaskPanel({
  isOpen,
  onClose,
  tasks,
  activeTasks,
  loading,
  onStopTask,
  onMessageWorker,
  onGetTaskOutput,
}: TaskPanelProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState<Record<string, string>>({});

  const handleExpand = useCallback((taskId: string) => {
    setExpandedTask(prev => prev === taskId ? null : taskId);
  }, []);

  const handleSendMessage = useCallback(async (taskId: string) => {
    const msg = messageInput[taskId];
    if (!msg) return;
    await onMessageWorker(taskId, msg);
    setMessageInput(prev => ({ ...prev, [taskId]: '' }));
  }, [messageInput, onMessageWorker]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-50 w-96 max-h-[70vh] bg-[#050000]/95 backdrop-blur-xl border border-red-900/50 rounded-none clip-angled shadow-[0_0_30px_rgba(200,0,0,0.15)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-red-900/30 bg-[#0a0000]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#ff1a1a] drop-shadow-[0_0_5px_#ff1a1a]" />
              <h3 className="text-[10px] font-black text-[#ff1a1a] tracking-[0.3em] uppercase glow-text-sm">
                Task Manager
              </h3>
              {activeTasks.length > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#ff1a1a]/20 text-[#ff1a1a] rounded-sm font-mono">
                  {activeTasks.length}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-sm hover:bg-[#ff1a1a]/10 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-500 hover:text-[#ff1a1a]" />
            </button>
          </div>

          {/* Task List */}
          <div className="overflow-y-auto max-h-[calc(70vh-50px)] p-2 space-y-1">
            {loading && tasks.length === 0 && (
              <div className="text-center py-8 text-gray-600 text-[10px] font-mono uppercase tracking-widest animate-pulse">
                Loading tasks...
              </div>
            )}

            {!loading && tasks.length === 0 && (
              <div className="text-center py-8 text-gray-600 text-[10px] font-mono uppercase tracking-widest">
                No active tasks
              </div>
            )}

            {tasks.map(task => {
              const config = statusConfig[task.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const isExpanded = expandedTask === task.id;

              return (
                <div
                  key={task.id}
                  className="bg-black/40 border border-red-900/20 overflow-hidden hover:border-red-900/40 transition-colors"
                >
                  {/* Task Row */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#ff1a1a]/5 transition-colors"
                    onClick={() => handleExpand(task.id)}
                  >
                    <StatusIcon className={`w-3.5 h-3.5 flex-shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-gray-200 font-mono truncate">
                        {task.agentName}
                      </div>
                      <div className="text-[9px] text-gray-600 font-mono truncate">
                        {task.description.substring(0, 50)}...
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {task.runInBackground && (
                        <span className="px-1 py-0.5 text-[8px] font-mono bg-red-900/30 text-red-400 rounded-sm border border-red-900/30">
                          BG
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-600" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-3 pb-3 space-y-2 border-t border-red-900/20 bg-black/20"
                    >
                      {/* Progress Info */}
                      <div className="pt-2 space-y-1 font-mono">
                        <div className="flex justify-between text-[9px] text-gray-500">
                          <span>Tools: {task.progress.toolCallCount}</span>
                          <span>Tokens: {task.progress.tokenUsage.totalTokens.toLocaleString()}</span>
                        </div>
                        <div className="text-[9px] text-gray-600 truncate">
                          {task.progress.recentActivities.at(-1) || 'N/A'}
                        </div>
                        {task.result && (
                          <div className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-900/20 rounded-sm px-2 py-1 truncate">
                            {task.result.substring(0, 150)}...
                          </div>
                        )}
                        {task.error && (
                          <div className="text-[9px] text-red-400 bg-[#ff1a1a]/10 border border-red-900/20 rounded-sm px-2 py-1 truncate">
                            Error: {task.error}
                          </div>
                        )}
                      </div>

                      {/* Message Input for Running Workers */}
                      {task.status === 'running' && (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={messageInput[task.id] || ''}
                            onChange={e =>
                              setMessageInput(prev => ({
                                ...prev,
                                [task.id]: e.target.value,
                              }))
                            }
                            placeholder="Send follow-up..."
                            className="flex-1 bg-black/40 border border-red-900/30 rounded-sm px-2 py-1 text-[9px] text-gray-300 font-mono placeholder-gray-700 focus:outline-none focus:border-[#ff1a1a]/50"
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSendMessage(task.id);
                            }}
                          />
                          <button
                            onClick={() => handleSendMessage(task.id)}
                            className="p-1 rounded-sm bg-[#ff1a1a]/20 hover:bg-[#ff1a1a]/30 transition-colors border border-[#ff1a1a]/30"
                          >
                            <MessageSquare className="w-3 h-3 text-[#ff1a1a]" />
                          </button>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-1">
                        {task.status === 'running' && (
                          <button
                            onClick={() => onStopTask(task.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold bg-[#ff1a1a]/20 text-[#ff1a1a] rounded-sm hover:bg-[#ff1a1a]/30 transition-colors border border-[#ff1a1a]/30 font-mono uppercase tracking-wider"
                          >
                            <Square className="w-2.5 h-2.5" />
                            Stop
                          </button>
                        )}
                        {task.status === 'running' && (
                          <button
                            onClick={() => onGetTaskOutput(task.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold bg-red-900/30 text-red-400 rounded-sm hover:bg-red-900/50 transition-colors border border-red-900/30 font-mono uppercase tracking-wider"
                          >
                            <Terminal className="w-2.5 h-2.5" />
                            Output
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
