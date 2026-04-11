'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, X, Check, ExternalLink, Save, AlertTriangle, Shield,
  Eye, EyeOff, RefreshCw, Plus, Info, Zap, Globe, TrendingUp, BarChart3,
} from 'lucide-react';
import { getApiKeys, saveApiKeys, ApiKeys } from '@/lib/news/api-integrations';

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

interface ApiSource {
  id: keyof ApiKeys;
  name: string;
  description: string;
  url: string;
  freeLimit: string;
  icon: any;
  color: string;
}

const API_SOURCES: ApiSource[] = [
  {
    id: 'marketAux',
    name: 'MarketAux',
    description: 'Financial news with sentiment analysis',
    url: 'https://marketaux.com/',
    freeLimit: '200 req/day',
    icon: TrendingUp,
    color: 'emerald',
  },
  {
    id: 'newsAPI',
    name: 'NewsAPI',
    description: 'Global news articles and headlines',
    url: 'https://newsapi.org/',
    freeLimit: '100 req/day',
    icon: Globe,
    color: 'blue',
  },
  {
    id: 'alphaVantage',
    name: 'Alpha Vantage',
    description: 'Stock, forex, and crypto market data',
    url: 'https://www.alphavantage.co/',
    freeLimit: '25 req/day',
    icon: BarChart3,
    color: 'purple',
  },
  {
    id: 'fred',
    name: 'FRED (Fed)',
    description: 'Economic indicators (GDP, CPI, unemployment)',
    url: 'https://fred.stlouisfed.org/docs/api/api_key.html',
    freeLimit: '120 req/min',
    icon: Zap,
    color: 'orange',
  },
];

export function ApiKeyManager({ isOpen, onClose, onSave }: ApiKeyManagerProps) {
  const [keys, setKeys] = useState<ApiKeys>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const keys = getApiKeys();
      console.log('[API Keys] Loading:', Object.keys(keys).filter(k => keys[k as keyof ApiKeys]).length, 'keys found');
      setKeys(keys);
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = useCallback(() => {
    saveApiKeys(keys);
    setSaved(true);
    onSave?.();
    setTimeout(() => setSaved(false), 3000);
  }, [keys, onSave]);

  const toggleShow = useCallback((id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-2xl bg-[#050000] border border-red-900/50 rounded-none clip-angled shadow-[0_0_40px_rgba(200,0,0,0.15)]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-red-900/30 bg-[#0a0000]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#ff1a1a]" />
                <h2 className="text-[10px] font-black text-[#ff1a1a] tracking-[0.3em] uppercase font-mono">
                  API Key Manager
                </h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-[#ff1a1a]/10 rounded-sm">
                <X className="w-3.5 h-3.5 text-gray-500 hover:text-[#ff1a1a]" />
              </button>
            </div>

            {/* Warning */}
            <div className="flex items-center gap-2 px-5 py-2 bg-yellow-500/5 border-b border-yellow-900/20">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
              <span className="text-[9px] text-yellow-500/80 font-mono">
                Keys stored locally in browser. Never shared or uploaded.
              </span>
            </div>

            {/* API Sources */}
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {API_SOURCES.map(source => {
                const Icon = source.icon;
                const currentKey = keys[source.id] || '';
                const isVisible = showKeys[source.id];

                return (
                  <div
                    key={source.id}
                    className="bg-black/40 border border-red-900/20 rounded-sm p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-[#ff1a1a]" />
                        <div>
                          <div className="text-[10px] font-bold text-gray-200 font-mono">
                            {source.name}
                          </div>
                          <div className="text-[8px] text-gray-600 font-mono">
                            {source.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 text-[7px] font-mono bg-emerald-500/10 text-emerald-400 rounded-sm border border-emerald-500/20">
                          Free: {source.freeLimit}
                        </span>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-0.5 hover:bg-white/5 rounded-sm"
                        >
                          <ExternalLink size={10} className="text-gray-600 hover:text-gray-400" />
                        </a>
                      </div>
                    </div>

                    {/* Key Input */}
                    <div className="flex items-center gap-1">
                      <div className="relative flex-1">
                        <input
                          type={isVisible ? 'text' : 'password'}
                          value={currentKey}
                          onChange={e => setKeys(prev => ({ ...prev, [source.id]: e.target.value }))}
                          placeholder="Enter API key..."
                          className="w-full bg-black/30 border border-red-900/30 rounded-sm pl-8 pr-8 py-1.5 text-[10px] text-gray-300 font-mono placeholder-gray-700 focus:outline-none focus:border-[#ff1a1a]/50"
                        />
                        <Key size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-700" />
                        {currentKey && (
                          <button
                            onClick={() => toggleShow(source.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/5 rounded-sm"
                          >
                            {isVisible ? <EyeOff size={12} className="text-gray-500" /> : <Eye size={12} className="text-gray-500" />}
                          </button>
                        )}
                      </div>
                      {currentKey && (
                        <span className="flex items-center gap-0.5 text-[8px] text-emerald-400 font-mono px-1.5">
                          <Check size={10} /> Set
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-red-900/30 bg-[#0a0000]">
              <div className="text-[8px] text-gray-700 font-mono">
                {Object.values(keys).filter(Boolean).length} of {API_SOURCES.length} keys configured
              </div>
              <div className="flex gap-2">
                {saved && (
                  <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
                    <Check size={12} /> Saved
                  </span>
                )}
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold bg-[#ff1a1a]/20 text-[#ff1a1a] rounded-sm hover:bg-[#ff1a1a]/30 transition-colors border border-[#ff1a1a]/30 font-mono uppercase tracking-wider"
                >
                  <Save size={12} />
                  Save Keys
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
