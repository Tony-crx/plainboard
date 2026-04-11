'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { PlanModeState } from '@/lib/permissions/plan-mode';

interface PlanModeBadgeProps {
  planState: PlanModeState;
  onClick: () => void;
  onToggle: () => void;
}

export function PlanModeBadge({ planState, onClick, onToggle }: PlanModeBadgeProps) {
  if (!planState.isActive) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black bg-black/50 border border-red-900/40 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] hover:bg-[#ff1a1a]/10 transition-all clip-angled tracking-[0.2em] uppercase"
        title="Enter Plan Mode"
      >
        <ClipboardList size={12} />
        <span>Plan</span>
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={onClick}
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black bg-yellow-500/15 border border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/25 transition-all clip-angled tracking-[0.2em] uppercase"
        title="View Plan"
      >
        <ClipboardList size={12} className="animate-pulse" />
        <span>Planning</span>
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
      </motion.button>
    </AnimatePresence>
  );
}
