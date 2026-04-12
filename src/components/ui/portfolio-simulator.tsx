"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Plus, Trash2, RefreshCw, TrendingUp } from 'lucide-react';

interface PortfolioEntry {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
}

interface PortfolioSimulatorProps {
  loading: boolean;
}

export function PortfolioSimulator({ loading }: PortfolioSimulatorProps) {
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([
    { symbol: 'BBCA', shares: 1000, avgPrice: 10500, currentPrice: 10750 },
    { symbol: 'BBRI', shares: 1500, avgPrice: 9500, currentPrice: 9800 },
    { symbol: 'BMRI', shares: 800, avgPrice: 10200, currentPrice: 10450 },
    { symbol: 'TLKM', shares: 2000, avgPrice: 3500, currentPrice: 3450 },
  ]);
  const [newSymbol, setNewSymbol] = useState('');
  const [newShares, setNewShares] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [benchmark, setBenchmark] = useState(5.2); // IHSG YTD return

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading portfolio...</div>;
  }

  const totalValue = portfolio.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);
  const totalCost = portfolio.reduce((sum, p) => sum + (p.shares * p.avgPrice), 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  const vsBenchmark = totalPnLPct - benchmark;

  const addStock = () => {
    if (!newSymbol || !newShares || !newPrice) return;

    const entry: PortfolioEntry = {
      symbol: newSymbol.toUpperCase(),
      shares: parseInt(newShares),
      avgPrice: parseFloat(newPrice),
      currentPrice: parseFloat(newPrice),
    };

    setPortfolio([...portfolio, entry]);
    setNewSymbol('');
    setNewShares('');
    setNewPrice('');
  };

  const removeStock = (index: number) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  const fmtRp = (value: number) => {
    if (Math.abs(value) >= 1e9) return `Rp ${(value / 1e9).toFixed(1)}B`;
    if (Math.abs(value) >= 1e6) return `Rp ${(value / 1e6).toFixed(1)}M`;
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  return (
    <div className="p-2 space-y-1">
      {/* Portfolio summary */}
      <div className="grid grid-cols-3 gap-1.5 text-[8px] font-mono mb-2">
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">Total Value</div>
          <div className="text-gray-200 font-bold text-[12px]">{fmtRp(totalValue)}</div>
        </div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">P&L</div>
          <div className={`text-[12px] font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
            {totalPnL >= 0 ? '+' : ''}{fmtRp(totalPnL)}
          </div>
        </div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">Return %</div>
          <div className={`text-[12px] font-bold ${totalPnLPct >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
            {totalPnLPct >= 0 ? '+' : ''}{totalPnLPct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* vs Benchmark */}
      <div className={`bg-black/40 border px-2 py-1.5 mb-2 flex items-center justify-between ${vsBenchmark >= 0 ? 'border-emerald-500/30' : 'border-[#ff1a1a]/30'}`}>
        <div className="flex items-center gap-1">
          <TrendingUp size={10} className="text-gray-600" />
          <span className="text-[8px] text-gray-600 font-mono">vs IHSG ({benchmark}%)</span>
        </div>
        <div className={`text-[10px] font-mono font-bold ${vsBenchmark >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
          {vsBenchmark >= 0 ? '+' : ''}{vsBenchmark.toFixed(2)}%
        </div>
      </div>

      {/* Add stock form */}
      <div className="bg-black/40 border border-red-900/15 px-2 py-1.5 mb-2">
        <div className="text-[8px] text-gray-600 font-mono uppercase mb-1">Add Stock</div>
        <div className="flex gap-1">
          <input
            type="text"
            value={newSymbol}
            onChange={e => setNewSymbol(e.target.value)}
            placeholder="Symbol"
            className="flex-1 bg-black/40 border border-red-900/30 px-1.5 py-0.5 text-[8px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50"
          />
          <input
            type="number"
            value={newShares}
            onChange={e => setNewShares(e.target.value)}
            placeholder="Shares"
            className="flex-1 bg-black/40 border border-red-900/30 px-1.5 py-0.5 text-[8px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50"
          />
          <input
            type="number"
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
            placeholder="Avg Price"
            className="flex-1 bg-black/40 border border-red-900/30 px-1.5 py-0.5 text-[8px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50"
          />
          <button
            onClick={addStock}
            className="px-2 py-0.5 bg-[#ff1a1a]/20 text-[#ff1a1a] border border-[#ff1a1a]/30 rounded-sm hover:bg-[#ff1a1a]/30"
          >
            <Plus size={10} />
          </button>
        </div>
      </div>

      {/* Portfolio holdings */}
      <div className="text-[8px] text-gray-600 font-mono uppercase mb-1">Holdings ({portfolio.length})</div>
      <div className="space-y-0.5">
        {portfolio.map((stock, idx) => {
          const pnl = (stock.currentPrice - stock.avgPrice) * stock.shares;
          const pnlPct = ((stock.currentPrice - stock.avgPrice) / stock.avgPrice) * 100;
          const weight = totalValue > 0 ? (stock.shares * stock.currentPrice / totalValue) * 100 : 0;

          return (
            <div key={idx} className="bg-black/40 border border-red-900/15 px-2 py-1.5">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1">
                  <div className="text-[10px] font-bold text-gray-200 font-mono">{stock.symbol}</div>
                  <div className="text-[7px] text-gray-600 font-mono">{stock.shares} shares</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="text-[7px] text-gray-600 font-mono">{weight.toFixed(1)}%</div>
                  <button onClick={() => removeStock(idx)} className="p-0.5 hover:bg-white/10 rounded-sm">
                    <Trash2 size={8} className="text-gray-600 hover:text-[#ff1a1a]" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[8px] font-mono">
                <div>
                  <div className="text-gray-600">Avg</div>
                  <div className="text-gray-300 font-bold">{stock.avgPrice.toLocaleString('id-ID')}</div>
                </div>
                <div>
                  <div className="text-gray-600">Current</div>
                  <div className="text-gray-300 font-bold">{stock.currentPrice.toLocaleString('id-ID')}</div>
                </div>
                <div>
                  <div className="text-gray-600">P&L</div>
                  <div className={`font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                    {pnl >= 0 ? '+' : ''}{fmtRp(pnl)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Return</div>
                  <div className={`font-bold ${pnlPct >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                    {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Export */}
      <div className="flex gap-1 mt-2">
        <button
          onClick={() => {
            const json = JSON.stringify(portfolio, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'portfolio.json';
            a.click();
          }}
          className="flex-1 px-2 py-1 bg-black/40 border border-red-900/30 text-[8px] text-gray-400 font-mono hover:text-[#ff1a1a] hover:border-[#ff1a1a]/50 rounded-sm"
        >
          Export JSON
        </button>
        <button
          onClick={() => setPortfolio([])}
          className="flex-1 px-2 py-1 bg-black/40 border border-red-900/30 text-[8px] text-gray-400 font-mono hover:text-[#ff1a1a] hover:border-[#ff1a1a]/50 rounded-sm"
        >
          Clear All
        </button>
      </div>

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Virtual portfolio simulator · Not connected to live trading
      </div>
    </div>
  );
}
