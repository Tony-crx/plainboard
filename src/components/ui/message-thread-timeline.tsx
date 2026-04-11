'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowRight, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Message } from '@/lib/swarm/types';
import { useState, useCallback } from 'react';

interface MessageThreadTimelineProps {
  messages: Message[];
  agentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MessageThreadTimeline({ messages, agentName, isOpen, onClose }: MessageThreadTimelineProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[700px] max-h-[70vh] bg-[#050000]/95 backdrop-blur-xl border border-red-900/50 rounded-none clip-angled shadow-[0_0_30px_rgba(200,0,0,0.15)]"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-red-900/30 bg-[#0a0000]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#ff1a1a]" />
              <h3 className="text-[10px] font-black text-[#ff1a1a] tracking-[0.3em] uppercase font-mono">
                Message Timeline
              </h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-[#ff1a1a]/10 rounded-sm">
              <X className="w-3.5 h-3.5 text-gray-500 hover:text-[#ff1a1a]" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(70vh-45px)] p-3">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-600 text-[10px] font-mono">No messages</div>
            )}

            <div className="space-y-1 relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-red-900/20" />

              {messages.map((msg, idx) => {
                const isExpanded = expandedIdx === idx;
                const isUser = msg.role === 'user';
                const isAssistant = msg.role === 'assistant';
                const isSystem = msg.role === 'system';
                const isTool = msg.role === 'tool';

                const bgColors: Record<string, string> = {
                  user: 'bg-blue-900/15 border-blue-900/30',
                  assistant: 'bg-[#ff1a1a]/10 border-red-900/30',
                  system: 'bg-yellow-500/5 border-yellow-900/20',
                  tool: 'bg-gray-900/20 border-gray-800/20',
                };

                const dotColors: Record<string, string> = {
                  user: 'bg-blue-500',
                  assistant: 'bg-[#ff1a1a]',
                  system: 'bg-yellow-500',
                  tool: 'bg-gray-500',
                };

                return (
                  <div
                    key={idx}
                    className={`ml-6 relative p-2 border rounded-sm ${bgColors[msg.role] || bgColors.system} hover:border-red-900/50 transition-colors cursor-pointer`}
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute -left-[22px] top-3 w-2 h-2 rounded-full ${dotColors[msg.role] || dotColors.system}`} />

                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold font-mono uppercase ${
                        isUser ? 'text-blue-400' : isAssistant ? 'text-[#ff1a1a]' : isTool ? 'text-gray-400' : 'text-yellow-500'
                      }`}>
                        {msg.name || msg.role}
                      </span>
                      {msg.tool_calls && (
                        <span className="text-[8px] font-mono bg-[#ff1a1a]/20 text-[#ff1a1a] px-1 rounded-sm">
                          {msg.tool_calls.length} tools
                        </span>
                      )}
                      {isExpanded && <ChevronUp className="w-3 h-3 text-gray-600 ml-auto" />}
                      {!isExpanded && <ChevronDown className="w-3 h-3 text-gray-600 ml-auto" />}
                    </div>

                    {/* Content */}
                    <div className={`text-[10px] font-mono ${
                      isUser ? 'text-gray-300' : isAssistant ? 'text-gray-300' : isTool ? 'text-gray-500' : 'text-yellow-400/70'
                    } ${isExpanded ? '' : 'truncate'}`}>
                      {msg.content?.substring(0, isExpanded ? 2000 : 150) || '(empty)'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
