import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Copy, Check, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  copied: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    retryCount: 0,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Store error info for display
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // 📊 Log error for debugging (in dev) or send to monitoring (in prod)
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error);
      console.error('Component stack:', errorInfo.componentStack);
    } else {
      // TODO: Send to error monitoring service (Sentry, etc.)
      // window.Sentry?.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }
    
    // Auto-retry for chunk loading errors (max 2 times)
    if (error.message.includes('Failed to fetch dynamically imported module') && this.state.retryCount < 2) {
      this.setState(prev => ({ retryCount: prev.retryCount + 1 }));
      setTimeout(() => window.location.reload(), 1000);
    }
  }

  private handleReset = () => {
    window.location.reload();
  };

  private handleHardReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleCopyError = () => {
    const errorText = this.getErrorReport();
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  private getErrorReport = (): string => {
    const { error, errorInfo } = this.state;
    return `
=== Error Report ===
Time: ${new Date().toISOString()}
URL: ${window.location.href}
UserAgent: ${navigator.userAgent}

Error: ${error?.toString()}

Stack: ${error?.stack}

Component Stack: ${errorInfo?.componentStack}
==================
    `.trim();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { copied } = this.state;

      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0B0E11] text-[#FEFEFE] p-6 text-center">
          <div className="bg-[#1E2026] p-6 rounded-full mb-6 animate-pulse">
            <AlertTriangle className="w-16 h-16 text-[#F6465D]" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-[#848E9C] mb-8 max-w-sm text-sm leading-relaxed">
            We encountered an unexpected error. Try refreshing the page, or contact support if the issue persists.
          </p>
          
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#F0B90B] text-[#0B0E11] rounded-xl font-bold hover:brightness-110 transition-all active:scale-[0.98]"
            >
              <RefreshCw className="w-5 h-5" />
              Reload App
            </button>
            
            <button
              onClick={this.handleGoHome}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1E2026] text-[#FEFEFE] border border-[#2B3139] rounded-xl font-bold hover:bg-[#2B3139] transition-all"
            >
              <Home className="w-5 h-5" />
              Go to Home
            </button>
            
            <button
              onClick={this.handleHardReset}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-transparent text-[#F6465D] border border-[#F6465D]/30 rounded-xl font-bold hover:bg-[#F6465D]/10 transition-all"
            >
              <Trash2 className="w-5 h-5" />
              Clear Data & Reset
            </button>
          </div>
          
          {this.state.error && (
            <div className="mt-8 w-full max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#848E9C]">Error Details</span>
                <button
                  onClick={this.handleCopyError}
                  className="flex items-center gap-1 text-xs text-[#848E9C] hover:text-[#FEFEFE] transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="p-4 bg-[#1E2026] rounded-lg border border-[#2B3139] max-h-32 overflow-auto">
                <code className="text-xs text-[#848E9C] font-mono text-left block whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            </div>
          )}
          
          <p className="mt-8 text-xs text-[#848E9C]">
            Error ID: {Date.now().toString(36).toUpperCase()}
          </p>
        </div>
      );
    }

    return this.props.children || null;
  }
}

export default ErrorBoundary;