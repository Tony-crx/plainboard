"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface TraceSpan {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  status: 'success' | 'error' | 'pending';
  agent?: string;
  metadata?: Record<string, any>;
}

interface TraceViewerProps {
  spans: TraceSpan[];
  isOpen: boolean;
  onClose: () => void;
}

export function TraceViewer({ spans, isOpen, onClose }: TraceViewerProps) {
  const [expandedSpan, setExpandedSpan] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalTime = spans.length > 0 
    ? Math.max(...spans.map(s => s.startTime + s.duration)) - Math.min(...spans.map(s => s.startTime))
    : 0;

  return (
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
          <div>
            <h2 className="text-lg font-black text-red-500 tracking-widest uppercase">Distributed Traces</h2>
            <p className="text-[9px] text-red-900 font-mono">
              {spans.length} spans • {totalTime.toFixed(0)}ms total
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors">
            ✕
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {spans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Clock size={40} className="text-red-900/30 mb-3" />
              <p className="text-[11px] text-red-900/50 font-mono uppercase tracking-widest">
                No traces recorded
              </p>
            </div>
          ) : (
            spans.map((span, idx) => {
              const isExpanded = expandedSpan === span.id;
              const offset = totalTime > 0 ? ((span.startTime - Math.min(...spans.map(s => s.startTime))) / totalTime) * 100 : 0;
              const width = totalTime > 0 ? (span.duration / totalTime) * 100 : 0;

              return (
                <motion.div
                  key={span.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="space-y-2"
                >
                  <button
                    onClick={() => setExpandedSpan(isExpanded ? null : span.id)}
                    className="w-full flex items-center gap-3 p-3 border border-red-900/20 bg-black/40 rounded hover:border-red-900/40 transition-colors text-left"
                  >
                    <ChevronRight
                      size={16}
                      className={`text-red-900 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                    
                    {/* Status icon */}
                    {span.status === 'success' && <CheckCircle size={16} className="text-green-500" />}
                    {span.status === 'error' && <AlertTriangle size={16} className="text-red-500" />}
                    {span.status === 'pending' && <Clock size={16} className="text-orange-500 animate-pulse" />}

                    {/* Info */}
                    <div className="flex-1">
                      <div className="text-[11px] text-gray-300 font-mono">{span.name}</div>
                      {span.agent && (
                        <div className="text-[9px] text-orange-400 font-mono">{span.agent}</div>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="text-[10px] text-red-500 font-mono">
                      {span.duration.toFixed(1)}ms
                    </div>
                  </button>

                  {/* Timeline bar */}
                  <div className="relative h-2 bg-red-950/20 rounded-full overflow-hidden ml-8">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className={`absolute h-full rounded-full ${
                        span.status === 'success' ? 'bg-green-500' :
                        span.status === 'error' ? 'bg-red-500' :
                        'bg-orange-500'
                      }`}
                      style={{ left: `${offset}%` }}
                    />
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && span.metadata && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-8 p-3 bg-black/60 rounded border border-red-900/20"
                      >
                        <pre className="text-[9px] text-gray-400 font-mono whitespace-pre-wrap">
                          {JSON.stringify(span.metadata, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
