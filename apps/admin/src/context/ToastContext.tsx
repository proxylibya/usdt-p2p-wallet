import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  isExiting?: boolean;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const iconClass = "w-5 h-5";
  switch (type) {
    case 'success': return <CheckCircle className={`${iconClass} text-status-success`} />;
    case 'error': return <XCircle className={`${iconClass} text-status-error`} />;
    case 'warning': return <AlertTriangle className={`${iconClass} text-status-warning`} />;
    case 'info': return <Info className={`${iconClass} text-status-info`} />;
  }
};

const toastBorderColors = {
  success: 'border-l-status-success',
  error: 'border-l-status-error',
  warning: 'border-l-status-warning',
  info: 'border-l-status-info',
};

const toastIconBgColors = {
  success: 'bg-status-success/10',
  error: 'bg-status-error/10',
  warning: 'bg-status-warning/10',
  info: 'bg-status-info/10',
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    // Start exit animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
    // Remove after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message, isExiting: false }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const success = (title: string, message?: string) => showToast('success', title, message);
  const error = (title: string, message?: string) => showToast('error', title, message);
  const warning = (title: string, message?: string) => showToast('warning', title, message);
  const info = (title: string, message?: string) => showToast('info', title, message);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      
      {/* Animated Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              bg-background-secondary border border-border-divider border-l-4 ${toastBorderColors[toast.type]}
              rounded-lg p-4 shadow-2xl flex items-start gap-3
              ${toast.isExiting ? 'animate-toast-out' : 'animate-toast-in'}
              hover:shadow-brand-yellow/10 transition-shadow duration-200
            `}
            style={{ animationDelay: toast.isExiting ? '0ms' : `${index * 50}ms` }}
          >
            <div className={`p-1.5 rounded-full ${toastIconBgColors[toast.type]}`}>
              <ToastIcon type={toast.type} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary">{toast.title}</p>
              {toast.message && (
                <p className="text-sm text-text-secondary mt-1 break-words">{toast.message}</p>
              )}
            </div>
            <button 
              onClick={() => removeToast(toast.id)} 
              className="text-text-secondary hover:text-text-primary p-1 hover:bg-background-tertiary rounded transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
