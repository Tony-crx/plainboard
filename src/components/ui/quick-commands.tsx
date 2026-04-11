'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Zap } from 'lucide-react';
import { NLCommandResult, parseNaturalLanguage, getCommandSuggestions, NLCommand } from '@/lib/utils/natural-commands';

interface QuickCommandsProps {
  onCommand: (result: NLCommandResult) => void;
  inputMessage: string;
}

export function QuickCommands({ onCommand, inputMessage }: QuickCommandsProps) {
  const [suggestions, setSuggestions] = useState<NLCommand[]>([]);

  const handleInputChange = useCallback((value: string) => {
    if (value.length > 2) {
      const cmds = getCommandSuggestions(value);
      // Don't show suggestions if it matches a command
      const parsed = parseNaturalLanguage(value);
      setSuggestions(parsed ? [] : cmds);
    } else {
      setSuggestions([]);
    }
  }, []);

  const quickActions = [
    { label: '📋 Tasks', command: 'show tasks' },
    { label: '🔧 Skills', command: 'show skills' },
    { label: '📝 Logs', command: 'show logs' },
    { label: '📊 Audit', command: 'show audit' },
    { label: '📅 Timeline', command: 'show timeline' },
    { label: '🆕 New Session', command: 'new session' },
  ];

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {quickActions.map(action => (
        <button
          key={action.command}
          onClick={() => {
            const result = parseNaturalLanguage(action.command);
            if (result) onCommand(result);
          }}
          className="px-2 py-1 text-[9px] font-mono bg-black/40 border border-red-900/30 text-gray-400 hover:text-[#ff1a1a] hover:border-[#ff1a1a]/50 hover:bg-[#ff1a1a]/10 rounded-sm transition-colors"
        >
          {action.label}
        </button>
      ))}

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 bg-[#050000] border border-red-900/50 rounded-sm shadow-lg max-w-xs">
          {suggestions.slice(0, 3).map((cmd) => {
            const result = cmd.action([] as unknown as RegExpMatchArray);
            return (
              <button
                key={cmd.id}
                onClick={() => onCommand(result)}
                className="w-full text-left px-3 py-2 text-[10px] font-mono text-gray-400 hover:bg-[#ff1a1a]/10 hover:text-[#ff1a1a] transition-colors border-b border-red-900/10 last:border-0"
              >
                <Zap size={10} className="inline mr-1" />
                {cmd.description}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
