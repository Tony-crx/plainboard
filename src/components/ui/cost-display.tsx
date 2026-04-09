"use client";

import { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';

export function CostDisplay() {
  const [cost, setCost] = useState(0);

  useEffect(() => {
     // Periodically check local api for cost metrics or fake it for demo UX if API absent.
     // In a real app, you'd fetch this from the globalCostTracker via a dedicated API endpoint.
     const fetchCost = async () => {
         try {
             // Let's assume we build an API endpoint /api/metrics later. For now placeholder:
             const response = await fetch('/api/metrics');
             if (response.ok) {
                 const data = await response.json();
                 setCost(data.totalCost || 0);
             }
         } catch(err) {
             // ignore
         }
     };
     
     fetchCost();
     const intvl = setInterval(fetchCost, 10000);
     return () => clearInterval(intvl);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-red-600/70 font-mono border border-red-900/50 bg-[#050000] px-2 py-1 uppercase tracking-widest">
       <DollarSign size={10} />
       <span>Debt: ${cost.toFixed(5)}</span>
    </div>
  );
}
