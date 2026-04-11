'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('cortisol_theme') as 'dark' | 'light' | null;
    if (saved) setTheme(saved);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('cortisol_theme', next);
    document.documentElement.classList.toggle('light-theme', next === 'light');
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono border transition-all ${
        theme === 'dark'
          ? 'bg-black/50 border-yellow-900/40 text-yellow-500 hover:bg-yellow-500/10'
          : 'bg-white/50 border-gray-300 text-gray-700 hover:bg-gray-100'
      } ${className || ''}`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? (
        <>
          <Sun size={12} />
          <span>Light</span>
        </>
      ) : (
        <>
          <Moon size={12} />
          <span>Dark</span>
        </>
      )}
    </button>
  );
}
