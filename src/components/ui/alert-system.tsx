"use client";

import { useState, useEffect } from 'react';
import { Bell, BellOff, Plus, Trash2, Play, Pause, AlertTriangle } from 'lucide-react';

export interface Alert {
  id: string;
  symbol: string;
  type: 'price_above' | 'price_below' | 'volume_spike' | 'news_keyword';
  value: number | string;
  active: boolean;
  triggered: boolean;
  createdAt: string;
  triggeredAt?: string;
  notification?: string;
}

interface AlertSystemProps {
  loading: boolean;
}

export function AlertSystem({ loading }: AlertSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', symbol: 'BBCA', type: 'price_above', value: 11000, active: true, triggered: false, createdAt: '2026-04-10' },
    { id: '2', symbol: 'BBRI', type: 'price_below', value: 9500, active: true, triggered: false, createdAt: '2026-04-09' },
    { id: '3', symbol: 'TLKM', type: 'volume_spike', value: 3, active: true, triggered: false, createdAt: '2026-04-08' },
    { id: '4', symbol: '', type: 'news_keyword', value: 'sukuk', active: false, triggered: false, createdAt: '2026-04-07' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    type: 'price_above' as Alert['type'],
    value: '',
  });

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading alerts...</div>;
  }

  const addAlert = () => {
    if (!newAlert.symbol && newAlert.type !== 'news_keyword') return;
    if (!newAlert.value) return;

    const alert: Alert = {
      id: Date.now().toString(),
      symbol: newAlert.symbol.toUpperCase(),
      type: newAlert.type,
      value: newAlert.type === 'news_keyword' ? newAlert.value : parseFloat(newAlert.value),
      active: true,
      triggered: false,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAlerts([...alerts, alert]);
    setNewAlert({ symbol: '', type: 'price_above', value: '' });
    setShowAdd(false);
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'price_above': return 'Price ▲';
      case 'price_below': return 'Price ▼';
      case 'volume_spike': return 'Vol Spike';
      case 'news_keyword': return 'News KW';
      default: return type;
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'price_above': return 'text-emerald-400';
      case 'price_below': return 'text-[#ff1a1a]';
      case 'volume_spike': return 'text-yellow-400';
      case 'news_keyword': return 'text-blue-400';
      default: return 'text-gray-500';
    }
  };

  const activeCount = alerts.filter(a => a.active).length;
  const triggeredCount = alerts.filter(a => a.triggered).length;

  return (
    <div className="p-2 space-y-1">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-1.5 text-[8px] font-mono mb-2">
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">Total</div>
          <div className="text-gray-200 font-bold text-[14px]">{alerts.length}</div>
        </div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">Active</div>
          <div className="text-emerald-400 font-bold text-[14px]">{activeCount}</div>
        </div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">Triggered</div>
          <div className="text-yellow-400 font-bold text-[14px]">{triggeredCount}</div>
        </div>
      </div>

      {/* Add alert button */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="w-full px-2 py-1 bg-black/40 border border-red-900/30 text-[8px] text-gray-400 font-mono hover:text-[#ff1a1a] hover:border-[#ff1a1a]/50 rounded-sm flex items-center justify-center gap-1"
      >
        {showAdd ? <BellOff size={8} /> : <Plus size={8} />}
        {showAdd ? 'Cancel' : 'Add Alert'}
      </button>

      {/* Add alert form */}
      {showAdd && (
        <div className="bg-black/60 border border-[#ff1a1a]/30 px-2 py-1.5 space-y-1">
          <div className="text-[8px] font-bold text-[#ff1a1a] font-mono uppercase">New Alert</div>

          {/* Type selector */}
          <div className="flex gap-0.5">
            {(['price_above', 'price_below', 'volume_spike', 'news_keyword'] as const).map(type => (
              <button
                key={type}
                onClick={() => setNewAlert({ ...newAlert, type })}
                className={`flex-1 px-1.5 py-0.5 text-[7px] font-bold font-mono rounded-sm ${
                  newAlert.type === type
                    ? `${getAlertTypeColor(type)} bg-black/30 border border-current`
                    : 'bg-black/30 text-gray-600 border border-red-900/15'
                }`}
              >
                {getAlertTypeLabel(type)}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div className="flex gap-1">
            {newAlert.type !== 'news_keyword' && (
              <input
                type="text"
                value={newAlert.symbol}
                onChange={e => setNewAlert({ ...newAlert, symbol: e.target.value })}
                placeholder="Symbol"
                className="flex-1 bg-black/40 border border-red-900/30 px-1.5 py-0.5 text-[8px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50"
              />
            )}
            <input
              type="text"
              value={newAlert.value}
              onChange={e => setNewAlert({ ...newAlert, value: e.target.value })}
              placeholder={newAlert.type === 'news_keyword' ? 'Keyword' : 'Value'}
              className="flex-1 bg-black/40 border border-red-900/30 px-1.5 py-0.5 text-[8px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50"
            />
            <button
              onClick={addAlert}
              className="px-2 py-0.5 bg-[#ff1a1a]/20 text-[#ff1a1a] border border-[#ff1a1a]/30 rounded-sm hover:bg-[#ff1a1a]/30"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className="space-y-0.5">
        {alerts.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-[9px] font-mono">No alerts configured</div>
        )}
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`bg-black/40 border px-2 py-1.5 ${alert.triggered ? 'border-yellow-500/30 bg-yellow-500/5' : alert.active ? 'border-red-900/15' : 'border-gray-500/15 opacity-50'}`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1">
                {alert.triggered ? (
                  <AlertTriangle size={10} className="text-yellow-400" />
                ) : alert.active ? (
                  <Bell size={10} className="text-emerald-400" />
                ) : (
                  <BellOff size={10} className="text-gray-600" />
                )}
                <div className="text-[10px] font-bold text-gray-200 font-mono">
                  {alert.symbol || 'Global'}
                </div>
                <div className={`text-[7px] font-mono font-bold uppercase px-1 py-0.5 rounded-sm ${getAlertTypeColor(alert.type)} bg-black/30`}>
                  {getAlertTypeLabel(alert.type)}
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => toggleAlert(alert.id)} className="p-0.5 hover:bg-white/10 rounded-sm">
                  {alert.active ? <Pause size={8} className="text-gray-500" /> : <Play size={8} className="text-gray-600" />}
                </button>
                <button onClick={() => deleteAlert(alert.id)} className="p-0.5 hover:bg-white/10 rounded-sm">
                  <Trash2 size={8} className="text-gray-600 hover:text-[#ff1a1a]" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[8px] font-mono">
              <div className="text-gray-600">
                {alert.type === 'price_above' && `Above ${typeof alert.value === 'number' ? alert.value.toLocaleString('id-ID') : alert.value}`}
                {alert.type === 'price_below' && `Below ${typeof alert.value === 'number' ? alert.value.toLocaleString('id-ID') : alert.value}`}
                {alert.type === 'volume_spike' && `Volume > ${alert.value}x avg`}
                {alert.type === 'news_keyword' && `Keyword: "${alert.value}"`}
              </div>
              {alert.triggered && alert.triggeredAt && (
                <div className="text-yellow-400 font-bold">Triggered {alert.triggeredAt}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Alert system · Browser notifications + sound in production
      </div>
    </div>
  );
}
