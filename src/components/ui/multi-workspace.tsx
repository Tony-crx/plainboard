"use client";

import { useState } from 'react';
import { Plus, Trash2, Layout, Save } from 'lucide-react';
import type { Workspace } from '@/lib/data/workspaces';
import { getWorkspaces, saveWorkspaces, createWorkspace, deleteWorkspace, updateWorkspaceTabs } from '@/lib/data/workspaces';

interface MultiWorkspaceProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  availableTabs: string[];
}

const TAB_LABELS: Record<string, string> = {
  ihsg: 'IHSG', stocks: 'IDX', watchlist: '★WL', crypto: 'Crypto', fx: 'FX',
  sectors: 'Sector', mostactive: 'Active', screener: 'Screen', funds: 'Funds',
  econcal: 'Econ', birate: 'BI', currency: 'Currency', breadth: 'Breadth',
  vix: 'VIX', technical: 'TA', portfolio: 'Portfolio', alerts: 'Alerts',
  bonds: 'Bonds', commodities: 'Comm', ipo: 'IPO', corporate: 'CorpAct',
  wb: 'WB', dev: 'Dev', reddit: 'Reddit', news: 'News', fred: 'FRED',
};

export function MultiWorkspaceSystem({ currentTab, onTabChange, availableTabs }: MultiWorkspaceProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(getWorkspaces());
  const [activeWorkspace, setActiveWorkspace] = useState<string>(workspaces[0]?.id || '');
  const [showCreate, setShowCreate] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [editMode, setEditMode] = useState(false);

  const currentWs = workspaces.find(w => w.id === activeWorkspace);

  const handleCreate = () => {
    if (!newWsName.trim()) return;
    const ws = createWorkspace(newWsName, availableTabs.slice(0, 5), 'personal');
    setWorkspaces(getWorkspaces());
    setActiveWorkspace(ws.id);
    setNewWsName('');
    setShowCreate(false);
  };

  const handleDelete = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (ws?.isDefault) return;
    deleteWorkspace(id);
    setWorkspaces(getWorkspaces());
    if (activeWorkspace === id) {
      setActiveWorkspace(workspaces[0]?.id || '');
    }
  };

  const toggleTab = (tabKey: string) => {
    if (!currentWs) return;
    const tabs = currentWs.tabs.includes(tabKey)
      ? currentWs.tabs.filter(t => t !== tabKey)
      : [...currentWs.tabs, tabKey];
    updateWorkspaceTabs(currentWs.id, tabs);
    setWorkspaces(getWorkspaces());
  };

  return (
    <div className="p-2 space-y-1">
      {/* Workspace selector */}
      <div className="flex items-center gap-1 mb-2">
        <select
          value={activeWorkspace}
          onChange={e => setActiveWorkspace(e.target.value)}
          className="flex-1 bg-black/40 border border-red-900/30 text-[9px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50 px-2 py-1"
        >
          {workspaces.map(ws => (
            <option key={ws.id} value={ws.id}>{ws.icon} {ws.name} ({ws.layout})</option>
          ))}
        </select>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-1 bg-black/40 border border-red-900/30 rounded-sm hover:border-[#ff1a1a]/50"
        >
          <Plus size={10} className="text-gray-400" />
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-black/60 border border-[#ff1a1a]/30 px-2 py-1.5 mb-2">
          <div className="flex gap-1">
            <input
              type="text"
              value={newWsName}
              onChange={e => setNewWsName(e.target.value)}
              placeholder="Workspace name"
              className="flex-1 bg-black/40 border border-red-900/30 px-1.5 py-0.5 text-[8px] text-gray-300 font-mono focus:outline-none"
            />
            <select
              onChange={e => {
                const layout = e.target.value as Workspace['layout'];
                const ws = createWorkspace(newWsName || 'New', availableTabs.slice(0, 5), layout);
                setWorkspaces(getWorkspaces());
                setActiveWorkspace(ws.id);
                setNewWsName('');
                setShowCreate(false);
              }}
              className="bg-black/40 border border-red-900/30 text-[7px] text-gray-300 font-mono"
            >
              <option value="trading">Trading</option>
              <option value="research">Research</option>
              <option value="personal">Personal</option>
            </select>
          </div>
        </div>
      )}

      {/* Current workspace tabs */}
      {currentWs && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[8px] text-gray-600 font-mono uppercase">Active Tabs</div>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-1.5 py-0.5 text-[7px] font-mono rounded-sm ${editMode ? 'bg-[#ff1a1a]/20 text-[#ff1a1a]' : 'bg-black/30 text-gray-600'}`}
            >
              <Layout size={8} className="inline mr-0.5" />
              {editMode ? 'Done' : 'Edit'}
            </button>
          </div>
          <div className="flex flex-wrap gap-0.5">
            {currentWs.tabs.map(tab => (
              <button
                key={tab}
                onClick={() => editMode ? toggleTab(tab) : onTabChange(tab)}
                className={`px-1.5 py-0.5 text-[7px] font-mono rounded-sm border ${
                  currentTab === tab
                    ? 'bg-[#ff1a1a]/20 text-[#ff1a1a] border-[#ff1a1a]/30'
                    : 'bg-black/30 text-gray-500 border-red-900/15'
                } ${editMode ? 'cursor-pointer hover:border-red-900/40' : 'cursor-pointer'}`}
              >
                {TAB_LABELS[tab] || tab}
                {editMode && <span className="ml-0.5 text-[#ff1a1a]">×</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Workspace list */}
      <div className="space-y-0.5">
        {workspaces.map(ws => (
          <div
            key={ws.id}
            className={`bg-black/40 border border-red-900/15 px-2 py-1.5 flex items-center justify-between ${
              ws.id === activeWorkspace ? 'border-[#ff1a1a]/30 bg-[#ff1a1a]/5' : ''
            }`}
          >
            <div className="flex items-center gap-1">
              <span className="text-[10px]">{ws.icon}</span>
              <div>
                <div className="text-[9px] font-bold text-gray-200 font-mono">{ws.name}</div>
                <div className="text-[7px] text-gray-600 font-mono">{ws.tabs.length} tabs · {ws.layout}</div>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setActiveWorkspace(ws.id)}
                className="px-1.5 py-0.5 text-[7px] bg-[#ff1a1a]/20 text-[#ff1a1a] rounded-sm"
              >
                Open
              </button>
              {!ws.isDefault && (
                <button onClick={() => handleDelete(ws.id)} className="p-0.5 hover:bg-white/10 rounded-sm">
                  <Trash2 size={8} className="text-gray-600 hover:text-[#ff1a1a]" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Workspaces saved to localStorage
      </div>
    </div>
  );
}
