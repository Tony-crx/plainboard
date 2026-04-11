"use client";

import { useState, useEffect } from 'react';
import { X, Cpu, Zap, RefreshCw, Check, DollarSign, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

type ProviderType = 'openrouter' | 'groq';
type TierType = 'free' | 'paid' | 'all';

interface Model {
  id: string;
  name?: string;
  pricing?: { prompt?: string; completion?: string };
}

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export function ModelSelectorModal({ isOpen, onClose, selectedModel, onSelectModel }: ModelSelectorModalProps) {
  const [provider, setProvider] = useState<ProviderType>('openrouter');
  const [tier, setTier] = useState<TierType>('all');
  const [openRouterModels, setOpenRouterModels] = useState<Model[]>([]);
  const [groqModels, setGroqModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModelDetail, setSelectedModelDetail] = useState<Model | null>(null);

  const loadModels = async (providerType: ProviderType, tierType: TierType = 'all') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/models?provider=${providerType}&tier=${tierType}`);
      if (res.ok) {
        const data = await res.json();
        if (providerType === 'openrouter') {
          setOpenRouterModels(data.models || []);
        } else {
          setGroqModels(data.models || []);
        }
      }
    } catch (e) {
      console.error(`Failed to load ${providerType} models:`, e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadModels('openrouter', tier);
      loadModels('groq');
    }
  }, [isOpen]);

  // Reload models when tier changes
  useEffect(() => {
    if (isOpen && provider === 'openrouter') {
      loadModels('openrouter', tier);
    }
  }, [tier]);

  const currentModels = provider === 'openrouter' ? openRouterModels : groqModels;

  const isFreeModel = (model: Model) => {
    if (provider === 'openrouter') {
      return model.pricing?.prompt === "0" || model.id.endsWith(':free');
    }
    return true;
  };

  const filteredModels = currentModels.filter(m => {
    const matchesSearch = m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const formatPrice = (price: string | undefined) => {
    if (!price || price === "0") return 'Free';
    const num = parseFloat(price);
    if (num < 0.000001) return `$${(num * 1000000).toFixed(2)}/M`;
    if (num < 0.001) return `$${(num * 1000).toFixed(3)}/K`;
    return `$${num.toFixed(4)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl flex flex-col glass-panel bg-[#050000] border-2 border-red-900 shadow-[0_0_50px_rgba(255,0,0,0.15)] max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-3 border-b border-red-900/50 flex justify-between items-center bg-[#0a0000]">
          <h2 className="text-red-500 font-black tracking-widest flex items-center gap-2 uppercase text-sm">
            <Cpu className="text-red-600" size={16} />
            AI Model Selector
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-red-950 text-red-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          {/* Provider & Tier Tabs */}
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <button
                onClick={() => setProvider('openrouter')}
                className={`flex-1 p-2 border font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-1 ${provider === 'openrouter'
                  ? 'border-red-500 bg-red-950/50 text-red-500'
                  : 'border-red-900/30 bg-[#0a0000] text-red-900 hover:border-red-900/60'
                  }`}
              >
                <Zap size={12} />
                OpenRouter
              </button>
              <button
                onClick={() => setProvider('groq')}
                className={`flex-1 p-2 border font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-1 ${provider === 'groq'
                  ? 'border-red-500 bg-red-950/50 text-red-500'
                  : 'border-red-900/30 bg-[#0a0000] text-red-900 hover:border-red-900/60'
                  }`}
              >
                <Zap size={12} />
                Groq
              </button>
            </div>
            <button
              onClick={() => loadModels(provider, tier)}
              disabled={isLoading}
              className="px-3 border border-red-900/50 bg-[#0a0000] text-red-500 hover:bg-red-950/40 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Tier Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setTier('all')}
              className={`flex-1 p-2 border font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-1 ${tier === 'all'
                ? 'border-red-500 bg-red-950/50 text-red-500'
                : 'border-red-900/30 bg-[#0a0000] text-red-900 hover:border-red-900/60'
                }`}
            >
              All ({currentModels.length})
            </button>
            <button
              onClick={() => setTier('free')}
              className={`flex-1 p-2 border font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-1 ${tier === 'free'
                ? 'border-green-500 bg-green-950/50 text-green-500'
                : 'border-red-900/30 bg-[#0a0000] text-red-900 hover:border-red-900/60'
                }`}
            >
              <Gift size={10} /> Free ({currentModels.filter(isFreeModel).length})
            </button>
            <button
              onClick={() => setTier('paid')}
              className={`flex-1 p-2 border font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-1 ${tier === 'paid'
                ? 'border-yellow-500 bg-yellow-950/50 text-yellow-500'
                : 'border-red-900/30 bg-[#0a0000] text-red-900 hover:border-red-900/60'
                }`}
            >
              <DollarSign size={10} /> Paid ({currentModels.filter(m => !isFreeModel(m)).length})
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models..."
            className="w-full bg-black border border-red-900 p-2 text-red-50 focus:outline-none focus:border-red-500 font-mono text-xs"
          />

          {/* Models Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[55vh] overflow-y-auto pr-2">
            {isLoading && currentModels.length === 0 ? (
              <div className="col-span-full text-center py-8 text-red-900 uppercase tracking-widest text-xs">
                Loading models...
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="col-span-full text-center py-8 text-red-900/50 uppercase tracking-widest text-xs">
                No models found
              </div>
            ) : (
              filteredModels.map((model) => {
                const isSelected = selectedModel === model.id;
                const isFree = isFreeModel(model);

                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModelDetail(model)}
                    className={`p-3 border text-left transition-all relative ${isSelected
                      ? 'border-red-500 bg-red-950/50 shadow-[0_0_15px_rgba(255,0,0,0.15)]'
                      : 'border-red-900/30 bg-[#0a0000] hover:border-red-900/60'
                      }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <Check size={14} className="text-red-500" />
                      </div>
                    )}

                    <div className="pr-5">
                      <div className="text-red-50 text-[11px] font-bold font-mono truncate">
                        {model.name || model.id.split('/').pop()}
                      </div>
                      <div className="text-red-800 font-mono text-[8px] mt-0.5 truncate">
                        {model.id}
                      </div>

                      {/* Pricing Info */}
                      {provider === 'openrouter' && model.pricing && (
                        <div className="mt-1 flex flex-col gap-0.5">
                          <div className="text-[8px] font-mono text-red-700">
                            Input: {formatPrice(model.pricing.prompt)}
                          </div>
                          <div className="text-[8px] font-mono text-red-700">
                            Output: {formatPrice(model.pricing.completion)}
                          </div>
                        </div>
                      )}

                      {/* Tier Badge */}
                      <div className="mt-1">
                        {isFree ? (
                          <span className="px-1.5 py-0.5 bg-green-950/50 border border-green-900/50 text-green-600 text-[8px] uppercase tracking-wider font-bold flex items-center gap-0.5 w-fit">
                            <Gift size={8} /> Free
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-yellow-950/50 border border-yellow-900/50 text-yellow-600 text-[8px] uppercase tracking-wider font-bold flex items-center gap-0.5 w-fit">
                            <DollarSign size={8} /> Paid
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Selected Model Info */}
          <div className="bg-red-950/20 p-2 border border-red-900/40">
            <div className="text-[8px] uppercase tracking-widest text-red-800">Selected Model</div>
            <div className="text-red-500 font-mono text-[10px] truncate">{selectedModel}</div>
          </div>
        </div>
      </motion.div>

      {/* Model Detail Modal */}
      {selectedModelDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-2xl flex flex-col glass-panel bg-[#050000] border-2 border-red-900 shadow-[0_0_50px_rgba(255,0,0,0.15)]"
          >
            {/* Header */}
            <div className="p-4 border-b border-red-900/50 flex justify-between items-center bg-[#0a0000]">
              <h3 className="text-red-500 font-black tracking-widest flex items-center gap-2 uppercase text-sm">
                <Cpu className="text-red-600" size={18} />
                Model Details
              </h3>
              <button onClick={() => setSelectedModelDetail(null)} className="p-1 hover:bg-red-950 text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Model Name */}
              <div>
                <div className="text-[9px] uppercase tracking-widest text-red-800 mb-1">Model Name</div>
                <div className="text-red-50 font-bold text-lg">{selectedModelDetail.name || selectedModelDetail.id}</div>
                <div className="text-red-800 font-mono text-xs mt-1">{selectedModelDetail.id}</div>
              </div>

              {/* Pricing */}
              {provider === 'openrouter' && selectedModelDetail.pricing && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black p-3 border border-red-900/30">
                    <div className="text-[9px] uppercase tracking-widest text-red-800 mb-1">Input Price</div>
                    <div className="text-red-500 font-mono text-sm font-bold">
                      {formatPrice(selectedModelDetail.pricing.prompt)}
                    </div>
                    <div className="text-red-900 text-[9px] mt-0.5">per token</div>
                  </div>
                  <div className="bg-black p-3 border border-red-900/30">
                    <div className="text-[9px] uppercase tracking-widest text-red-800 mb-1">Output Price</div>
                    <div className="text-red-500 font-mono text-sm font-bold">
                      {formatPrice(selectedModelDetail.pricing.completion)}
                    </div>
                    <div className="text-red-900 text-[9px] mt-0.5">per token</div>
                  </div>
                </div>
              )}

              {/* Tier Badge */}
              <div className="flex justify-center">
                {isFreeModel(selectedModelDetail) ? (
                  <span className="px-4 py-2 bg-green-950/50 border border-green-900/50 text-green-600 text-sm uppercase tracking-widest font-bold flex items-center gap-2">
                    <Gift size={16} /> Free Tier Model
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-yellow-950/50 border border-yellow-900/50 text-yellow-600 text-sm uppercase tracking-widest font-bold flex items-center gap-2">
                    <DollarSign size={16} /> Paid Tier Model
                  </span>
                )}
              </div>

              {/* Provider Badge */}
              {provider === 'groq' && (
                <div className="flex justify-center">
                  <span className="px-4 py-2 bg-blue-950/50 border border-blue-900/50 text-blue-600 text-sm uppercase tracking-widest font-bold">
                    Powered by Groq
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-red-900/30">
                <button
                  onClick={() => setSelectedModelDetail(null)}
                  className="flex-1 p-3 border border-red-900/50 bg-[#0a0000] text-red-500 hover:bg-red-950/40 font-bold uppercase tracking-widest text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onSelectModel(selectedModelDetail.id);
                    setSelectedModelDetail(null);
                  }}
                  className="flex-1 p-3 bg-red-950 border border-red-900 text-red-500 hover:bg-red-900 font-bold uppercase tracking-widest text-sm transition-all"
                >
                  Use This Model
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
