import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Handle dynamic import errors - auto retry once
    if (error.message.includes('Failed to fetch dynamically imported module')) {
      return { hasError: true, error };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    // Auto-retry for chunk loading errors (max 2 times)
    if (error.message.includes('Failed to fetch dynamically imported module') && this.state.retryCount < 2) {
      // Reload the page for chunk loading errors
      window.location.reload();
    }
  }

  private handleReset = () => {
      window.location.reload();
  };

  private handleHardReset = () => {
      localStorage.clear();
      window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0B0E11] text-[#FEFEFE] p-6 text-center">
          <div className="bg-[#1E2026] p-6 rounded-full mb-6">
            <AlertTriangle className="w-16 h-16 text-[#F6465D]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-[#848E9C] mb-8 max-w-xs text-sm leading-relaxed">
            We encountered an unexpected error. Try refreshing, or perform a hard reset if the issue persists.
          </p>
          
          <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#F0B90B] text-[#0B0E11] rounded-xl font-bold hover:brightness-110 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Reload App
              </button>
              
              <button
                onClick={this.handleHardReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1E2026] text-[#F6465D] border border-[#F6465D]/30 rounded-xl font-bold hover:bg-[#F6465D]/10 transition-all"
              >
                <Trash2 className="w-5 h-5" />
                Clear Data & Reset
              </button>
          </div>
          
          {this.state.error && (
              <div className="mt-8 p-4 bg-[#1E2026] rounded-lg border border-[#2B3139] max-w-full overflow-auto">
                  <code className="text-xs text-[#848E9C] font-mono text-left block">
                      {this.state.error.toString()}
                  </code>
              </div>
          )}
        </div>
      );
    }

    return (this as any).props.children || null;
  }
}

export default ErrorBoundary;