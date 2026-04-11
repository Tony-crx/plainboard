'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { globalSmartRouter } from '@/lib/swarm/smart-router';
import { globalContextAwareDelegator } from '@/lib/swarm/context-aware-delegation';

interface AgentLeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentLeaderboard({ isOpen, onClose }: AgentLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'routing' | 'delegation'>('routing');

  const routingStats = globalSmartRouter.getStatistics();
  const delegationStats = globalContextAwareDelegator.getStats();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg bg-[#050000]/95 border border-red-900/50 rounded-none clip-angled shadow-[0_0_40px_rgba(200,0,0,0.15)]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-red-900/30 bg-[#0a0000]">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <h2 className="text-[10px] font-black text-[#ff1a1a] tracking-[0.3em] uppercase font-mono">
                  Agent Leaderboard
                </h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-[#ff1a1a]/10 rounded-sm">
                <X className="w-3.5 h-3.5 text-gray-500 hover:text-[#ff1a1a]" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-red-900/20">
              <button
                onClick={() => setActiveTab('routing')}
                className={`flex-1 py-2 text-[9px] font-bold font-mono uppercase tracking-wider transition-colors ${
                  activeTab === 'routing'
                    ? 'bg-[#ff1a1a]/15 text-[#ff1a1a] border-b-2 border-[#ff1a1a]'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                Smart Routing
              </button>
              <button
                onClick={() => setActiveTab('delegation')}
                className={`flex-1 py-2 text-[9px] font-bold font-mono uppercase tracking-wider transition-colors ${
                  activeTab === 'delegation'
                    ? 'bg-[#ff1a1a]/15 text-[#ff1a1a] border-b-2 border-[#ff1a1a]'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                Delegation
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {activeTab === 'routing' && (
                <div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-black/40 border border-red-900/20 p-2 text-center">
                      <div className="text-[18px] font-bold text-[#ff1a1a] font-mono">{routingStats.totalRouting}</div>
                      <div className="text-[8px] text-gray-600 font-mono uppercase">Total Routes</div>
                    </div>
                    <div className="bg-black/40 border border-red-900/20 p-2 text-center">
                      <div className="text-[18px] font-bold text-emerald-400 font-mono">{(routingStats.avgSuccessScore * 100).toFixed(0)}%</div>
                      <div className="text-[8px] text-gray-600 font-mono uppercase">Success Rate</div>
                    </div>
                    <div className="bg-black/40 border border-red-900/20 p-2 text-center">
                      <div className="text-[18px] font-bold text-cyan-400 font-mono">{routingStats.avgTurnCount.toFixed(1)}</div>
                      <div className="text-[8px] text-gray-600 font-mono uppercase">Avg Turns</div>
                    </div>
                  </div>

                  {/* Agent Rankings */}
                  <div className="space-y-1">
                    {routingStats.bestAgents.map((agent, idx) => (
                      <div
                        key={agent.agent}
                        className="flex items-center gap-3 bg-black/40 border border-red-900/15 px-3 py-2"
                      >
                        <div className="flex items-center justify-center w-6 h-6">
                          {idx === 0 ? <Trophy size={16} className="text-yellow-500" /> :
                           idx === 1 ? <Medal size={16} className="text-gray-400" /> :
                           idx === 2 ? <Award size={16} className="text-orange-500" /> :
                           <span className="text-[10px] text-gray-600 font-mono">{idx + 1}</span>}
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] font-bold text-gray-200 font-mono">{agent.agent}</div>
                          <div className="text-[8px] text-gray-600 font-mono">{agent.count} tasks</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[12px] font-bold text-[#ff1a1a] font-mono">{(agent.avgScore * 100).toFixed(0)}%</div>
                          <div className="flex items-center gap-0.5">
                            {agent.avgScore > 0.7 ? <TrendingUp size={10} className="text-emerald-400" /> :
                             agent.avgScore < 0.5 ? <TrendingDown size={10} className="text-red-400" /> :
                             <Minus size={10} className="text-gray-500" />}
                          </div>
                        </div>
                      </div>
                    ))}
                    {routingStats.bestAgents.length === 0 && (
                      <div className="text-center py-8 text-gray-600 text-[10px] font-mono">
                        No routing data yet. Start using agents to build statistics.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'delegation' && (
                <div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-black/40 border border-red-900/20 p-2 text-center">
                      <div className="text-[18px] font-bold text-[#ff1a1a] font-mono">{delegationStats.totalDelegations}</div>
                      <div className="text-[8px] text-gray-600 font-mono uppercase">Total Delegations</div>
                    </div>
                    <div className="bg-black/40 border border-red-900/20 p-2 text-center">
                      <div className="text-[18px] font-bold text-emerald-400 font-mono">{(delegationStats.overallSuccessRate * 100).toFixed(0)}%</div>
                      <div className="text-[8px] text-gray-600 font-mono uppercase">Success Rate</div>
                    </div>
                    <div className="bg-black/40 border border-red-900/20 p-2 text-center">
                      <div className="text-[18px] font-bold text-cyan-400 font-mono">{delegationStats.avgTurnsAfterHandoff.toFixed(1)}</div>
                      <div className="text-[8px] text-gray-600 font-mono uppercase">Avg Turns</div>
                    </div>
                  </div>

                  {delegationStats.topPatterns.length > 0 && (
                    <div>
                      <div className="text-[9px] text-gray-500 font-mono uppercase mb-2">Top Delegation Patterns</div>
                      {delegationStats.topPatterns.map((p, idx) => (
                        <div key={idx} className="bg-black/40 border border-red-900/15 px-3 py-2 mb-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-200 font-mono">{p.pattern || '(general)'}</span>
                            <span className="text-[10px] text-[#ff1a1a] font-mono">{p.agent}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[8px] text-gray-600 font-mono">{p.count} times</span>
                            <span className="text-[8px] text-emerald-400 font-mono">{(p.successRate * 100).toFixed(0)}% success</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
