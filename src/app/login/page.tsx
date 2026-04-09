"use client";

import { useState } from 'react';
import { Flame, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) throw new Error('AUTHORIZATION DENIED');
      
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,0,0,0.1)_0%,rgba(0,0,0,1)_70%)] pointer-events-none"></div>
      
      <div className="z-10 w-full max-w-md p-8 border border-red-900/50 bg-[#050000] shadow-[0_0_30px_rgba(255,0,0,0.1)]">
        <div className="flex flex-col items-center mb-8">
          <Flame size={48} className="text-red-600 mb-4 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]" />
          <h1 className="text-2xl font-black text-red-500 tracking-widest uppercase">Cortisolboard</h1>
          <p className="text-[10px] text-red-900 mt-2 uppercase tracking-[0.2em]">Restricted Access Protocol</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ENTER CLEARANCE CODE [ Hint: demo ]"
              className="w-full bg-[#0a0000] border-2 border-red-900/30 focus:border-red-600 text-red-500 placeholder-red-900/50 p-4 text-center text-sm shadow-[inset_0_0_20px_rgba(0,0,0,1)] focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-red-600 text-xs bg-red-950/20 p-2 border border-red-900 font-bold uppercase tracking-widest">
              <ShieldAlert size={14} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-red-950 hover:bg-red-900 border border-red-900 text-red-500 disabled:opacity-50 disabled:hover:bg-red-950 p-4 uppercase tracking-[0.3em] text-xs font-bold transition-all"
          >
            {loading ? 'VERIFYING...' : 'INITIALIZE SYSTEM'}
          </button>
        </form>
      </div>
    </div>
  );
}
