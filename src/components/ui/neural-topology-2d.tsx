"use client";

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, ZoomIn, ZoomOut, RotateCcw, Grid } from 'lucide-react';

export interface AgentNode2D {
  id: string;
  name: string;
  displayName: string;
  icon: LucideIcon;
  status: 'idle' | 'thinking' | 'executing' | 'handoff' | 'error';
  x: number;
  y: number;
  messageCount: number;
  custom?: boolean;
}

export interface Connection2D {
  from: string;
  to: string;
  active: boolean;
}

interface NeuralTopology2DProps {
  agents: AgentNode2D[];
  connections?: Connection2D[];
  onAgentClick?: (agentId: string) => void;
}

function AgentNode2DComponent({
  agent,
  onClick,
}: {
  agent: AgentNode2D;
  onClick: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const statusColors = {
    idle: { bg: 'bg-gray-700', border: 'border-gray-500', text: 'text-gray-400' },
    thinking: { bg: 'bg-orange-600', border: 'border-orange-400', text: 'text-orange-400' },
    executing: { bg: 'bg-red-600', border: 'border-red-400', text: 'text-red-400' },
    handoff: { bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-purple-400' },
    error: { bg: 'bg-red-700', border: 'border-red-500', text: 'text-red-500' },
  };

  const colors = statusColors[agent.status];
  const isActive = agent.status !== 'idle';

  return (
    <div
      className="absolute cursor-pointer group"
      style={{
        left: `${agent.x}%`,
        top: `${agent.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={() => onClick(agent.id)}
      onMouseEnter={() => {
        setHovered(true);
        setShowTooltip(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setShowTooltip(false);
      }}
    >
      {/* Glow effect for active agents */}
      {isActive && (
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute inset-0 rounded-full ${colors.bg} opacity-50 blur-md`}
          style={{ margin: '-12px' }}
        />
      )}

      {/* Agent Node */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`relative w-20 h-20 rounded-full border-2 ${colors.border} ${colors.bg} flex items-center justify-center shadow-lg transition-all ${hovered ? 'shadow-2xl ring-2 ring-white/20' : ''
          }`}
      >
        {/* Status indicator ring */}
        {isActive && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-white/30"
          />
        )}

        <span className="text-[10px] font-black text-white uppercase tracking-wider text-center px-2 drop-shadow">
          {agent.displayName.substring(0, 10)}
        </span>
      </motion.div>

      {/* Label below node */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap">
        <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${colors.text} drop-shadow`}>
          {agent.displayName}
        </span>
        {agent.messageCount > 0 && (
          <span className="text-[8px] text-red-400 ml-1 font-mono">[{agent.messageCount}]</span>
        )}
      </div>

      {/* Custom agent badge */}
      {agent.custom && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff1a1a] rounded-full flex items-center justify-center border-2 border-black shadow-lg">
          <span className="text-[8px] text-white font-bold">★</span>
        </div>
      )}

      {/* Tooltip on hover */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-4 p-4 bg-[#0a0000]/95 border border-red-900/50 rounded-lg shadow-2xl z-50 min-w-[180px] backdrop-blur-sm"
          >
            <div className="text-[11px] text-red-500 font-mono uppercase tracking-wider mb-3 font-bold">
              {agent.displayName}
            </div>
            <div className="space-y-2 text-[9px] text-gray-300 font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={colors.text}>{agent.status.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Messages:</span>
                <span>{agent.messageCount}</span>
              </div>
              {agent.custom && (
                <div className="text-orange-400 font-bold mt-2">★ Custom Agent</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConnectionLine2D({
  from,
  to,
  active,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  active: boolean;
}) {
  return (
    <>
      <line
        x1={`${from.x}%`}
        y1={`${from.y}%`}
        x2={`${to.x}%`}
        y2={`${to.y}%`}
        stroke={active ? '#ff1a1a' : '#2a0000'}
        strokeWidth={active ? 2.5 : 1}
        strokeDasharray={active ? '6,4' : 'none'}
        opacity={active ? 0.9 : 0.2}
        className="transition-all duration-300"
      />
      {active && (
        <circle r="4" fill="#ff1a1a" opacity="0.9">
          <animateMotion
            dur="2.5s"
            repeatCount="indefinite"
            path={`M${from.x * 10},${from.y * 10} L${to.x * 10},${to.y * 10}`}
          />
        </circle>
      )}
    </>
  );
}

export function NeuralTopology2D({
  agents,
  connections = [],
  onAgentClick,
}: NeuralTopology2DProps) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-black via-[#0a0000] to-black">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => setScale(prev => Math.min(2, prev + 0.2))}
          className="p-2 bg-black/60 border border-red-900/50 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-all rounded backdrop-blur-sm"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => setScale(prev => Math.max(0.5, prev - 0.2))}
          className="p-2 bg-black/60 border border-red-900/50 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-all rounded backdrop-blur-sm"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }}
          className="p-2 bg-black/60 border border-red-900/50 text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-all rounded backdrop-blur-sm"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 border transition-all rounded backdrop-blur-sm ${showGrid ? 'bg-red-950/40 border-[#ff1a1a] text-[#ff1a1a]' : 'bg-black/60 border-red-900/50 text-red-500'
            }`}
        >
          <Grid size={16} />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 glass-panel-strong p-3 space-y-2 z-20">
        <div className="text-[9px] text-red-500 font-mono uppercase tracking-widest mb-2 font-bold">Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-700 border border-gray-500" />
          <span className="text-[9px] text-gray-400 font-mono">Idle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-600 border border-orange-400" />
          <span className="text-[9px] text-gray-400 font-mono">Thinking</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600 border border-red-400" />
          <span className="text-[9px] text-gray-400 font-mono">Executing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-600 border border-purple-400" />
          <span className="text-[9px] text-gray-400 font-mono">Routing</span>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 left-4 z-20 glass-panel-strong px-3 py-2">
        <div className="text-[8px] text-red-700 font-mono">
          {agents.length} agents • {connections.filter(c => c.active).length} active
        </div>
      </div>

      {/* Main canvas */}
      <div
        ref={containerRef}
        className="w-full h-full relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Background grid */}
        {showGrid && (
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,26,26,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,26,26,0.4) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: '0 0',
            }}
          />
        )}

        {/* SVG connections layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0' }}>
          {connections.map((conn, idx) => {
            const fromAgent = agents.find(a => a.id === conn.from);
            const toAgent = agents.find(a => a.id === conn.to);
            if (!fromAgent || !toAgent) return null;

            return (
              <g key={idx}>
                <ConnectionLine2D
                  from={{ x: fromAgent.x, y: fromAgent.y }}
                  to={{ x: toAgent.x, y: toAgent.y }}
                  active={conn.active}
                />
              </g>
            );
          })}
        </svg>

        {/* Agent nodes layer */}
        <div className="absolute inset-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0' }}>
          {agents.map((agent, idx) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1, type: 'spring', stiffness: 200 }}
            >
              <AgentNode2DComponent
                agent={agent}
                onClick={onAgentClick || (() => { })}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NeuralTopology2D;
