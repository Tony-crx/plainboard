"use client";

import { Send, Square, AtSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface InputBarProps {
  inputMessage: string;
  isLoading: boolean;
  viewingAgentName: string;
  isWarRoomMode: boolean;
  onChange: (v: string) => void;
  onSend: () => void;
  onCancel: () => void;
}

export function InputBar({
  inputMessage,
  isLoading,
  viewingAgentName,
  isWarRoomMode,
  onChange,
  onSend,
  onCancel,
}: InputBarProps) {
  const placeholder = isLoading
    ? 'Generating response...'
    : isWarRoomMode
    ? 'War Room command — all agents will respond...'
    : `Message ${viewingAgentName}  •  use @agent to reroute`;

  return (
    <div className="shrink-0 bg-transparent px-2 py-2 relative">
      <div className="flex items-center gap-2 mb-3 px-1">
        <AtSign size={12} className="text-[#ff1a1a] drop-shadow-[0_0_5px_#ff1a1a]" />
        <span className="text-[10px] font-mono text-red-500 uppercase tracking-[0.2em] font-black glow-text-sm">
          {isWarRoomMode ? 'War Room · Distributed' : viewingAgentName}
        </span>
        {isLoading && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-[9px] font-mono text-red-600 ml-2 uppercase tracking-widest"
          >
            ● generating
          </motion.span>
        )}
      </div>

      {/* Input row */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputMessage}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !isLoading && onSend()}
          placeholder={placeholder}
          disabled={isLoading}
          className="
            input-terminal glass-panel
            w-full text-[#c4c4c4] placeholder-red-900/40
            font-mono text-[14px]
            px-6 py-4 pr-16 clip-angled
            disabled:opacity-50
            transition-all focus:outline-none
          "
        />

        {/* Send / Cancel button */}
        <div className="absolute right-4">
          {isLoading ? (
            <motion.button
              onClick={onCancel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-red-900/80 hover:bg-[#ff1a1a] text-black border border-red-500 transition-all clip-angled shadow-[0_0_15px_rgba(255,0,0,0.5)]"
              title="Stop Generation"
            >
              <Square size={16} />
            </motion.button>
          ) : (
            <motion.button
              onClick={onSend}
              disabled={!inputMessage.trim()}
              whileHover={inputMessage.trim() ? { scale: 1.05 } : {}}
              whileTap={inputMessage.trim() ? { scale: 0.95 } : {}}
              className="p-3 bg-[rgba(20,0,0,0.8)] hover:bg-[#ff1a1a] text-red-500 hover:text-black border border-red-800 hover:border-[#ff1a1a] transition-all disabled:opacity-30 disabled:cursor-not-allowed clip-angled"
              title="Send"
            >
              <Send size={16} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Hint line */}
      <div className="flex items-center gap-4 mt-2 px-1">
        <span className="text-[9px] text-red-950 font-mono">Enter ↵ to send</span>
        <span className="text-[9px] text-red-950 font-mono">Ctrl+C to cancel</span>
        <span className="text-[9px] text-red-950 font-mono">@name to route</span>
      </div>
    </div>
  );
}
