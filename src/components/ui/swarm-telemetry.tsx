import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleNetwork } from './particle-network';

export function SwarmTelemetry({ 
   isOpen, 
   onClose, 
   activeAgentsNames, 
   enabledAgents 
}: { 
   isOpen: boolean, 
   onClose: () => void,
   activeAgentsNames: string[],
   enabledAgents: Record<string, boolean>
}) {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    let interval: any;
    if (isOpen) {
      const fetchMetrics = async () => {
         try {
             const res = await fetch('/api/metrics');
             if(res.ok) setMetrics(await res.json());
         } catch(e) {}
      };
      fetchMetrics();
      interval = setInterval(fetchMetrics, 2000); // Live poll
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 h-full w-[600px] bg-black/90 backdrop-blur-3xl border-l-2 border-red-900/50 p-6 shadow-2xl shadow-red-900/20 text-red-500 font-mono flex flex-col z-50 overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-6 border-b border-red-900/50 pb-4">
          <h2 className="text-xl font-bold tracking-widest glow-text uppercase">Swarm Telemetry</h2>
          <button onClick={onClose} className="text-red-900 hover:text-red-400 font-bold text-2xl transition-colors">×</button>
      </div>

      <div className="flex flex-col gap-8">
          {/* Global Load */}
          <div className="p-4 border border-red-900/30 bg-red-950/10 rounded-sm">
             <h3 className="text-[10px] uppercase text-gray-500 tracking-widest mb-3">API Load Accumulation</h3>
             <div className="text-4xl font-light tracking-tighter glow-text">
                ${metrics?.totalCost ? metrics.totalCost.toFixed(6) : "0.000000"}
             </div>
             <p className="text-[8px] text-red-900 mt-2 uppercase tracking-widest">Aggregated Compute Exhaust</p>
          </div>

          {/* Node Status Matrix */}
          <div className="flex-grow flex flex-col min-h-[300px]">
              <h3 className="text-xs uppercase text-gray-400 tracking-widest mb-4 border-b border-red-900/30 pb-2 flex justify-between">
                 <span>Active Node Topology Trace</span>
                 <span className="text-red-600 glow-text">{activeAgentsNames.length} Nodes Routing</span>
              </h3>
              
              <div className="relative w-full h-full flex-grow rounded-md border border-red-900/50 overflow-hidden shadow-[0_0_20px_rgba(255,0,0,0.1)] mb-4">
                 <ParticleNetwork activeAgents={activeAgentsNames.length} totalAgents={Object.keys(enabledAgents).length} />
                 
                 {/* Floating Labels over the canvas */}
                 <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                     {Object.keys(enabledAgents).map((node) => {
                         const isEnabled = enabledAgents[node];
                         const isFiring = activeAgentsNames.includes(node);
                         if (!isEnabled) return null;
                         return (
                             <div key={node} className="flex items-center gap-2 text-[10px] bg-black/60 px-2 py-1 rounded-sm backdrop-blur-md border border-white/5">
                                <div className={`w-1.5 h-1.5 rounded-full ${isFiring ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-gray-600'}`}/>
                                <span className={isFiring ? 'text-white glow-text' : 'text-gray-400'}>{node}</span>
                             </div>
                         )
                     })}
                 </div>
              </div>
          </div>
          
          {/* Models Burn */}
          {metrics?.byModel && (
             <div className="mt-4">
                 <h3 className="text-xs uppercase text-gray-400 tracking-widest mb-4 border-b border-red-900/30 pb-2">Model Compute Trace</h3>
                 <ul className="flex flex-col gap-2">
                    {Object.entries(metrics.byModel).map(([modelName, cost]: any) => (
                       <li key={modelName} className="flex justify-between text-[10px] text-red-800 border-l-2 border-red-900/30 pl-2 py-1">
                          <span className="truncate w-3/4" title={modelName}>{modelName.split('/').pop()}</span>
                          <span>${cost.toFixed(4)}</span>
                       </li>
                    ))}
                 </ul>
             </div>
          )}

      </div>
    </motion.div>
  );
}
