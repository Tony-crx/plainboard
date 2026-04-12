"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Activity, BarChart3, ArrowRight, ShieldAlert, Terminal, Radio } from 'lucide-react';

// ===================== TYPING ANIMATION =====================
function TypingText({ text, speed = 60 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.substring(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className="font-mono text-sm text-gray-400">
      {displayed}
      {!done && <span className="animate-pulse text-[#ff1a1a]">▌</span>}
    </span>
  );
}

// ===================== RADAR RINGS =====================
function RadarRings() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.07]">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 rounded-full border border-[#ff1a1a]"
          style={{
            width: `${150 + i * 120}px`,
            height: `${150 + i * 120}px`,
            transform: 'translate(-50%, -50%)',
            animation: `radar-pulse ${3 + i * 0.5}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

// ===================== SCAN LINE =====================
function ScanLine() {
  return (
    <div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff1a1a]/20 to-transparent pointer-events-none"
      style={{ animation: 'scanline 4s linear infinite' }}
    />
  );
}

// ===================== SYSTEM STATUS =====================
function SystemStatus() {
  const [time, setTime] = useState('');
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
      setUptime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-6 text-[10px] font-mono text-gray-600">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        <span>SYSTEM ONLINE</span>
      </div>
      <span>{time}</span>
      <span>UPTIME: {uptime}s</span>
      <span>NODES: 6 ACTIVE</span>
      <span>V 2.0.0</span>
    </div>
  );
}

// ===================== OPTION CARD =====================
function OptionCard({
  icon: Icon,
  label,
  subtitle,
  description,
  features,
  href,
  index,
}: {
  icon: any;
  label: string;
  subtitle: string;
  description: string;
  features: string[];
  href: string;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 + index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={`group relative flex flex-col p-6 border transition-all duration-500 cursor-pointer ${hovered
        ? 'border-[#ff1a1a]/60 bg-[#ff1a1a]/5 shadow-[0_0_40px_rgba(255,0,0,0.08)]'
        : 'border-red-900/20 bg-black/40 hover:border-red-900/40'
        }`}
      style={{
        clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
      }}
    >
      {/* Corner accent */}
      <div className={`absolute top-0 right-0 w-8 h-8 transition-colors duration-500 ${hovered ? 'bg-[#ff1a1a]/20' : 'bg-transparent'
        }`} style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />

      {/* Icon + Label */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 border transition-colors duration-500 ${hovered ? 'border-[#ff1a1a]/40 bg-[#ff1a1a]/10' : 'border-red-900/30 bg-black/30'
          }`}>
          <Icon size={20} className={hovered ? 'text-[#ff1a1a]' : 'text-red-500/60'} />
        </div>
        <div>
          <div className={`text-sm font-black tracking-[0.2em] uppercase transition-colors duration-500 ${hovered ? 'text-[#ff1a1a]' : 'text-red-500/80'
            }`}>
            {label}
          </div>
          <div className="text-[10px] text-gray-600 font-mono tracking-wider">{subtitle}</div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 font-mono leading-relaxed mb-4 flex-1">
        {description}
      </p>

      {/* Features */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {features.map((f, i) => (
          <span
            key={i}
            className={`px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider border transition-colors duration-500 ${hovered
              ? 'border-[#ff1a1a]/30 text-gray-400 bg-[#ff1a1a]/5'
              : 'border-red-900/15 text-gray-700 bg-black/20'
              }`}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Enter Button */}
      <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 ${hovered ? 'text-[#ff1a1a]' : 'text-gray-600'
        }`}>
        <span>Enter</span>
        <ArrowRight size={12} className={`transition-transform duration-500 ${hovered ? 'translate-x-1' : ''}`} />
      </div>

      {/* Hover glow line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff1a1a] to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.a>
  );
}

// ===================== MAIN LANDING PAGE =====================
export default function Plainboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden flex flex-col">
      {/* Background: cyn.webp */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: "url('/cyn.webp')",
          filter: 'blur(3px) saturate(0.6)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* Radar Rings */}
      <RadarRings />

      {/* Scan Line */}
      <ScanLine />

      {/* Scanlines overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
      }} />

      {/* ═══════════════ TOP BAR ═══════════════ */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-red-900/15 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <Flame size={20} className="text-[#ff1a1a] drop-shadow-[0_0_10px_#ff1a1a]" />
              <div className="absolute inset-0 w-5 h-5 bg-[#ff1a1a]/20 rounded-full animate-ping" />
            </div>
            <div>
              <div className="text-sm font-black tracking-[0.4em] text-red-500 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                PLAINBOARD
              </div>
              <div className="text-[8px] text-gray-700 font-mono tracking-[0.3em] uppercase">
                CortisolBoard v2.0
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <a
            href="/login"
            className="flex items-center gap-2 px-4 py-2 border border-red-900/30 text-red-500/80 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#ff1a1a]/10 hover:border-[#ff1a1a]/50 hover:text-[#ff1a1a] transition-all duration-300"
            style={{
              clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
            }}
          >
            <ShieldAlert size={12} />
            <span>Authenticate</span>
          </a>
        </motion.div>
      </header>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black text-white/90 tracking-[0.15em] uppercase mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
            Command Center
          </h1>
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#ff1a1a]/50 to-transparent mx-auto mb-3" />
          <div className="h-6">
            <TypingText text="Multi-Agent AI Swarm Orchestration Platform" speed={40} />
          </div>
        </motion.div>

        {/* Option Cards */}
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <OptionCard
            icon={Activity}
            label="SWARM"
            subtitle="AI Agent Command"
            description="Multi-agent AI orchestration with real-time streaming, task delegation, and persistent memory. Chat with 6 specialized agents."
            features={['6 Agents', 'Real-Time Stream', 'Task Delegation', 'Memory System', 'Skill Engine']}
            href="/swarm"
            index={0}
          />
          <OptionCard
            icon={BarChart3}
            label="THE BOARD"
            subtitle="Bloomberg Terminal"
            description="Real-time intelligence dashboard with agent monitoring, live news feeds, market data, and system metrics."
            features={['Live Feeds', 'Market Data', 'Agent Matrix', 'News Engine', 'Command Bar']}
            href="/board"
            index={1}
          />
        </div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12"
        >
          <SystemStatus />
        </motion.div>
      </main>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="relative z-10 flex items-center justify-between px-6 py-3 border-t border-red-900/10 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-4 text-[9px] text-gray-700 font-mono">
          <span>55 Features</span>
          <span>·</span>
          <span>19 API Routes</span>
          <span>·</span>
          <span>40+ Components</span>
          <span>·</span>
          <span>Next.js 16</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-gray-700 font-mono">
          <Radio size={10} className="animate-pulse text-red-500/40" />
          <span>All Systems Operational</span>
        </div>
      </footer>

      {/* ═══════════════ CSS ANIMATIONS ═══════════════ */}
      <style jsx global>{`
        @keyframes radar-pulse {
          0% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes scanline {
          0% { top: -2px; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
