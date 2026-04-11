'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, X, Zap, Clock } from 'lucide-react';
import { sessionReplayRecorder, ReplaySession } from '@/lib/observability/session-replay';

interface SessionReplayViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SessionReplayViewer({ isOpen, onClose }: SessionReplayViewerProps) {
  const [sessions, setSessions] = useState<ReplaySession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ReplaySession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSessions = useCallback(() => {
    setSessions(sessionReplayRecorder.getAllSessions());
  }, []);

  const handleOpen = useCallback(() => {
    loadSessions();
  }, [loadSessions]);

  const play = useCallback((session: ReplaySession) => {
    setSelectedSession(session);
    setCurrentFrame(0);
    setIsPlaying(true);

    playInterval.current = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev >= session.frames.length - 1) {
          if (playInterval.current) clearInterval(playInterval.current);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);
  }, [playbackSpeed]);

  const pause = useCallback(() => {
    if (playInterval.current) clearInterval(playInterval.current);
    setIsPlaying(false);
  }, []);

  const skipForward = useCallback(() => {
    if (selectedSession) {
      setCurrentFrame(prev => Math.min(prev + 10, selectedSession.frames.length - 1));
    }
  }, [selectedSession]);

  const skipBack = useCallback(() => {
    setCurrentFrame(prev => Math.max(prev - 10, 0));
  }, []);

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
            className="w-full max-w-4xl max-h-[80vh] bg-[#050000]/95 border border-red-900/50 rounded-none clip-angled shadow-[0_0_40px_rgba(200,0,0,0.15)] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-red-900/30 bg-[#0a0000]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#ff1a1a]" />
                <h2 className="text-[10px] font-black text-[#ff1a1a] tracking-[0.3em] uppercase font-mono">
                  Session Replay
                </h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-[#ff1a1a]/10 rounded-sm">
                <X className="w-3.5 h-3.5 text-gray-500 hover:text-[#ff1a1a]" />
              </button>
            </div>

            {!selectedSession ? (
              /* Session List */
              <div className="p-4 overflow-y-auto max-h-[70vh]">
                {sessions.length === 0 && (
                  <div className="text-center py-12 text-gray-600 text-[10px] font-mono">
                    No recorded sessions
                  </div>
                )}
                <div className="space-y-1">
                  {sessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => play(session)}
                      className="w-full text-left bg-black/40 border border-red-900/20 px-4 py-3 hover:border-[#ff1a1a]/50 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="text-[10px] font-bold text-gray-200 font-mono">{session.name}</div>
                        <div className="text-[9px] text-gray-600 font-mono">
                          {session.frames.length} frames · {session.agentCount} agents · {Math.round(session.duration / 1000)}s
                        </div>
                      </div>
                      <Play size={14} className="text-[#ff1a1a]" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Playback */
              <div className="flex-1 flex flex-col">
                {/* Frame Display */}
                <div className="flex-1 p-4 overflow-y-auto bg-black/20">
                  {selectedSession.frames[currentFrame] && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-[#ff1a1a] font-mono">
                          {selectedSession.frames[currentFrame].agentName}
                        </span>
                        <span className="text-[9px] text-gray-600 font-mono">
                          Frame {currentFrame + 1}/{selectedSession.frames.length}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300 font-mono bg-black/40 border border-red-900/20 rounded-sm p-3 whitespace-pre-wrap">
                        {selectedSession.frames[currentFrame].message.content}
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-red-900/30 bg-[#0a0000]">
                  <div className="flex items-center gap-2">
                    <button onClick={skipBack} className="p-1.5 hover:bg-[#ff1a1a]/10 rounded-sm">
                      <SkipBack size={14} className="text-gray-400 hover:text-[#ff1a1a]" />
                    </button>
                    <button onClick={isPlaying ? pause : () => play(selectedSession)} className="p-1.5 hover:bg-[#ff1a1a]/10 rounded-sm">
                      {isPlaying ? <Pause size={14} className="text-[#ff1a1a]" /> : <Play size={14} className="text-[#ff1a1a]" />}
                    </button>
                    <button onClick={skipForward} className="p-1.5 hover:bg-[#ff1a1a]/10 rounded-sm">
                      <SkipForward size={14} className="text-gray-400 hover:text-[#ff1a1a]" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-gray-600" />
                    <select
                      value={playbackSpeed}
                      onChange={e => setPlaybackSpeed(Number(e.target.value))}
                      className="bg-black/40 border border-red-900/30 text-[9px] text-gray-400 font-mono rounded-sm px-1.5"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={1}>1x</option>
                      <option value={2}>2x</option>
                      <option value={4}>4x</option>
                    </select>
                  </div>
                  <button
                    onClick={() => { setSelectedSession(null); pause(); }}
                    className="px-2 py-1 text-[9px] font-bold text-gray-400 hover:text-[#ff1a1a] font-mono"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
