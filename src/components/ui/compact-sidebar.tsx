"use client";

import { useState } from 'react';
import { Plus, Trash2, Download, Upload, Pin, Archive, Edit2, AlertTriangle, Check, X, ArchiveRestore } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompactSidebarProps {
  sessions: any[];
  sessionId: string;
  sessionSearchQuery: string;
  setSessionSearchQuery: (v: string) => void;
  editingSessionId: string | null;
  editingName: string;
  setEditingName: (v: string) => void;
  deleteConfirmId: string | null;
  createNewSession: () => void;
  deleteSessionWithConfirmation: (id: string) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
  exportSession: () => void;
  importSession: (e: any) => void;
  loadSession: (s: any) => void;
  renameSession: (id: string, name: string) => void;
  cancelEditing: () => void;
  startEditing: (s: any) => void;
  togglePinSession: (id: string) => void;
  archiveSession: (id: string) => void;
  unarchiveSession: (id: string) => void;
}

export function CompactSidebar({
  sessions,
  sessionId,
  sessionSearchQuery,
  setSessionSearchQuery,
  editingSessionId,
  editingName,
  setEditingName,
  deleteConfirmId,
  createNewSession,
  deleteSessionWithConfirmation,
  confirmDelete,
  cancelDelete,
  exportSession,
  importSession,
  loadSession,
  renameSession,
  cancelEditing,
  startEditing,
  togglePinSession,
  archiveSession,
  unarchiveSession,
}: CompactSidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const MAX_COLLAPSED = 3;

  const sortedSessions = [...sessions]
    .filter(s => !s.archived)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt - a.createdAt;
    });

  const visibleSessions = expanded ? sortedSessions : sortedSessions.slice(0, MAX_COLLAPSED);
  const hiddenCount = sortedSessions.length - MAX_COLLAPSED;

  return (
    <div className="flex flex-col gap-2">

      {/* Action buttons */}
      <div className="flex gap-1.5">
        <button
          onClick={createNewSession}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[rgba(20,0,0,0.8)] hover:bg-[#ff1a1a] text-red-500 hover:text-black text-[11px] font-black px-2 py-2 border border-red-900/40 hover:border-[#ff1a1a] transition-colors tracking-widest uppercase clip-angled shadow-[0_0_10px_rgba(255,0,0,0.2)]"
          title="New Session"
        >
          <Plus size={12} /> New
        </button>
        <button
          onClick={() => deleteSessionWithConfirmation(sessionId)}
          className="px-2.5 bg-[#050000] hover:bg-red-900/80 text-red-600 hover:text-[#ff1a1a] border border-red-900/40 hover:border-red-500 transition-colors flex items-center clip-angled"
          title="Delete current session"
        >
          <Trash2 size={12} />
        </button>
        <button
          onClick={exportSession}
          className="px-2.5 bg-[#050000] hover:bg-red-900/80 text-red-600 hover:text-[#ff1a1a] border border-red-900/40 hover:border-red-500 transition-colors flex items-center clip-angled"
          title="Export session"
        >
          <Download size={12} />
        </button>
        <label
          className="px-2.5 bg-[#050000] hover:bg-red-900/80 text-red-600 hover:text-[#ff1a1a] border border-red-900/40 hover:border-red-500 transition-colors flex items-center cursor-pointer clip-angled"
          title="Import session"
        >
          <Upload size={12} />
          <input type="file" accept=".json" onChange={importSession} className="hidden" />
        </label>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-950/30 border border-red-800/40 p-2.5 overflow-hidden"
          >
            <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold mb-2">
              <AlertTriangle size={10} /> Delete this session?
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={confirmDelete}
                className="flex-1 flex items-center justify-center gap-1 bg-[#ff1a1a] hover:bg-red-500 text-black text-[10px] uppercase tracking-widest font-black px-2 py-1.5 transition-colors clip-angled shadow-[0_0_10px_rgba(255,0,0,0.5)]"
              >
                <Check size={10} /> Yes
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 flex items-center justify-center gap-1 bg-[rgba(10,0,0,0.8)] hover:bg-[#ff1a1a] text-red-500 hover:text-black text-[10px] uppercase font-bold px-2 py-1.5 border border-red-900/50 hover:border-[#ff1a1a] transition-colors clip-angled"
              >
                <X size={10} /> No
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session list */}
      <div className="flex flex-col gap-1">
        {visibleSessions.map((session) => {
          const isActive = sessionId === session.id;
          const isEditing = editingSessionId === session.id;
          const msgCount = Object.values(session.agentMemories as Record<string, any[]>).flat().length;

          return (
            <div key={session.id} className="relative group/session">
              {isEditing ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') renameSession(session.id, editingName);
                      if (e.key === 'Escape') cancelEditing();
                    }}
                    className="flex-1 bg-black border border-red-800/50 px-2 py-1.5 text-[11px] text-red-400 focus:outline-none font-mono focus:border-red-600"
                    autoFocus
                  />
                  <button
                    onClick={() => renameSession(session.id, editingName)}
                    className="px-2 bg-red-950 text-green-500 text-[10px] border border-red-900/50 hover:bg-red-900 transition-colors"
                  >
                    <Check size={11} />
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-2 bg-black text-red-800 text-[10px] border border-red-900/40 hover:text-red-500 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => loadSession(session)}
                  className={`
                    relative w-full p-2.5 border text-left text-[11px] cursor-pointer transition-all duration-200 clip-angled
                    ${isActive
                      ? 'border-[#ff1a1a] bg-red-950/30 text-[#ff1a1a] shadow-[inset_0_0_15px_rgba(255,0,0,0.15)]'
                      : 'border-red-900/30 bg-[rgba(10,0,0,0.4)] text-red-700 hover:bg-[rgba(40,0,0,0.6)] hover:border-red-600/60 hover:text-red-500'
                    }
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-red-600" />
                  )}

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 pl-1">
                      {session.pinned && <Pin size={9} className="text-red-700 shrink-0" />}
                      <span className="truncate font-medium">{session.name}</span>
                    </div>
                    <span className="text-[9px] text-red-900/60 shrink-0 font-mono">{msgCount}</span>
                  </div>

                  {/* Hover action row */}
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover/session:flex gap-0.5 bg-[#050000]/95 border border-red-900/30 p-0.5">
                    <SidebarActionBtn onClick={e => { e.stopPropagation(); togglePinSession(session.id); }} title={session.pinned ? 'Unpin' : 'Pin'}>
                      <Pin size={9} />
                    </SidebarActionBtn>
                    <SidebarActionBtn onClick={e => { e.stopPropagation(); startEditing(session); }} title="Rename">
                      <Edit2 size={9} />
                    </SidebarActionBtn>
                    <SidebarActionBtn onClick={e => { e.stopPropagation(); archiveSession(session.id); }} title="Archive">
                      <Archive size={9} />
                    </SidebarActionBtn>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Expand / collapse */}
        {hiddenCount > 0 && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-[10px] text-red-900 hover:text-red-600 py-1.5 border border-dashed border-red-900/20 hover:border-red-900/40 transition-colors font-mono tracking-widest"
          >
            + {hiddenCount} more sessions
          </button>
        )}
        {expanded && hiddenCount > 0 && (
          <button
            onClick={() => setExpanded(false)}
            className="text-[10px] text-red-900 hover:text-red-600 py-1.5 border border-dashed border-red-900/20 hover:border-red-900/40 transition-colors font-mono tracking-widest"
          >
            collapse ↑
          </button>
        )}

        {sortedSessions.length === 0 && (
          <div className="text-[10px] text-red-950 text-center py-3 font-mono">No sessions</div>
        )}
      </div>
    </div>
  );
}

function SidebarActionBtn({ children, onClick, title }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1 text-red-900 hover:text-red-400 hover:bg-red-950/50 transition-colors"
    >
      {children}
    </button>
  );
}
