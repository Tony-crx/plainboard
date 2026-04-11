'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScrollText,
  Search,
  X,
  Play,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Skill } from '@/lib/skills/types';
import { globalSkillRegistry } from '@/lib/skills/skill-registry';

interface SkillBrowserProps {
  onExecute: (skillName: string, args?: Record<string, string>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SkillBrowser({
  onExecute,
  isOpen,
  onClose,
}: SkillBrowserProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [search, setSearch] = useState('');
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [argsInput, setArgsInput] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      import('@/lib/skills/bundled-skills').then(() => {
        setSkills(globalSkillRegistry.list());
      });
    }
  }, [isOpen]);

  const filteredSkills = skills.filter(s =>
    s.frontmatter.name.toLowerCase().includes(search.toLowerCase()) ||
    s.frontmatter.description.toLowerCase().includes(search.toLowerCase()) ||
    (s.frontmatter.whenToUse || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleExecute = useCallback((skillName: string) => {
    onExecute(skillName, argsInput);
    setArgsInput({});
    setExpandedSkill(null);
  }, [onExecute, argsInput]);

  const sourceColors: Record<string, string> = {
    bundled: 'bg-[#ff1a1a]/20 text-[#ff1a1a]',
    user: 'bg-purple-500/20 text-purple-400',
    project: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-50 w-[500px] max-h-[70vh] bg-[#050000]/95 backdrop-blur-xl border border-red-900/50 rounded-none clip-angled shadow-[0_0_30px_rgba(200,0,0,0.15)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-red-900/30 bg-[#0a0000]">
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-[#ff1a1a] drop-shadow-[0_0_5px_#ff1a1a]" />
              <h3 className="text-[10px] font-black text-[#ff1a1a] tracking-[0.3em] uppercase glow-text-sm">
                Skill Browser
              </h3>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#ff1a1a]/20 text-[#ff1a1a] rounded-sm font-mono">
                {skills.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-sm hover:bg-[#ff1a1a]/10 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-500 hover:text-[#ff1a1a]" />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-red-900/20">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search skills..."
                className="w-full bg-black/30 border border-red-900/30 rounded-sm pl-8 pr-3 py-1.5 text-xs text-gray-300 font-mono placeholder-gray-700 focus:outline-none focus:border-[#ff1a1a]/50"
              />
            </div>
          </div>

          {/* Skill List */}
          <div className="overflow-y-auto max-h-[calc(70vh-100px)] p-2 space-y-1">
            {skills.length === 0 && (
              <div className="text-center py-8 text-gray-600 text-[10px] font-mono uppercase tracking-widest animate-pulse">
                Loading skills...
              </div>
            )}

            {filteredSkills.length === 0 && skills.length > 0 && (
              <div className="text-center py-8 text-gray-600 text-[10px] font-mono uppercase tracking-widest">
                No skills found
              </div>
            )}

            {filteredSkills.map(skill => {
              const isExpanded = expandedSkill === skill.frontmatter.name;
              const hint = skill.frontmatter.argumentHint || '';
              const context = skill.frontmatter.context === 'fork' ? 'fork' : 'inline';

              return (
                <div
                  key={skill.id}
                  className="bg-black/40 border border-red-900/15 overflow-hidden hover:border-red-900/30 transition-colors"
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#ff1a1a]/5 transition-colors"
                    onClick={() => setExpandedSkill(isExpanded ? null : skill.frontmatter.name)}
                  >
                    <ScrollText className="w-3.5 h-3.5 text-[#ff1a1a] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-gray-200 font-mono">{skill.frontmatter.name}</span>
                        <span className={`px-1 py-0.5 text-[8px] font-bold rounded-sm font-mono ${sourceColors[skill.source]}`}>
                          {skill.source}
                        </span>
                        {context === 'fork' && (
                          <span className="px-1 py-0.5 text-[8px] font-bold bg-orange-500/20 text-orange-400 rounded-sm font-mono border border-orange-500/20">
                            fork
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-gray-600 font-mono truncate">
                        {skill.frontmatter.description}{hint && <span className="text-gray-700 ml-1">{hint}</span>}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600" />
                    )}
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-3 pb-3 space-y-2 border-t border-red-900/15 bg-black/20"
                    >
                      {skill.frontmatter.whenToUse && (
                        <div className="pt-2 font-mono">
                          <div className="text-[9px] text-gray-500 mb-1 uppercase tracking-wider">When to use:</div>
                          <div className="text-[9px] text-gray-400 bg-black/30 border border-red-900/15 rounded-sm px-2 py-1">
                            {skill.frontmatter.whenToUse}
                          </div>
                        </div>
                      )}

                      {skill.frontmatter.allowedTools && skill.frontmatter.allowedTools.length > 0 && (
                        <div className="font-mono">
                          <div className="text-[9px] text-gray-500 mb-1 uppercase tracking-wider">Auto-allowed tools:</div>
                          <div className="flex flex-wrap gap-1">
                            {skill.frontmatter.allowedTools.map(t => (
                              <span key={t} className="px-1.5 py-0.5 text-[8px] font-mono bg-red-900/15 text-red-400/70 rounded-sm border border-red-900/20">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {skill.frontmatter.effort && (
                        <div className="flex items-center gap-1 font-mono">
                          <Layers className="w-3 h-3 text-gray-600" />
                          <span className="text-[9px] text-gray-500 uppercase">
                            Effort: <span className="text-gray-300 font-bold">{skill.frontmatter.effort}</span>
                          </span>
                        </div>
                      )}

                      <div className="font-mono">
                        <div className="text-[9px] text-gray-500 mb-1 uppercase tracking-wider">Arguments:</div>
                        <input
                          type="text"
                          value={argsInput.target || ''}
                          onChange={e => setArgsInput(prev => ({ ...prev, target: e.target.value }))}
                          placeholder="e.g., src/components/Button.tsx"
                          className="w-full bg-black/40 border border-red-900/30 rounded-sm px-2 py-1.5 text-[9px] text-gray-300 font-mono placeholder-gray-700 focus:outline-none focus:border-[#ff1a1a]/50"
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleExecute(skill.frontmatter.name);
                          }}
                        />
                      </div>

                      <button
                        onClick={() => handleExecute(skill.frontmatter.name)}
                        className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 text-[10px] font-bold bg-[#ff1a1a]/20 text-[#ff1a1a] rounded-sm hover:bg-[#ff1a1a]/30 transition-colors border border-[#ff1a1a]/30 font-mono uppercase tracking-[0.2em]"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Execute Skill
                      </button>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
