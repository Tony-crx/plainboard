"use client";

import { motion } from 'framer-motion';

export function TypingIndicator({ agentName }: { agentName: string }) {
  return (
    <div className="flex justify-start mb-6">
       <div className="max-w-[80%] p-4 bg-[#050000] border border-red-900/50 text-red-600 flex items-center gap-3">
         <motion.div 
            className="w-1.5 h-1.5 bg-red-500 rounded-none"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
         />
         <motion.div 
            className="w-1.5 h-1.5 bg-red-500 rounded-none"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
         />
         <motion.div 
            className="w-1.5 h-1.5 bg-red-500 rounded-none"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
         />
         <span className="ml-2 text-[10px] font-mono tracking-widest uppercase">
            {agentName} is computing
         </span>
       </div>
    </div>
  );
}
