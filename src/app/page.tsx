"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Activity, ShieldAlert, Code2, Calculator, MessageSquare, CheckCircle2, Flame, Database, Settings2, Network, UserCog, BookOpen, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { ExportButton } from '@/components/ui/export-button';
import { CostDisplay } from '@/components/ui/cost-display';
import { AgentStatusBadge, AgentStatus } from '@/components/ui/agent-status';
import { MemoryMCP } from '@/components/ui/memory-mcp';
import { AgentConfigurator } from '@/components/ui/agent-configurator';
import { ApiSettingsModal } from '@/components/ui/api-settings';

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

const ALL_PROFILES = [
  { name: "Coordinator", desc: "Master swarm orchestrator", icon: Network, color: "text-purple-500", bg: "bg-purple-950/30", border: "border-purple-900/50", hasTools: true },
  { name: "Triage", desc: "Main coordinator routing system", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-950/30", border: "border-red-900/50", hasTools: false },
  { name: "Coder", desc: "Software engineering logic", icon: Code2, color: "text-red-500", bg: "bg-red-950/30", border: "border-red-900/50", hasTools: true },
  { name: "Math", desc: "Complex computations engine", icon: Calculator, color: "text-red-500", bg: "bg-red-950/30", border: "border-red-900/50", hasTools: false },
  { name: "Cyn", desc: "Anomaly/Cyberops Hacker", icon: UserCog, color: "text-red-500", bg: "bg-red-950/30", border: "border-red-900/50", hasTools: true },
  { name: "Adso", desc: "Clerical Observer/Archivist", icon: BookOpen, color: "text-red-500", bg: "bg-red-950/30", border: "border-red-900/50", hasTools: false }
];

export default function SuperDashboard() {
  const [agentMemories, setAgentMemories] = useState<Record<string, Message[]>>({ "Coordinator": [], "Triage": [], "Coder": [], "Math": [], "Cyn": [], "Adso": [] });
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewingAgent, setViewingAgent] = useState("Coordinator");
  const [activeRoutingAgent, setActiveRoutingAgent] = useState("Coordinator");
  
  const [selectedModel, setSelectedModel] = useState("meta-llama/llama-3.3-70b-instruct:free");
  const [models, setModels] = useState<any[]>([]);
  
  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  
  // Customizations
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [agentOverrides, setAgentOverrides] = useState<Record<string, {name: string, instructions: string}>>({});
  const [enabledAgents, setEnabledAgents] = useState<Record<string, boolean>>({
     "Coordinator": true, "Triage": true, "Coder": true, "Math": true, "Cyn": true, "Adso": true
  });
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMemories, viewingAgent, isLoading]);

  useEffect(() => {
     try {
       const keysArr = JSON.parse(localStorage.getItem('cortisol_api_keys') || '[]');
       setApiKeys(keysArr);
     } catch(e) {}
  }, []);

  useEffect(() => {
     async function fetchModels() {
         try {
             const keyToUse = apiKeys.length > 0 ? apiKeys[0] : '';
             const res = await fetch('/api/models', {
                 headers: keyToUse ? { 'Authorization': `Bearer ${keyToUse}` } : {}
             });
             if(res.ok) {
                 const data = await res.json();
                 setModels(data.models || []);
             }
         } catch(e) {}
     }
     fetchModels();
  }, [apiKeys]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    let targetAgent = viewingAgent;
    // Explicit Mentions override logic (@agent)
    const activeAgentsNames = Object.keys(enabledAgents).filter(k=>enabledAgents[k]);
    for(const name of activeAgentsNames) {
        const checkName = (agentOverrides[name]?.name || name).toLowerCase();
        if(inputMessage.toLowerCase().includes(`@${checkName}`)) {
            targetAgent = name;
            break;
        }
    }

    const userMessage: Message = { role: 'user', content: inputMessage };
    setActiveRoutingAgent(targetAgent);
    setViewingAgent(targetAgent);
    
    const updatedMemories = { ...agentMemories };
    if (!updatedMemories[targetAgent]) updatedMemories[targetAgent] = [];
    updatedMemories[targetAgent] = [...updatedMemories[targetAgent], userMessage];
    
    setAgentMemories(updatedMemories);
    setInputMessage("");
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           agentMemories: updatedMemories, 
           activeAgentName: targetAgent, 
           selectedModel,
           enabledAgents,
           agentOverrides,
           apiKeys
        })
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setAgentMemories(data.agentMemories);
      
      if (data.newAgentName && data.newAgentName !== targetAgent) {
         setActiveRoutingAgent(data.newAgentName);
         setViewingAgent(data.newAgentName);
      }
    } catch (err: any) {
      console.error(err);
      const errMemories = { ...agentMemories };
      errMemories[targetAgent] = [...(errMemories[targetAgent] || []), { role: 'system', content: `[ERROR]: ${err.message}` }];
      setAgentMemories(errMemories);
    } finally {
      setIsLoading(false);
    }
  };

  const currentMessages = agentMemories[viewingAgent] || [];
  const chatMessages = currentMessages.filter(m => m.role === 'user' || (m.role === 'assistant' && !m.tool_calls) || m.role === 'system');
  const viewingAgentName = agentOverrides[viewingAgent]?.name || viewingAgent;

  return (
    <div className="flex h-screen bg-[#000000] overflow-hidden font-sans text-gray-300 relative">
      <div className="aurora-bg"></div>

      {/* LEFT SIDEBAR: Agent Profiles */}
      <div className="w-[320px] h-full flex flex-col z-10 glass-panel border-r border-red-900/40 relative">
        <div className="p-6 pb-4 border-b border-red-900/40 flex flex-col gap-4 bg-black shadow-[0_10px_30px_rgba(255,0,0,0.05)]">
           <div className="flex items-center justify-between">
               <div>
                 <h1 className="text-2xl font-black text-red-600 tracking-tighter flex items-center gap-2">
                   <Flame className="text-red-600" size={24} />
                   CORTISOLBOARD
                 </h1>
                 <p className="text-[9px] text-red-500/80 font-mono tracking-[0.2em] mt-1 uppercase">Secure Engine Active</p>
               </div>
           </div>
           
           <div className="flex gap-2">
               <button 
                  onClick={() => setIsConfigOpen(true)}
                  className="flex-1 bg-black hover:bg-red-950/40 text-[9px] uppercase font-bold tracking-widest px-2 py-3 border border-red-900/50 flex justify-center items-center gap-2 text-red-500 transition-colors"
               >
                  <Settings2 size={12} /> Dasbor
               </button>
               <button 
                  onClick={() => setIsMcpOpen(true)}
                  className="flex-1 bg-black hover:bg-red-950/40 text-[9px] uppercase font-bold tracking-widest px-2 py-3 border border-red-900/50 flex justify-center items-center gap-2 text-red-500 transition-colors"
               >
                  <Database size={12} /> MCP
               </button>
               <button 
                  onClick={() => setIsApiSettingsOpen(true)}
                  className="flex-1 bg-black hover:bg-red-950/40 text-[9px] uppercase font-bold tracking-widest px-2 py-3 border border-red-900/50 flex justify-center items-center gap-2 text-red-500 transition-colors"
               >
                  <Key size={12} /> API Key
               </button>
           </div>
           
           <div>
               <div className="flex justify-between text-[9px] uppercase tracking-widest text-red-800 mb-1">
                   <span>Global Model Override</span>
               </div>
               <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#0a0000] border border-red-900/50 text-red-500 text-[10px] p-2 focus:outline-none focus:border-red-500 uppercase cursor-pointer"
               >
                  {models.length > 0 ? models.map(m => (
                     <option key={m.id} value={m.id}>{m.id}</option>
                  )) : (
                     <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B (Free)</option>
                  )}
               </select>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black">
          <h2 className="text-[11px] font-bold text-red-900 tracking-widest mb-4 mt-2 px-2 uppercase">Core Nodes</h2>
          
          {ALL_PROFILES.map((prof) => {
             const Icon = prof.icon;
             const isViewing = viewingAgent === prof.name;
             const isActiveEngine = activeRoutingAgent === prof.name;
             const msgCount = (agentMemories[prof.name] || []).length;
             const displayName = agentOverrides[prof.name]?.name || prof.name;
             const displayDesc = agentOverrides[prof.name]?.instructions || prof.desc;

             return (
               <motion.div 
                 key={prof.name}
                 whileHover={{ scale: 1.01, x: 2 }}
                 whileTap={{ scale: 0.99 }}
                 onClick={() => setViewingAgent(prof.name)}
                 className={`cursor-pointer rounded-none p-4 transition-all duration-300 relative group overflow-hidden ${
                   isViewing 
                     ? `bg-[#0a0000] border border-red-900/80 border-l-4 border-l-red-600 shadow-[inset_0_0_20px_rgba(255,0,0,0.05)]`
                     : 'bg-black hover:bg-[#110000] border border-transparent hover:border-red-900/30'
                 }`}
               >
                 {isActiveEngine && (
                    <div className="absolute top-3 right-3">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    </div>
                 )}
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-none ${prof.bg} ${prof.border} border ${!enabledAgents[prof.name] && 'opacity-30 grayscale'}`}>
                      <Icon className={prof.color} size={20}/>
                    </div>
                    <div className={`flex-1 ${!enabledAgents[prof.name] && 'opacity-30'}`}>
                      <div className="flex justify-between items-center w-full">
                         <h3 className={`font-bold text-sm tracking-wide ${isViewing ? 'text-red-500' : 'text-gray-500'} ${!enabledAgents[prof.name] && 'line-through'}`}>{displayName.toUpperCase()}</h3>
                         <AgentStatusBadge status={isActiveEngine && isLoading ? 'thinking' : 'idle'} />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-snug pr-2">{displayDesc.substring(0, 50)}...</p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-red-900/80 font-mono">
                         <MessageSquare size={12} /> {msgCount} threads
                      </div>
                    </div>
                 </div>
               </motion.div>
             )
          })}
        </div>
      </div>

      {/* MID SIDEBAR: Traces */}
      <div className="w-[300px] h-full flex flex-col z-10 glass-panel border-r border-red-900/40 bg-black hidden xl:flex">
         <div className="p-4 border-b border-red-900/40 bg-black">
            <h2 className="text-xs font-bold text-red-600 tracking-widest flex items-center gap-2 uppercase"><Activity size={14} className="text-red-600"/> Traces</h2>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px] bg-black">
            <AnimatePresence>
              {currentMessages.filter(m => ['tool', 'system'].includes(m.role) || m.tool_calls).length === 0 && (
                 <div className="text-center text-red-900/50 mt-10 uppercase tracking-widest">Awaiting Ops</div>
              )}
              {currentMessages.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i}
                  className="bg-[#050000] border border-red-900/30 rounded-none p-3"
                >
                   {log.role === 'assistant' && log.tool_calls && (
                     <div className="text-red-400">
                       <span className="text-red-600 font-bold">[{log.name ? log.name.toUpperCase() : 'ACTION'}]</span> Invoking tool: <br/>
                       <span className="text-red-500/80 opacity-80">{log.tool_calls[0].function.name}</span>
                     </div>
                  )}
                  {log.role === 'tool' && (
                     <div className="text-gray-400 mt-2 border-l border-red-800 pl-2">
                       <span className="text-red-600 font-bold opacity-70">[{log.name}]</span><br/> <span className="opacity-70">{log.content?.substring(0,80)}...</span>
                     </div>
                  )}
                  {log.role === 'system' && (
                      <div className="text-orange-500/80 mt-1">
                        <span>[SYS]</span> {log.content?.substring(0, 100)}...
                      </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
         </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 h-full flex flex-col relative z-10 bg-black">
        
        <div className="h-20 border-b border-red-900/40 flex items-center justify-between px-8 bg-black">
           <div className="flex items-center gap-3">
              <span className="text-gray-500 uppercase tracking-widest text-xs">Node Access</span>
              <span className="px-3 py-1 bg-red-950/20 text-red-500 rounded-none text-xs font-bold border border-red-900 glow-text tracking-widest uppercase">
                {viewingAgentName}
              </span>
           </div>
           <div className="flex items-center gap-4">
              <CostDisplay />
              <ExportButton memories={currentMessages} agentName={viewingAgentName} />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-8 relative">
          {chatMessages.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity:1, scale: 1 }} className="h-full flex flex-col items-center justify-center mt-4">
              <div className="p-8 border border-red-900/50 bg-[#0a0000] mb-8 shadow-[0_0_30px_rgba(255,0,0,0.1)]">
                 <ShieldAlert size={80} className="text-red-600 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]"/>
              </div>
              <h2 className="text-red-600 text-3xl font-black tracking-tighter mb-2 uppercase">Memory Core: {viewingAgentName}</h2>
              <p className="text-red-800 text-xs tracking-widest uppercase text-center max-w-md mt-4">Restricted access protocol engaged. Thread isolated. Use @mention to explicitly pass prompts.</p>
            </motion.div>
          )}

          {chatMessages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={i}
              className={`mb-8 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'system' ? (
                 <div className="w-full flex justify-center my-6">
                    <span className="text-[10px] bg-red-950 text-red-500 px-4 py-2 font-mono border border-red-900 flex items-center gap-2 uppercase tracking-widest">
                       <CheckCircle2 size={12}/> Handoff Established
                    </span>
                 </div>
              ) : (
                <div className="flex flex-col max-w-[85%]">
                   {msg.role === 'assistant' && (
                       <span className="text-[9px] text-red-500/70 uppercase tracking-widest font-bold mb-1 ml-1 flex items-center gap-2">
                          [RESPONDER: {msg.name || viewingAgentName}]
                       </span>
                   )}
                   <div className={`p-6 text-sm ${
                     msg.role === 'user' 
                       ? 'bg-gradient-to-br from-[#1a0000] to-[#0a0000] text-gray-200 border-l-2 border-l-red-600 border-t border-t-red-950 border-r border-r-red-950 shadow-[0_0_15px_rgba(255,0,0,0.1)]'
                       : 'bg-[#050505] border border-red-900/30 text-gray-400 shadow-[2px_2px_0px_rgba(139,0,0,0.2)] leading-relaxed whitespace-pre-wrap font-mono'
                   }`}>
                     {msg.content}
                   </div>
                </div>
              )}
            </motion.div>
          ))}
          
          {isLoading && viewingAgent === activeRoutingAgent && (
             <TypingIndicator agentName={(agentOverrides[activeRoutingAgent]?.name || activeRoutingAgent)} />
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Bar */}
        <div className="p-8 w-full max-w-4xl mx-auto bg-black border-t border-red-900/40">
          <div className="relative flex items-center group">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={`COMMAND_PROMPT > ${viewingAgentName} (use @agent to override)...`}
              className="w-full bg-[#0a0000] border-2 border-red-900/30 focus:border-red-600 text-red-100 placeholder-red-900/50 font-mono text-sm px-6 py-5 pr-16 focus:outline-none transition-all shadow-[inset_0_0_10px_rgba(0,0,0,1)]"
              disabled={isLoading}
            />
            <button 
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="absolute right-3 p-3 bg-red-950 hover:bg-red-900 text-red-500 transition-all disabled:opacity-30 disabled:hover:bg-red-950 border border-red-900"
            >
              <Send size={18} className={!isLoading && inputMessage.trim() ? 'drop-shadow-[0_0_5px_rgba(255,0,0,1)]' : ''} />
            </button>
          </div>
        </div>

      </div>
      
      {/* Modals */}
      <AnimatePresence>
         {isMcpOpen && <MemoryMCP isOpen={isMcpOpen} onClose={() => setIsMcpOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
         {isConfigOpen && <AgentConfigurator frontendProfiles={ALL_PROFILES} enabledAgents={enabledAgents} setEnabledAgents={setEnabledAgents} agentOverrides={agentOverrides} setAgentOverrides={setAgentOverrides} isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
         {isApiSettingsOpen && <ApiSettingsModal isOpen={isApiSettingsOpen} onClose={() => setIsApiSettingsOpen(false)} onSave={setApiKeys} />}
      </AnimatePresence>
    </div>
  );
}
