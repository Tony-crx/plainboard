"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, TestTube, Trash2, Copy } from 'lucide-react';

interface AgentConfig {
  name: string;
  instructions: string;
  model: string;
  tools: string[];
  temperature: number;
  maxTokens: number;
}

interface AgentCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: AgentConfig) => void;
  existingAgents: string[];
}

const AVAILABLE_TOOLS = [
  'webSearch',
  'fileOps',
  'terminalOps',
  'codeExecutor',
  'memoryAccess',
  'agentDelegation'
];

const AVAILABLE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-31b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-3-sonnet'
];

export function AgentCreator({ isOpen, onClose, onSave, existingAgents }: AgentCreatorProps) {
  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    instructions: '',
    model: AVAILABLE_MODELS[0],
    tools: [],
    temperature: 0.7,
    maxTokens: 2048
  });

  const [testOutput, setTestOutput] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = () => {
    if (!config.name.trim()) return;
    onSave(config);
    onClose();
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestOutput('Testing agent configuration...\n');

    // Simulate test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setTestOutput(prev => prev + `
✓ Agent name: ${config.name}
✓ Instructions length: ${config.instructions.length} chars
✓ Model: ${config.model}
✓ Tools: ${config.tools.join(', ') || 'None'}
✓ Temperature: ${config.temperature}
✓ Max tokens: ${config.maxTokens}

Test Result: Configuration valid!
    `);
    setIsTesting(false);
  };

  const toggleTool = (tool: string) => {
    setConfig(prev => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool]
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-3xl max-h-[90vh] bg-[#050000] border border-red-900/50 rounded-lg overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-red-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plus size={20} className="text-red-500" />
              <h2 className="text-lg font-black text-red-500 tracking-widest uppercase">Create Custom Agent</h2>
            </div>
            <button onClick={onClose} className="p-1.5 border border-red-900/30 text-red-800 hover:text-[#ff1a1a] transition-colors">
              ✕
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Agent Name */}
            <div>
              <label className="text-[9px] text-red-600/70 uppercase font-bold tracking-wider block mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                value={config.name}
                onChange={e => setConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., DataAnalyst"
                className="w-full bg-black/40 border border-red-900/30 rounded px-4 py-2 text-[11px] text-gray-300 font-mono placeholder:text-red-900/50 focus:border-[#ff1a1a] outline-none"
              />
              {existingAgents.includes(config.name) && (
                <p className="text-[9px] text-red-500 mt-1">Name already exists</p>
              )}
            </div>

            {/* Instructions */}
            <div>
              <label className="text-[9px] text-red-600/70 uppercase font-bold tracking-wider block mb-2">
                System Instructions *
              </label>
              <textarea
                value={config.instructions}
                onChange={e => setConfig(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Define the agent's role, behavior, and capabilities..."
                rows={6}
                className="w-full bg-black/40 border border-red-900/30 rounded px-4 py-2 text-[11px] text-gray-300 font-mono placeholder:text-red-900/50 focus:border-[#ff1a1a] outline-none resize-none"
              />
              <p className="text-[8px] text-red-900 mt-1">{config.instructions.length} characters</p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="text-[9px] text-red-600/70 uppercase font-bold tracking-wider block mb-2">
                LLM Model
              </label>
              <select
                value={config.model}
                onChange={e => setConfig(prev => ({ ...prev, model: e.target.value }))}
                className="w-full bg-black/40 border border-red-900/30 rounded px-4 py-2 text-[11px] text-gray-300 font-mono focus:border-[#ff1a1a] outline-none"
              >
                {AVAILABLE_MODELS.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {/* Tools */}
            <div>
              <label className="text-[9px] text-red-600/70 uppercase font-bold tracking-wider block mb-2">
                Available Tools
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_TOOLS.map(tool => (
                  <button
                    key={tool}
                    onClick={() => toggleTool(tool)}
                    className={`px-3 py-2 border rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
                      config.tools.includes(tool)
                        ? 'border-[#ff1a1a] text-[#ff1a1a] bg-red-950/30'
                        : 'border-red-900/30 text-red-900 hover:text-red-500'
                    }`}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature */}
            <div>
              <label className="text-[9px] text-red-600/70 uppercase font-bold tracking-wider block mb-2">
                Temperature: {config.temperature.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={config.temperature}
                onChange={e => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="w-full accent-red-500"
              />
              <div className="flex justify-between text-[8px] text-red-900 mt-1">
                <span>Precise (0)</span>
                <span>Creative (2)</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="text-[9px] text-red-600/70 uppercase font-bold tracking-wider block mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={config.maxTokens}
                onChange={e => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                className="w-full bg-black/40 border border-red-900/30 rounded px-4 py-2 text-[11px] text-gray-300 font-mono focus:border-[#ff1a1a] outline-none"
              />
            </div>

            {/* Test Output */}
            {testOutput && (
              <div className="p-4 bg-black/60 border border-red-900/30 rounded font-mono text-[10px] text-green-400 whitespace-pre-wrap">
                {testOutput}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-red-900/30 px-6 py-4 flex gap-3">
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="px-4 py-2 border border-orange-900/30 text-orange-500 hover:border-orange-500 transition-colors text-[10px] font-mono uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
            >
              <TestTube size={14} />
              {isTesting ? 'Testing...' : 'Test Config'}
            </button>
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-4 py-2 border border-red-900/30 text-red-500 hover:border-red-500 transition-colors text-[10px] font-mono uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!config.name.trim() || !config.instructions.trim()}
              className="px-6 py-2 bg-red-950/40 border border-red-900/50 text-red-500 hover:bg-red-900/40 hover:border-[#ff1a1a] transition-colors text-[10px] font-mono uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={14} />
              Create Agent
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
