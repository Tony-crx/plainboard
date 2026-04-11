"use client";

import { useState } from 'react';
import {
  Bookmark, ShieldAlert, Flame, FileDown, Download, X, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContextAwareness } from './context-awareness';
import { CostDisplay } from './cost-display';
import { ExportButton } from './export-button';

interface TopNavbarProps {
  viewingAgentName: string;
  isWarRoomMode: boolean;
  onToggleWarRoom: (v: boolean) => void;
  showBookmarkedOnly: boolean;
  onToggleBookmarked: (v: boolean) => void;
  onOpenTelemetry: () => void;
  onOpenErrorHistory: () => void;
  onExportCurrentAgent: () => void;
  onExportFullSession: () => void;
  contextTokenCount: number;
  showContextAwareness: boolean;
  currentMessages: any[];
}

export function TopNavbar({
  viewingAgentName,
  isWarRoomMode,
  onToggleWarRoom,
  showBookmarkedOnly,
  onToggleBookmarked,
  onOpenTelemetry,
  onOpenErrorHistory,
  onExportCurrentAgent,
  onExportFullSession,
  contextTokenCount,
  showContextAwareness,
  currentMessages,
}: TopNavbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="shrink-0 border-b-2 border-red-900/60 bg-[rgba(5,0,0,0.85)] backdrop-blur-md px-8 py-0 flex items-center justify-between gap-4 h-[60px] clip-bottom-right shadow-[0_5px_20px_rgba(200,0,0,0.15)] relative">
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ff1a1a] to-transparent opacity-50" />

      {/* Left — Agent identifier */}
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        <span className="text-[10px] text-red-500/70 uppercase tracking-[0.3em] font-black hidden sm:block drop-shadow-[0_0_5px_rgba(255,0,0,0.5)]">
          Node
        </span>
        <span className="px-4 py-1.5 bg-red-950/40 text-[#ff1a1a] text-[12px] font-black border border-red-600/60 tracking-[0.2em] uppercase glow-text-sm clip-angled">
          {viewingAgentName}
        </span>
      </div>

      {/* Right — Controls */}
      <div className="flex items-center gap-2 shrink-0">

        {/* War Room toggle */}
        <NavToggle
          checked={isWarRoomMode}
          onChange={onToggleWarRoom}
          label="War Room"
          icon={<Flame size={11} className="text-red-500" />}
        />

        {/* Bookmarked toggle */}
        <NavToggle
          checked={showBookmarkedOnly}
          onChange={onToggleBookmarked}
          label="Bookmarked"
          icon={<Bookmark size={11} className="text-red-500" />}
        />

        {/* Divider */}
        <div className="h-4 w-px bg-red-900/30 mx-1" />

        {/* Icon buttons */}
        <NavIconBtn onClick={onOpenTelemetry} title="Telemetry" label="Telemetry" />
        <NavIconBtn
          onClick={onOpenErrorHistory}
          title="Error Log"
          label="Errors"
          icon={<ShieldAlert size={11} />}
        />

        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-black hover:bg-red-950/40 text-red-600 hover:text-[#ff1a1a] border border-red-800/60 text-[10px] font-black uppercase tracking-widest transition-all clip-angled glow-border"
            title="Export"
          >
            <FileDown size={12} />
            <ChevronDown size={10} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-1 z-50 bg-[#060000] border border-red-900/50 shadow-[0_8px_24px_rgba(200,0,0,0.15)] min-w-[180px]"
              >
                <button
                  onClick={() => { onExportCurrentAgent(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2.5 text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-950/40 font-mono flex items-center gap-2 transition-colors"
                >
                  <FileDown size={10} /> Export Agent
                </button>
                <div className="h-px bg-red-900/20" />
                <button
                  onClick={() => { onExportFullSession(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2.5 text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-950/40 font-mono flex items-center gap-2 transition-colors"
                >
                  <Download size={10} /> Full Session (JSON)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cost + Context */}
        <div className="hidden lg:flex items-center gap-2 border-l border-red-900/30 pl-2">
          <CostDisplay />
          {showContextAwareness && (
            <ContextAwareness tokenCount={contextTokenCount} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Toggle pill ─────────────────────────────────────────────────
function NavToggle({
  checked,
  onChange,
  label,
  icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className={`
      flex items-center gap-1.5 cursor-pointer px-3 py-1.5 border text-[10px] font-bold uppercase tracking-widest transition-all
      ${checked
        ? 'border-red-700/70 bg-red-950/40 text-red-400 glow-text-sm'
        : 'border-red-900/30 bg-transparent text-red-800 hover:text-red-600 hover:border-red-900/50'
      }
    `}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only"
      />
      {icon}
      <span className="hidden sm:block">{label}</span>
    </label>
  );
}

// ─── Icon-only nav button ────────────────────────────────────────
function NavIconBtn({
  onClick,
  title,
  label,
  icon,
}: {
  onClick: () => void;
  title: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black hover:bg-red-950/30 text-red-700 hover:text-red-500 border border-red-900/40 text-[10px] font-bold uppercase tracking-widest transition-colors"
    >
      {icon}
      <span className="hidden sm:block">{label}</span>
    </button>
  );
}
