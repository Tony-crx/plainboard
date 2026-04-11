'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Trash2, Play, Pause, X, RefreshCw } from 'lucide-react';
import { globalCronScheduler, CronJob } from '@/lib/queue/cron-scheduler';

interface CronManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CronManager({ isOpen, onClose }: CronManagerProps) {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newJob, setNewJob] = useState({ name: '', schedule: '1h', prompt: '', agentName: 'Coordinator' });

  const loadJobs = useCallback(() => {
    setJobs(globalCronScheduler.getJobs());
  }, []);

  useEffect(() => {
    if (isOpen) loadJobs();
  }, [isOpen, loadJobs]);

  const handleAdd = useCallback(() => {
    if (!newJob.name || !newJob.prompt) return;
    globalCronScheduler.addJob({
      name: newJob.name,
      schedule: newJob.schedule,
      prompt: newJob.prompt,
      agentName: newJob.agentName,
    });
    setNewJob({ name: '', schedule: '1h', prompt: '', agentName: 'Coordinator' });
    setShowForm(false);
    loadJobs();
  }, [newJob, loadJobs]);

  const handleToggle = useCallback((id: string) => {
    globalCronScheduler.toggleJob(id);
    loadJobs();
  }, [loadJobs]);

  const handleDelete = useCallback((id: string) => {
    globalCronScheduler.removeJob(id);
    loadJobs();
  }, [loadJobs]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-50 w-96 max-h-[70vh] bg-[#050000]/95 backdrop-blur-xl border border-red-900/50 rounded-none clip-angled shadow-[0_0_30px_rgba(200,0,0,0.15)]"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-red-900/30 bg-[#0a0000]">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#ff1a1a]" />
              <h3 className="text-[10px] font-black text-[#ff1a1a] tracking-[0.3em] uppercase font-mono">
                Cron Scheduler
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowForm(!showForm)}
                className="p-1 hover:bg-[#ff1a1a]/10 rounded-sm"
              >
                <Plus size={14} className="text-gray-400 hover:text-[#ff1a1a]" />
              </button>
              <button onClick={onClose} className="p-1 hover:bg-[#ff1a1a]/10 rounded-sm">
                <X className="w-3.5 h-3.5 text-gray-500 hover:text-[#ff1a1a]" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(70vh-45px)] p-2">
            {showForm && (
              <div className="bg-black/40 border border-red-900/20 p-3 mb-2 space-y-2">
                <input
                  value={newJob.name}
                  onChange={e => setNewJob(p => ({ ...p, name: e.target.value }))}
                  placeholder="Job name"
                  className="w-full bg-black/30 border border-red-900/30 rounded-sm px-2 py-1 text-[10px] text-gray-300 font-mono placeholder-gray-700 focus:outline-none"
                />
                <select
                  value={newJob.schedule}
                  onChange={e => setNewJob(p => ({ ...p, schedule: e.target.value }))}
                  className="w-full bg-black/30 border border-red-900/30 rounded-sm px-2 py-1 text-[10px] text-gray-300 font-mono focus:outline-none"
                >
                  <option value="@every_minute">Every minute</option>
                  <option value="@every_5_minutes">Every 5 minutes</option>
                  <option value="1h">Every hour</option>
                  <option value="1d">Every day</option>
                </select>
                <select
                  value={newJob.agentName}
                  onChange={e => setNewJob(p => ({ ...p, agentName: e.target.value }))}
                  className="w-full bg-black/30 border border-red-900/30 rounded-sm px-2 py-1 text-[10px] text-gray-300 font-mono focus:outline-none"
                >
                  <option value="Coordinator">Coordinator</option>
                  <option value="Coder">Coder</option>
                  <option value="Cyn">Cyn</option>
                  <option value="Adso">Adso</option>
                </select>
                <textarea
                  value={newJob.prompt}
                  onChange={e => setNewJob(p => ({ ...p, prompt: e.target.value }))}
                  placeholder="Prompt to run..."
                  className="w-full bg-black/30 border border-red-900/30 rounded-sm px-2 py-1 text-[10px] text-gray-300 font-mono placeholder-gray-700 focus:outline-none resize-none h-16"
                />
                <button
                  onClick={handleAdd}
                  className="w-full py-1.5 text-[10px] font-bold bg-[#ff1a1a]/20 text-[#ff1a1a] rounded-sm hover:bg-[#ff1a1a]/30 transition-colors border border-[#ff1a1a]/30 font-mono uppercase"
                >
                  Add Job
                </button>
              </div>
            )}

            {jobs.length === 0 && !showForm && (
              <div className="text-center py-8 text-gray-600 text-[10px] font-mono">
                No scheduled jobs
              </div>
            )}

            {jobs.map(job => (
              <div key={job.id} className="bg-black/40 border border-red-900/15 px-3 py-2 mb-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-gray-200 font-mono">{job.name}</div>
                    <div className="text-[8px] text-gray-600 font-mono">
                      {job.schedule} · {job.agentName} · {job.runCount} runs
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(job.id)}
                      className="p-1 hover:bg-[#ff1a1a]/10 rounded-sm"
                    >
                      {job.enabled ? <Pause size={12} className="text-emerald-400" /> : <Play size={12} className="text-gray-600" />}
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="p-1 hover:bg-[#ff1a1a]/10 rounded-sm"
                    >
                      <Trash2 size={12} className="text-gray-600 hover:text-[#ff1a1a]" />
                    </button>
                  </div>
                </div>
                {job.nextRun && (
                  <div className="text-[8px] text-gray-500 font-mono mt-1">
                    Next run: {new Date(job.nextRun).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
