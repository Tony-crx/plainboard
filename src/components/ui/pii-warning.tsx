'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Shield, ShieldAlert } from 'lucide-react';
import { detectPII, redactPII, hasPII } from '@/lib/security/pii-detector';

interface PIIWarningProps {
  text: string;
  onRedact?: (redacted: string) => void;
  showWarning?: boolean;
}

export function PIIWarning({ text, onRedact, showWarning = true }: PIIWarningProps) {
  const [findings, setFindings] = useState<ReturnType<typeof detectPII>>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (text && showWarning) {
      const result = detectPII(text);
      setFindings(result);
      setDismissed(false);
    }
  }, [text, showWarning]);

  if (!showWarning || findings.length === 0 || dismissed) return null;

  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm px-3 py-2 mb-2 flex items-center gap-2"
      >
        {criticalCount > 0 ? (
          <ShieldAlert size={14} className="text-[#ff1a1a] flex-shrink-0" />
        ) : (
          <Shield size={14} className="text-yellow-500 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-bold text-yellow-500 font-mono uppercase">
            Sensitive Data Detected
          </div>
          <div className="text-[8px] text-gray-400 font-mono">
            {findings.length} item{findings.length > 1 ? 's' : ''} found
            {criticalCount > 0 && ` · ${criticalCount} critical`}
            {highCount > 0 && ` · ${highCount} high`}
          </div>
          <div className="flex gap-1 mt-1">
            {onRedact && (
              <button
                onClick={() => {
                  const { redacted } = redactPII(text);
                  onRedact(redacted);
                }}
                className="px-2 py-0.5 text-[8px] font-bold bg-[#ff1a1a]/20 text-[#ff1a1a] rounded-sm hover:bg-[#ff1a1a]/30 transition-colors border border-[#ff1a1a]/30 font-mono uppercase"
              >
                Auto-Redact
              </button>
            )}
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="p-0.5 hover:bg-yellow-500/10 rounded-sm flex-shrink-0">
          <X size={12} className="text-gray-500" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// Inline PII badge for messages
export function PIIBadge({ text }: { text: string }) {
  if (!hasPII(text)) return null;
  const findings = detectPII(text);
  const types = [...new Set(findings.map(f => f.type))];

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono bg-yellow-500/15 text-yellow-500 rounded-sm border border-yellow-500/20">
      <Shield size={8} />
      {types.join(', ')}
    </span>
  );
}
