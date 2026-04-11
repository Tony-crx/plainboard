"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw, Copy, AlertTriangle, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  private handleCopyError = async () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    const errorText = [
      `Error: ${error.message}`,
      `Stack: ${error.stack || 'N/A'}`,
      errorInfo ? `Component Stack: ${errorInfo.componentStack}` : '',
    ].filter(Boolean).join('\n\n');

    try {
      await navigator.clipboard.writeText(errorText);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = errorText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center font-mono p-8">
          <div className="max-w-2xl w-full border border-red-900/50 bg-[#050000] p-8 shadow-[0_0_30px_rgba(255,0,0,0.1)]">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <ShieldAlert
                  size={64}
                  className="text-red-600 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]"
                />
                <AlertTriangle
                  size={20}
                  className="text-red-400 absolute -bottom-1 -right-1 drop-shadow-[0_0_10px_rgba(255,0,0,0.6)]"
                />
              </div>

              <h1 className="text-2xl font-black text-red-500 tracking-widest uppercase mb-2">
                System Critical
              </h1>
              <p className="text-red-800 text-xs tracking-widest uppercase mb-6">
                An unrecoverable error occurred in the UI
              </p>

              <div className="w-full bg-[#0a0000] border border-red-900/30 p-4 mb-6 text-left">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-red-700 text-[9px] uppercase tracking-widest">
                    <Terminal size={10} /> Error Details
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={this.handleCopyError}
                      className="p-1 hover:bg-red-950/40 text-red-900 hover:text-red-500 transition-colors"
                      title="Copy error details"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                      className="p-1 hover:bg-red-950/40 text-red-900 hover:text-red-500 transition-colors"
                      title={this.state.showDetails ? 'Hide details' : 'Show details'}
                    >
                      <Terminal size={12} />
                    </button>
                  </div>
                </div>
                <code className="text-xs text-red-400/80 font-mono whitespace-pre-wrap break-all block">
                  {this.state.error?.message}
                </code>
                {this.state.showDetails && this.state.errorInfo && (
                  <div className="mt-3 pt-3 border-t border-red-900/20">
                    <pre className="text-[10px] text-red-800/60 font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 bg-red-950 hover:bg-red-900 border border-red-900 text-red-500 px-6 py-3 uppercase tracking-[0.3em] text-xs font-bold transition-all"
                >
                  <RotateCcw size={14} /> Attempt Recovery
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex items-center gap-2 bg-black hover:bg-red-950/40 border border-red-900/50 text-red-800 hover:text-red-500 px-6 py-3 uppercase tracking-[0.3em] text-xs font-bold transition-all"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional error boundary wrapper for use in specific component trees.
 * Use this when you want localized error handling without affecting the entire app.
 */
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundaryWrapped extends Component<ErrorBoundaryWrapperProps, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundaryWrapped] Error caught:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="border border-red-900/50 bg-[#050000] p-4 shadow-[0_0_15px_rgba(255,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <ShieldAlert size={16} className="text-red-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                Component Error
              </p>
              <p className="text-red-400/60 text-xs font-mono truncate">
                {this.state.error?.message}
              </p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="p-2 bg-red-950 hover:bg-red-900 border border-red-900 text-red-500 transition-colors flex-shrink-0"
              title="Try again"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
