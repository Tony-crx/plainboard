"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center font-mono p-8">
          <div className="max-w-2xl w-full border border-red-900/50 bg-[#050000] p-8 shadow-[0_0_30px_rgba(255,0,0,0.1)]">
            <div className="flex flex-col items-center text-center">
              <ShieldAlert size={64} className="text-red-600 mb-6 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]" />
              <h1 className="text-2xl font-black text-red-500 tracking-widest uppercase mb-4">
                System Critical
              </h1>
              <p className="text-red-800 text-xs tracking-widest uppercase mb-6">
                An unrecoverable error occurred in the UI
              </p>
              <div className="w-full bg-[#0a0000] border border-red-900/30 p-4 mb-6 text-left">
                <code className="text-xs text-red-400/80 font-mono whitespace-pre-wrap break-all">
                  {this.state.error?.message}
                </code>
              </div>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex items-center gap-2 bg-red-950 hover:bg-red-900 border border-red-900 text-red-500 px-6 py-3 uppercase tracking-[0.3em] text-xs font-bold transition-all"
              >
                <RotateCcw size={14} /> Attempt Recovery
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
