"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'handoff' | 'error' | 'offline';

const STATUS_CONFIG = {
  idle: { color: 'text-gray-600', border: 'border-gray-900', label: 'IDLE', bg: 'bg-transparent', glow: 'none', pulse: false },
  thinking: { color: 'text-orange-500', border: 'border-orange-900', label: 'THINKING', bg: 'bg-orange-950/20', glow: 'glow-orange', pulse: true },
  executing: { color: 'text-red-500', border: 'border-red-900', label: 'EXEC IO', bg: 'bg-red-950/40', glow: 'glow-red', pulse: true },
  handoff: { color: 'text-purple-500', border: 'border-purple-900', label: 'ROUTING', bg: 'bg-purple-950/20', glow: 'glow-purple', pulse: true },
  error: { color: 'text-[#ff0000]', border: 'border-[#ff0000]', label: 'FAULT', bg: 'bg-[#ff0000]/10', glow: 'glow-error', pulse: false },
  offline: { color: 'text-gray-800', border: 'border-gray-950', label: 'OFFLINE', bg: 'bg-transparent', glow: 'none', pulse: false }
};

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const config = STATUS_CONFIG[status];
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (config.pulse) {
      const interval = setInterval(() => {
        setAnimate(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [config.pulse]);

  return (
    <motion.span
      animate={animate ? { opacity: [1, 0.6, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-mono border uppercase tracking-widest ${config.color} ${config.border} ${config.bg}`}
    >
      {config.pulse && (
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'thinking' ? 'bg-orange-500' : status === 'executing' ? 'bg-red-500' : status === 'handoff' ? 'bg-purple-500' : 'bg-red-500'} animate-pulse`} />
      )}
      {!config.pulse && status === 'error' && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
      )}
      {config.label}
    </motion.span>
  );
}

// Glow ring effect for 3D nodes and cards
export function AgentStatusRing({ status }: { status: AgentStatus }) {
  const config = STATUS_CONFIG[status];

  if (!config.pulse && status !== 'error') return null;

  const ringColor = status === 'thinking' ? 'border-orange-500'
    : status === 'executing' ? 'border-red-500'
      : status === 'handoff' ? 'border-purple-500'
        : 'border-red-600';

  return (
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={`absolute inset-0 rounded-full border-2 ${ringColor}`}
    />
  );
}
