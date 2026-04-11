"use client";

import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2, Check, X, Copy, Bookmark, Trash2,
  ShieldAlert, CheckCircle2
} from 'lucide-react';

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
  _originalIndex?: number;
}

interface MessageBubbleProps {
  msg: Message;
  index: number;
  messageId: string;
  isBookmarked: boolean;
  isEditing: boolean;
  isDeleteConfirm: boolean;
  isCopied: boolean;
  editingMessageContent: string;
  viewingAgentName: string;
  isLoading: boolean;
  lastUserMessage: string | null;
  lastErrorAgent: string | null;
  viewingAgent: string;
  onEdit: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditChange: (v: string) => void;
  onDelete: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onCopy: () => void;
  onBookmark: () => void;
  onDismissError: () => void;
  onRetry: () => void;
}

export function MessageBubble({
  msg,
  index,
  messageId,
  isBookmarked,
  isEditing,
  isDeleteConfirm,
  isCopied,
  editingMessageContent,
  viewingAgentName,
  isLoading,
  lastUserMessage,
  lastErrorAgent,
  viewingAgent,
  onEdit,
  onEditSave,
  onEditCancel,
  onEditChange,
  onDelete,
  onDeleteConfirm,
  onDeleteCancel,
  onCopy,
  onBookmark,
  onDismissError,
  onRetry,
}: MessageBubbleProps) {
  const isError = msg.role === 'system' && msg.content?.includes('[ERROR]');
  const isSystem = msg.role === 'system' && !isError;

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        key={messageId}
        className="w-full flex justify-center my-5"
      >
        <span className="text-[10px] bg-[#0d0000] text-red-600 px-4 py-1.5 font-mono border border-red-900/40 flex items-center gap-2 uppercase tracking-widest">
          <CheckCircle2 size={10} /> Handoff Established
        </span>
      </motion.div>
    );
  }

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        key={messageId}
        className="w-full max-w-[85%] relative group mb-6"
      >
        <button
          onClick={onDismissError}
          className="absolute -top-2 -right-2 p-1 bg-[#0d0000] border border-red-900 text-red-600 hover:bg-red-950 hover:text-red-300 transition-all opacity-0 group-hover:opacity-100 z-10"
          title="Dismiss error"
        >
          <X size={12} />
        </button>
        <div className="msg-error p-4 text-red-400 font-mono text-xs">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={13} className="text-red-500 shrink-0" />
            <span className="font-bold text-red-400 uppercase tracking-wider text-[10px]">Error</span>
          </div>
          <p className="leading-relaxed text-red-500/80">{msg.content?.replace('[ERROR]: ', '')}</p>
          {lastUserMessage && lastErrorAgent === viewingAgent && (
            <div className="mt-3 pt-3 border-t border-red-900/30 flex gap-2">
              <button
                onClick={onRetry}
                disabled={isLoading}
                className="flex items-center gap-1.5 bg-red-950 hover:bg-red-900 border border-red-900 text-red-400 px-3 py-1.5 uppercase tracking-widest text-[9px] font-bold transition-all disabled:opacity-40"
              >
                {isLoading ? (
                  <span className="animate-pulse">Retrying...</span>
                ) : 'Retry Message'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Normal user / assistant message
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      key={`${messageId}_${index}`}
      className="mb-1 w-full relative group flex items-start hover:bg-red-900/10 transition-colors"
    >
      <div className={`flex w-full ${isBookmarked ? 'border-l-2 border-[#ff1a1a] pl-2' : 'pl-2'}`}>
        
        {/* Timestamp & Prefix */}
        <div className="shrink-0 w-[140px] pt-1">
           {msg.role === 'user' ? (
             <div className="text-[12px] font-mono text-gray-400 font-bold tracking-widest">
               <span className="text-gray-600">[</span>SYS:USR<span className="text-gray-600">] &gt;&gt;</span>
             </div>
           ) : (
             <div className="text-[12px] font-mono text-[#ff1a1a] font-black tracking-widest flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-[#ff1a1a] animate-pulse" />
               <span className="text-red-900/50">[</span>{msg.name || viewingAgentName}<span className="text-red-900/50">] ::</span>
             </div>
           )}
        </div>

        {/* Message Content */}
        <div className="flex-1 relative group/message px-4">
          {/* Message body */}
          {isEditing ? (
            <div className={`p-5 space-y-3 ${msg.role === 'user' ? 'msg-user' : 'msg-assistant'}`}>
              <textarea
                value={editingMessageContent}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) onEditSave();
                  if (e.key === 'Escape') onEditCancel();
                }}
                className="w-full bg-black/60 border border-red-900/50 text-gray-200 text-sm p-3 focus:outline-none focus:border-red-600/70 font-mono resize-y min-h-[80px] leading-relaxed"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onEditCancel}
                  className="px-3 py-1.5 bg-black hover:bg-red-950/40 text-red-500/80 text-[10px] uppercase font-bold tracking-widest border border-red-900/40 flex items-center gap-1 transition-colors"
                >
                  <X size={11} /> Cancel
                </button>
                <button
                  onClick={onEditSave}
                  className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-400 text-[10px] uppercase font-bold tracking-widest border border-red-700/50 flex items-center gap-1 transition-colors"
                >
                  <Check size={11} /> Save
                </button>
              </div>
            </div>
          ) : (
            <div className={`py-1 text-[13px] leading-relaxed break-words font-mono ${
              msg.role === 'user'
                ? 'text-gray-300'
                : 'text-[#ff1a1a] whitespace-pre-wrap brightness-125'
            }`}>
              {msg.content}
            </div>
          )}

          {/* Hover action bar */}
          {!isEditing && (
            <div className="absolute top-1 right-2 flex gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity duration-150 bg-black/80 p-1 border border-red-900/50">
              {msg.role === 'user' && (
                <ActionBtn onClick={onEdit} title="Edit message">
                  <Edit2 size={11} />
                </ActionBtn>
              )}
              {msg.role === 'assistant' && (
                <ActionBtn onClick={onCopy} title="Copy message">
                  {isCopied
                    ? <span className="text-[8px] font-bold uppercase tracking-wider px-0.5">✓</span>
                    : <Copy size={11} />}
                </ActionBtn>
              )}
              <ActionBtn
                onClick={onBookmark}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                active={isBookmarked}
              >
                <Bookmark size={11} className={isBookmarked ? 'fill-red-500' : ''} />
              </ActionBtn>
              {isDeleteConfirm ? (
                <div className="flex items-center gap-1 bg-[#0d0000] border border-red-800 px-1">
                  <ActionBtn onClick={onDelete} title="Confirm delete" danger>
                    <Check size={11} />
                  </ActionBtn>
                  <ActionBtn onClick={onDeleteCancel} title="Cancel">
                    <X size={11} />
                  </ActionBtn>
                </div>
              ) : (
                <ActionBtn onClick={onDeleteConfirm} title="Delete message">
                  <Trash2 size={11} />
                </ActionBtn>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Streaming bubble — shown during live generation
// ─────────────────────────────────────────────────────────────────
export function StreamingBubble({ agentName, content }: { agentName: string; content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-1 w-full relative flex items-start bg-red-900/5 border-l-2 border-[#ff1a1a] pl-2"
    >
      <div className="shrink-0 w-[140px] pt-1">
         <div className="text-[12px] font-mono text-[#ff1a1a] font-black tracking-widest flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-[#ff1a1a] animate-pulse" />
           <span className="text-red-900/50">[</span>{agentName}<span className="text-red-900/50">] ::</span>
         </div>
      </div>
      
      <div className="flex-1 px-4 py-1 text-[13px] text-red-500 whitespace-pre-wrap font-mono leading-relaxed blink-cursor-end">
        {content}
        <span className="streaming-cursor ml-1" />
      </div>
    </motion.div>
  );
}

// ─── Small reusable action button ───────────────────────────────
function ActionBtn({
  children,
  onClick,
  title,
  active = false,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 border transition-colors
        ${danger
          ? 'bg-red-900/80 hover:bg-red-700 border-red-700 text-white'
          : active
          ? 'bg-red-950/80 border-red-800 text-red-400'
          : 'bg-[#0a0000]/90 hover:bg-red-950 border-red-900/50 text-red-600 hover:text-red-400'
        }`}
    >
      {children}
    </button>
  );
}
