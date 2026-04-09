"use client";

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'handoff' | 'error';

const STATUS_CONFIG = {
  idle: { color: 'text-gray-600', border: 'border-gray-900', label: 'IDLE', bg: 'bg-transparent' },
  thinking: { color: 'text-orange-500', border: 'border-orange-900', label: 'THINKING', bg: 'bg-orange-950/20' },
  executing: { color: 'text-red-500', border: 'border-red-900', label: 'EXEC IO', bg: 'bg-red-950/40' },
  handoff: { color: 'text-purple-500', border: 'border-purple-900', label: 'ROUTING', bg: 'bg-purple-950/20' },
  error: { color: 'text-[#ff0000]', border: 'border-[#ff0000]', label: 'FAULT', bg: 'bg-[#ff0000]/10' }
};

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span className={`px-2 py-0.5 text-[9px] font-mono border uppercase tracking-widest ${config.color} ${config.border} ${config.bg}`}>
      {config.label}
    </span>
  );
}
