"use client";

import { useEffect, useState, useCallback } from 'react';

interface Shortcut {
  key: string;
  modifiers?: string[];
  action: () => void;
  description: string;
  category: 'navigation' | 'agents' | 'sessions' | 'tools' | 'system';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}

export function CommandPalette({ isOpen, onClose, shortcuts }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredShortcuts = shortcuts.filter(s =>
    s.description.toLowerCase().includes(query.toLowerCase()) ||
    s.key.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredShortcuts.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredShortcuts[selectedIndex]) {
        e.preventDefault();
        filteredShortcuts[selectedIndex].action();
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredShortcuts, selectedIndex, onClose]);

  // Open with Ctrl+K or Cmd+K
  useEffect(() => {
    const handleOpen = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // This is handled by parent component
      }
    };
    window.addEventListener('keydown', handleOpen);
    return () => window.removeEventListener('keydown', handleOpen);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[20vh]">
      <div
        className="w-full max-w-2xl bg-[#0a0000] border border-red-900/50 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.2)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="border-b border-red-900/30 p-4">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-gray-200 text-lg font-mono placeholder:text-red-900/50 outline-none"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredShortcuts.length === 0 ? (
            <div className="p-8 text-center text-red-900/50 font-mono text-sm">
              No commands found
            </div>
          ) : (
            <div className="p-2">
              {filteredShortcuts.map((shortcut, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    shortcut.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded transition-colors text-left ${idx === selectedIndex
                      ? 'bg-red-950/40 border border-red-900/50'
                      : 'hover:bg-red-950/20 border border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300 text-sm font-mono">{shortcut.description}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {shortcut.modifiers?.map(mod => (
                      <kbd key={mod} className="px-2 py-1 bg-black/40 border border-red-900/30 rounded text-[10px] text-red-500 font-mono">
                        {mod}
                      </kbd>
                    ))}
                    <kbd className="px-2 py-1 bg-black/40 border border-red-900/30 rounded text-[10px] text-red-500 font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-red-900/30 px-4 py-2 flex items-center justify-between text-[10px] text-red-900 font-mono">
          <span>↑↓ to navigate</span>
          <span>Enter to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd+K to open command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      // Handled by component
      return;
    }

    for (const shortcut of shortcuts) {
      const hasModifier = !shortcut.modifiers || shortcut.modifiers.every(mod => {
        if (mod === 'Cmd' || mod === 'Ctrl') return e.metaKey || e.ctrlKey;
        if (mod === 'Shift') return e.shiftKey;
        if (mod === 'Alt') return e.altKey;
        return false;
      });

      if (hasModifier && e.key.toLowerCase() === shortcut.key.toLowerCase()) {
        e.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
