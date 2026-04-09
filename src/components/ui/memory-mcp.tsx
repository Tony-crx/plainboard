"use client";

import { useState } from 'react';
import { Database, Trash2, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function MemoryMCP({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const fetchMemories = async () => {
     setLoading(true);
     try {
       const res = await fetch(`/api/memory?q=${encodeURIComponent(query)}`);
       const data = await res.json();
       setMemories(data.memories || []);
     } catch (e) {
       console.error(e);
     } finally {
       setLoading(false);
     }
  };

  const clearAllMemories = async () => {
    if (!confirm("CRITICAL WARNING: This will permanently wipe all long-term vector memory cores across all agents. Proceed?")) return;
    try {
        await fetch('/api/memory', { method: 'DELETE' });
        setMemories([]);
        alert("Memory core purged successfully.");
    } catch(e) { console.error(e); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
       <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         exit={{ opacity: 0, scale: 0.95 }}
         className="w-full max-w-4xl max-h-[80vh] flex flex-col glass-panel bg-[#050000] border-2 border-red-900 shadow-[0_0_50px_rgba(255,0,0,0.15)]"
       >
          <div className="p-4 border-b border-red-900/50 flex justify-between items-center bg-[#0a0000]">
             <h2 className="text-red-500 font-black tracking-widest flex items-center gap-2 uppercase">
                <Database className="text-red-600" />
                MCP: Vector Memory Control
             </h2>
             <button onClick={onClose} className="p-1 hover:bg-red-950 text-red-500 transition-colors">
                <X size={20} />
             </button>
          </div>

          <div className="p-4 flex gap-4 border-b border-red-900/30 items-center">
             <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search semantic tags or content..."
                className="flex-1 bg-black border border-red-900 p-2 text-sm text-red-50 focus:outline-none focus:border-red-500"
                onKeyDown={(e) => e.key === 'Enter' && fetchMemories()}
             />
             <button 
                onClick={fetchMemories} 
                className="bg-red-950 px-4 py-2 border border-red-900 text-red-500 hover:bg-red-900 text-sm font-bold flex gap-2 items-center tracking-widest uppercase"
             >
                <Search size={14} /> Scan
             </button>
             <button 
                onClick={clearAllMemories}
                className="bg-[#ff0000]/10 px-4 py-2 border border-[#ff0000]/50 text-[#ff0000] hover:bg-[#ff0000]/20 text-sm font-bold flex gap-2 items-center tracking-widest uppercase"
             >
                <Trash2 size={14} /> Purge All
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs text-gray-400">
             {loading && <div className="text-red-600 animate-pulse tracking-widest uppercase">Querying Databanks...</div>}
             {!loading && memories.length === 0 && <div className="text-center mt-10 text-red-900/50 tracking-widest uppercase">No Memories Found</div>}
             
             {memories.map((m, i) => (
                <div key={m.id || i} className="p-3 bg-[#0a0000] border border-red-900/20 hover:border-red-900/60 flex flex-col gap-1">
                   <div className="flex justify-between text-[10px] text-red-800 font-bold tracking-widest uppercase">
                      <span>Agent: {m.agentName} | Prio: {m.priority}</span>
                      <span>{new Date(m.timestamp).toLocaleString()}</span>
                   </div>
                   <div className="text-gray-300 mt-1 whitespace-pre-wrap">{m.content}</div>
                </div>
             ))}
          </div>
       </motion.div>
    </div>
  );
}
