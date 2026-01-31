
import React from 'react';
import { useNotifications, ToastMessage } from '../context/NotificationContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastItem: React.FC<{ toast: ToastMessage; onClose: (id: string) => void }> = ({ toast, onClose }) => {
    const getIcon = () => {
        switch (toast.icon) {
            case 'success': return <CheckCircle className="w-5 h-5 text-success" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-error" />;
            default: return <Info className="w-5 h-5 text-brand-yellow" />;
        }
    };

    return (
        <div className="bg-background-secondary/95 backdrop-blur-md border border-border-divider p-4 rounded-xl shadow-2xl flex items-start gap-3 min-w-[300px] max-w-[90vw] animate-fadeInDown pointer-events-auto">
            <div className="mt-0.5 flex-shrink-0">
                {getIcon()}
            </div>
            <div className="flex-grow">
                <h4 className="text-sm font-bold text-text-primary leading-tight">{toast.title}</h4>
                {toast.message && <p className="text-xs text-text-secondary mt-1 leading-snug">{toast.message}</p>}
            </div>
            <button 
                onClick={() => onClose(toast.id)}
                className="text-text-secondary hover:text-text-primary p-1 -mt-1 -mr-1"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useNotifications();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-safe left-0 right-0 z-[110] flex flex-col items-center gap-2 p-4 pointer-events-none">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
            ))}
        </div>
    );
};
