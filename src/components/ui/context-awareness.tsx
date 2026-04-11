"use client";

import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextAwarenessProps {
  tokenCount: number;
  maxTokens?: number;
  collapsed?: boolean;
}

export function ContextAwareness({ tokenCount, maxTokens = 128000, collapsed }: ContextAwarenessProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const percentage = Math.min((tokenCount / maxTokens) * 100, 100);
  const isWarning = percentage > 60 && percentage <= 85;
  const isCritical = percentage > 85;

  const getBarColor = () => {
    if (isCritical) return 'bg-red-600';
    if (isWarning) return 'bg-yellow-600';
    return 'bg-red-900';
  };

  const getBorderColor = () => {
    if (isCritical) return 'border-red-600';
    if (isWarning) return 'border-yellow-600';
    return 'border-red-900/50';
  };

  const getTextColor = () => {
    if (isCritical) return 'text-red-500';
    if (isWarning) return 'text-yellow-500';
    return 'text-red-800';
  };

  const getIcon = () => {
    if (isCritical) return <AlertTriangle size={12} className="text-red-500 animate-pulse" />;
    if (isWarning) return <AlertTriangle size={12} className="text-yellow-500" />;
    return <CheckCircle2 size={12} className="text-red-900" />;
  };

  const formatTokenCount = (tokens: number): string => {
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  if (isDismissed) return null;

  return (
    <div className={`flex flex-col gap-1 ${collapsed ? 'w-auto' : 'min-w-[200px]'}`}>
      <div className={`flex items-center gap-2 border ${getBorderColor()} bg-black px-2 py-1 relative group`}>
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[8px] uppercase tracking-widest font-mono mb-0.5">
            <span className={getTextColor()}>Context</span>
            <span className={getTextColor()}>
              {formatTokenCount(tokenCount)} / {formatTokenCount(maxTokens)} ({percentage.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full h-1 bg-red-950/50 overflow-hidden">
            <motion.div
              className={`h-full ${getBarColor()} transition-all duration-500`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {!collapsed && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-red-900 hover:text-red-500 transition-colors text-[8px] font-mono"
            title="Toggle details"
          >
            <Activity size={10} />
          </button>
        )}

        <button
          onClick={() => setIsDismissed(true)}
          className="text-red-900 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
          title="Dismiss"
        >
          <X size={10} />
        </button>
      </div>

      <AnimatePresence>
        {showDetails && !collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-red-900/30 bg-red-950/20 p-2 text-[8px] font-mono text-red-700 space-y-1"
          >
            <div className="flex justify-between">
              <span>Estimated tokens:</span>
              <span>{formatTokenCount(tokenCount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Max context:</span>
              <span>{formatTokenCount(maxTokens)}</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining:</span>
              <span>{formatTokenCount(Math.max(maxTokens - tokenCount, 0))}</span>
            </div>
            {isWarning && (
              <div className="text-yellow-600 flex items-center gap-1 mt-1 pt-1 border-t border-yellow-900/30">
                <AlertTriangle size={8} />
                <span>Approaching context limit. Consider starting a new session.</span>
              </div>
            )}
            {isCritical && (
              <div className="text-red-500 flex items-center gap-1 mt-1 pt-1 border-t border-red-600/30 animate-pulse">
                <AlertTriangle size={8} />
                <span>Context window nearly full. Responses may be truncated.</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MemoryWarningProps {
  currentUsage: number;
  threshold?: number;
}

export function MemoryWarning({ currentUsage, threshold = 5 * 1024 * 1024 }: MemoryWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || currentUsage < threshold) return null;

  const percentage = Math.min((currentUsage / threshold) * 100, 100);
  const usageMB = (currentUsage / (1024 * 1024)).toFixed(2);
  const thresholdMB = (threshold / (1024 * 1024)).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-950/90 border border-red-600 shadow-[0_0_30px_rgba(255,0,0,0.2)] px-4 py-2 flex items-center gap-3"
    >
      <AlertTriangle size={14} className="text-red-500 animate-pulse flex-shrink-0" />
      <div className="flex flex-col">
        <span className="text-red-400 text-[10px] uppercase font-bold tracking-widest font-mono">
          Storage Warning: {usageMB}MB / {thresholdMB}MB
        </span>
        <div className="w-32 h-1 bg-black mt-1 overflow-hidden">
          <div
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <button
        onClick={() => setIsDismissed(true)}
        className="text-red-600 hover:text-red-400 transition-colors flex-shrink-0"
        title="Dismiss warning"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}
