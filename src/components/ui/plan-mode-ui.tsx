'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Check,
  X,
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import { PlanModeState } from '@/lib/permissions/plan-mode';

interface PlanModeUIProps {
  planState: PlanModeState;
  onUpdatePlan: (content: string) => void;
  onApprove: () => void;
  onCancel: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function PlanModeUI({
  planState,
  onUpdatePlan,
  onApprove,
  onCancel,
  isOpen,
  onClose,
}: PlanModeUIProps) {
  const [editMode, setEditMode] = useState(false);
  const [planDraft, setPlanDraft] = useState(planState.planContent);

  const handleSave = useCallback(() => {
    onUpdatePlan(planDraft);
    setEditMode(false);
  }, [planDraft, onUpdatePlan]);

  if (!isOpen || !planState.isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-3xl bg-[#050000]/95 border border-yellow-900/50 rounded-none clip-angled shadow-[0_0_40px_rgba(200,150,0,0.15)]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-yellow-900/30 bg-yellow-500/5">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-yellow-500" />
              <h2 className="text-[10px] font-black text-yellow-500 tracking-[0.3em] uppercase font-mono">
                Plan Mode
              </h2>
              <span className="px-1.5 py-0.5 text-[8px] font-bold bg-yellow-500/20 text-yellow-500 rounded-sm font-mono">
                {Math.round((Date.now() - planState.enteredAt) / 60000)}m
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!editMode && planState.planContent && (
                <button
                  onClick={() => {
                    setPlanDraft(planState.planContent);
                    setEditMode(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold bg-red-900/30 text-red-400 rounded-sm hover:bg-red-900/50 transition-colors border border-red-900/30 font-mono uppercase tracking-wider"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-sm hover:bg-[#ff1a1a]/10 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-500 hover:text-[#ff1a1a]" />
              </button>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="flex items-center gap-2 px-5 py-2 bg-yellow-500/10 border-b border-yellow-900/20">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
            <span className="text-[9px] text-yellow-500/80 font-mono uppercase tracking-wider">
              READ-ONLY: Explore codebase and design plans. No edits or executions allowed.
            </span>
          </div>

          {/* Content */}
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {editMode ? (
              <textarea
                value={planDraft}
                onChange={e => setPlanDraft(e.target.value)}
                placeholder="Write your plan in Markdown format..."
                className="w-full h-80 bg-black/40 border border-red-900/30 rounded-sm px-4 py-3 text-sm text-gray-300 font-mono placeholder-gray-700 focus:outline-none focus:border-[#ff1a1a]/50 resize-none"
              />
            ) : planState.planContent ? (
              <div className="whitespace-pre-wrap text-sm text-gray-300 bg-black/30 border border-red-900/20 rounded-sm p-4 font-mono">
                {planState.planContent}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-yellow-500/20 mx-auto mb-4" />
                <p className="text-sm text-gray-600 font-mono mb-2">No plan yet</p>
                <p className="text-xs text-gray-700 font-mono">
                  Explore the codebase, then write your plan using the Edit button.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-yellow-900/30 bg-black/20">
            <div className="flex gap-2">
              {editMode && (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 rounded-sm hover:bg-emerald-500/30 transition-colors border border-emerald-500/30 font-mono uppercase tracking-wider"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold bg-gray-500/20 text-gray-400 rounded-sm hover:bg-gray-500/30 transition-colors border border-gray-500/30 font-mono uppercase tracking-wider"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold bg-[#ff1a1a]/20 text-[#ff1a1a] rounded-sm hover:bg-[#ff1a1a]/30 transition-colors border border-[#ff1a1a]/30 font-mono uppercase tracking-wider"
              >
                <X className="w-3.5 h-3.5" />
                Cancel Plan
              </button>
              {planState.planContent && (
                <button
                  onClick={onApprove}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 rounded-sm hover:bg-emerald-500/30 transition-colors border border-emerald-500/30 font-mono uppercase tracking-wider"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve & Implement
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
