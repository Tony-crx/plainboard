"use client";

import { useState, useEffect } from 'react';
import { Key, X, Plus, Trash2, KeySquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ApiSettingsModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (keys: string[]) => void }) {
  const [keys, setKeys] = useState<string[]>([]);
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
     try {
       const stored = localStorage.getItem('cortisol_api_keys');
       if (stored) setKeys(JSON.parse(stored));
     } catch(e) {}
  }, [isOpen]);

  const addKey = () => {
     if (!newKey.trim()) return;
     const updated = [...keys, newKey.trim()];
     setKeys(updated);
     setNewKey('');
     localStorage.setItem('cortisol_api_keys', JSON.stringify(updated));
     onSave(updated);
  };

  const removeKey = (idx: number) => {
     const updated = keys.filter((_, i) => i !== idx);
     setKeys(updated);
     localStorage.setItem('cortisol_api_keys', JSON.stringify(updated));
     onSave(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
       <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         exit={{ opacity: 0, scale: 0.95 }}
         className="w-full max-w-2xl flex flex-col glass-panel bg-[#050000] border-2 border-red-900 shadow-[0_0_50px_rgba(255,0,0,0.15)]"
       >
          <div className="p-4 border-b border-red-900/50 flex justify-between items-center bg-[#0a0000]">
             <h2 className="text-red-500 font-black tracking-widest flex items-center gap-2 uppercase">
                <Key className="text-red-600" />
                API Credentials (OpenRouter)
             </h2>
             <button onClick={onClose} className="p-1 hover:bg-red-950 text-red-500 transition-colors">
                <X size={20} />
             </button>
          </div>

          <div className="p-6 space-y-6">
             <div className="bg-red-950/20 p-4 border border-red-900/40 text-red-500 text-xs tracking-widest font-mono uppercase">
                Warning: Keys injected here take priority over system env variables. Stored purely in local browser memory.
             </div>

             <div className="flex gap-2">
                 <input 
                    type="password"
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="flex-1 bg-black border border-red-900 p-3 text-red-50 focus:outline-none focus:border-red-500 font-mono text-xs shadow-[inset_0_0_10px_rgba(0,0,0,1)]"
                 />
                 <button 
                    onClick={addKey}
                    className="bg-red-950 px-6 border border-red-900 text-red-500 hover:bg-red-900 font-bold uppercase tracking-widest flex items-center gap-2"
                 >
                    <Plus size={16} /> Inject
                 </button>
             </div>

             <div className="space-y-2 mt-4 font-mono text-sm max-h-[30vh] overflow-y-auto pr-2">
                 {keys.length === 0 && <div className="text-red-900/50 text-center py-4 uppercase tracking-widest text-xs">No local keys injected. System defaults active.</div>}
                 {keys.map((k, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border border-red-900/30 bg-[#0a0000]">
                       <div className="flex items-center gap-3 text-red-600/80">
                          <KeySquare size={14} />
                          <span className="text-xs">{k.substring(0, 15)}...{k.substring(k.length-4)}</span>
                       </div>
                       <button onClick={() => removeKey(i)} className="text-red-900 hover:text-[#ff0000] p-1"><Trash2 size={16}/></button>
                    </div>
                 ))}
             </div>
          </div>
       </motion.div>
    </div>
  );
}
