"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Users, Shield } from 'lucide-react';

interface WarRoomVisualizationProps {
  activeAgents: string[];
  isRunning: boolean;
  currentSpeaker?: string;
}

export function WarRoomVisualization({ activeAgents, isRunning, currentSpeaker }: WarRoomVisualizationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; targetX: number; targetY: number }>>([]);

  useEffect(() => {
    if (!isRunning) {
      setParticles([]);
      return;
    }

    const interval = setInterval(() => {
      if (activeAgents.length < 2) return;

      const fromIdx = Math.floor(Math.random() * activeAgents.length);
      let toIdx = Math.floor(Math.random() * activeAgents.length);
      while (toIdx === fromIdx) {
        toIdx = Math.floor(Math.random() * activeAgents.length);
      }

      const newParticle = {
        id: Date.now() + Math.random(),
        x: fromIdx,
        y: 0,
        targetX: toIdx,
        targetY: 0
      };

      setParticles(prev => [...prev.slice(-20), newParticle]);
    }, 800);

    return () => clearInterval(interval);
  }, [isRunning, activeAgents]);

  if (!isRunning || activeAgents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Users size={48} className="text-red-900/30 mx-auto mb-4" />
          <p className="text-[11px] text-red-900/50 font-mono uppercase tracking-widest">
            War Room Inactive
          </p>
          <p className="text-[9px] text-red-900/30 font-mono mt-2">
            Enable War Room Mode to activate
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* Agent nodes arranged in circle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[300px] h-[300px]">
          {activeAgents.map((agent, idx) => {
            const angle = (idx / activeAgents.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 120;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const isSpeaking = currentSpeaker === agent;

            return (
              <motion.div
                key={agent}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="absolute left-1/2 top-1/2"
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                }}
              >
                <motion.div
                  animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                  className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${
                    isSpeaking
                      ? 'border-[#ff1a1a] bg-red-950/40 shadow-[0_0_20px_rgba(255,0,0,0.4)]'
                      : 'border-red-900/50 bg-black/60'
                  }`}
                >
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-wider text-center px-1">
                    {agent}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}

          {/* Center hub */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 rounded-full border-2 border-dashed border-[#ff1a1a]/30 flex items-center justify-center"
            >
              <Sparkles size={24} className="text-[#ff1a1a] animate-pulse" />
            </motion.div>
          </div>

          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {activeAgents.map((_, idx) => {
              const angle1 = (idx / activeAgents.length) * Math.PI * 2 - Math.PI / 2;
              const angle2 = ((idx + 1) / activeAgents.length) * Math.PI * 2 - Math.PI / 2;
              const radius = 120;
              const x1 = 150 + Math.cos(angle1) * radius;
              const y1 = 150 + Math.sin(angle1) * radius;
              const x2 = 150 + Math.cos(angle2) * radius;
              const y2 = 150 + Math.sin(angle2) * radius;

              return (
                <line
                  key={idx}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255, 0, 0, 0.2)"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Flying particles */}
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 1, x: 0, y: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute w-2 h-2 bg-[#ff1a1a] rounded-full shadow-[0_0_10px_#ff1a1a]"
            style={{
              left: `${50 + (particle.x / activeAgents.length) * 30}%`,
              top: '50%'
            }}
          />
        ))}
      </AnimatePresence>

      {/* Status badge */}
      <div className="absolute top-4 left-4 glass-panel-strong px-3 py-2">
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-[#ff1a1a] animate-pulse" />
          <span className="text-[9px] text-red-500 font-mono uppercase tracking-wider">
            {activeAgents.length} Agents Active
          </span>
        </div>
      </div>

      {currentSpeaker && (
        <div className="absolute bottom-4 left-4 glass-panel-strong px-3 py-2">
          <span className="text-[9px] text-orange-400 font-mono uppercase tracking-wider">
            Speaking: {currentSpeaker}
          </span>
        </div>
      )}
    </div>
  );
}
