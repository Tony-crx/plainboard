// Multi-Workspace System
// Create multiple workspaces with different layouts and tabs

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  tabs: string[];
  layout: 'trading' | 'research' | 'personal';
  createdAt: string;
  isDefault: boolean;
}

export const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'trading',
    name: 'Trading',
    icon: '📈',
    tabs: ['ihsg', 'stocks', 'sectors', 'mostactive', 'screener', 'vix', 'technical', 'alerts'],
    layout: 'trading',
    createdAt: '2026-04-12',
    isDefault: true,
  },
  {
    id: 'research',
    name: 'Research',
    icon: '🔬',
    tabs: ['wb', 'econcal', 'birate', 'bonds', 'funds', 'breadth', 'currency', 'news'],
    layout: 'research',
    createdAt: '2026-04-12',
    isDefault: false,
  },
  {
    id: 'personal',
    name: 'Personal',
    icon: '👤',
    tabs: ['portfolio', 'watchlist', 'corporate', 'ipo', 'commodities', 'dev', 'reddit'],
    layout: 'personal',
    createdAt: '2026-04-12',
    isDefault: false,
  },
];

export function getWorkspaces(): Workspace[] {
  if (typeof window === 'undefined') return DEFAULT_WORKSPACES;
  try {
    const raw = localStorage.getItem('board_workspaces');
    return raw ? JSON.parse(raw) : DEFAULT_WORKSPACES;
  } catch {
    return DEFAULT_WORKSPACES;
  }
}

export function saveWorkspaces(workspaces: Workspace[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('board_workspaces', JSON.stringify(workspaces));
}

export function createWorkspace(name: string, tabs: string[], layout: Workspace['layout']): Workspace {
  const ws: Workspace = {
    id: `ws-${Date.now()}`,
    name,
    icon: '📋',
    tabs,
    layout,
    createdAt: new Date().toISOString().split('T')[0],
    isDefault: false,
  };
  const workspaces = getWorkspaces();
  workspaces.push(ws);
  saveWorkspaces(workspaces);
  return ws;
}

export function deleteWorkspace(id: string): void {
  const workspaces = getWorkspaces().filter(w => w.id !== id);
  saveWorkspaces(workspaces);
}

export function updateWorkspaceTabs(id: string, tabs: string[]): void {
  const workspaces = getWorkspaces().map(w => w.id === id ? { ...w, tabs } : w);
  saveWorkspaces(workspaces);
}
