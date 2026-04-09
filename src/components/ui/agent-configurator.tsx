"use client";

import { Settings, X, ShieldAlert, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function AgentConfigurator({ 
   isOpen, 
   onClose,
   frontendProfiles,
   enabledAgents,
   setEnabledAgents,
   agentOverrides,
   setAgentOverrides
}: { 
   isOpen: boolean, 
   onClose: () => void,
   frontendProfiles: any[],
   enabledAgents: Record<string, boolean>,
   setEnabledAgents: (v: any) => void,
   agentOverrides: Record<string, {name: string, instructions: string}>,
   setAgentOverrides: (v: any) => void
}) {
  
  const [editingAgent, setEditingAgent] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
       <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         exit={{ opacity: 0, scale: 0.95 }}
         className="w-full max-w-5xl max-h-[90vh] flex flex-col glass-panel bg-[#050000] border-2 border-red-900 shadow-[0_0_50px_rgba(255,0,0,0.15)]"
       >
          <div className="p-4 border-b border-red-900/50 flex justify-between items-center bg-[#0a0000]">
             <h2 className="text-red-500 font-black tracking-widest flex items-center gap-2 uppercase">
                <Settings className="text-red-600" />
                DASHBOARD UI: Profiler AI
             </h2>
             <button onClick={onClose} className="p-1 hover:bg-red-950 text-red-500 transition-colors">
                <X size={20} />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
             <div className="p-4 bg-red-950/20 border border-red-900/50 flex gap-3 text-red-500 text-xs tracking-widest uppercase">
                 <ShieldAlert size={16} />
                 Modify agent parameters directly. Changes persist in local execution context. Disable unwanted nodes to optimize the swarm.
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-6">
                {frontendProfiles.map((prof) => {
                   const override = agentOverrides[prof.name] || {};
                   const displayName = override.name || prof.name;
                   const displayDesc = override.instructions || prof.desc;
                   
                   return (
                   <div key={prof.name} className={`p-4 border ${enabledAgents[prof.name] ? 'border-red-600 bg-[#0a0000]' : 'border-red-900/40 bg-black opacity-50 grayscale'}`}>
                       <div className="flex justify-between items-center mb-3 pb-2 border-b border-red-900/30">
                          <div className="flex items-center gap-2">
                             <prof.icon size={16} className="text-red-600" /> 
                             {editingAgent === prof.name ? (
                                <input 
                                   autoFocus
                                   type="text" 
                                   value={displayName} 
                                   onChange={(e) => setAgentOverrides({ ...agentOverrides, [prof.name]: { ...override, name: e.target.value } })}
                                   className="bg-black border border-red-900 px-2 py-1 text-red-500 text-sm font-bold w-32 focus:outline-none"
                                />
                             ) : (
                                <span className="font-bold text-red-500 uppercase tracking-widest">{displayName}</span>
                             )}
                             <button onClick={() => setEditingAgent(editingAgent === prof.name ? null : prof.name)} className="text-red-900 hover:text-red-500 ml-2">
                                <Edit2 size={12} />
                             </button>
                          </div>
                          
                          <button 
                             onClick={() => setEnabledAgents((p:any) => ({...p, [prof.name]: !p[prof.name]}))}
                             className={`px-3 py-1 text-[10px] font-bold border uppercase tracking-widest ${enabledAgents[prof.name] ? 'bg-red-600 text-black border-red-600' : 'bg-transparent text-red-700 border-red-900/50'}`}
                          >
                             {enabledAgents[prof.name] ? 'ONLINE' : 'OFFLINE'}
                          </button>
                       </div>

                       {editingAgent === prof.name ? (
                           <textarea
                               value={displayDesc}
                               onChange={(e) => setAgentOverrides({ ...agentOverrides, [prof.name]: { ...override, instructions: e.target.value } })}
                               className="w-full h-24 bg-black border border-red-900 p-2 text-xs font-mono text-gray-400 focus:border-red-600 focus:outline-none mb-3"
                               placeholder="Set custom system directions..."
                           />
                       ) : (
                           <p className="text-xs font-mono text-gray-500 leading-relaxed mb-4 h-16 overflow-y-auto pr-1">
                              {displayDesc}
                           </p>
                       )}
                       
                       <div className="text-[10px] uppercase font-mono tracking-widest text-red-900/80 mt-2">
                          {prof.hasTools ? '[ EQUIP ] : Full Core Access' : '[ EQUIP ] : Restricted Routing'}
                       </div>
                   </div>
                )})}
             </div>
          </div>
       </motion.div>
    </div>
  );
}
