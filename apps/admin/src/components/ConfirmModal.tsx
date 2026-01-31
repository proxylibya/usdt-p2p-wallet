import { useState, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  const variantStyles = {
    danger: {
      icon: 'bg-status-error/20 text-status-error',
      button: 'btn-danger',
      IconComponent: AlertTriangle,
    },
    warning: {
      icon: 'bg-status-warning/20 text-status-warning',
      button: 'bg-status-warning hover:bg-status-warning/80 text-background-primary font-semibold rounded-lg px-4 py-2 transition-all duration-200 active:scale-[0.97]',
      IconComponent: AlertTriangle,
    },
    info: {
      icon: 'bg-status-info/20 text-status-info',
      button: 'btn-primary',
      IconComponent: Info,
    },
    success: {
      icon: 'bg-status-success/20 text-status-success',
      button: 'btn-success',
      IconComponent: CheckCircle,
    },
  };

  const styles = variantStyles[variant];
  const IconComponent = styles.IconComponent;

  const handleCancel = () => {
    if (!isLoading) {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Animated Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${
          isClosing ? 'animate-fade-out' : 'animate-backdrop-in'
        }`}
        onClick={handleCancel}
      />
      
      {/* Animated Modal */}
      <div className={`relative bg-background-secondary rounded-xl border border-border-divider shadow-2xl w-full max-w-md mx-4 ${
        isClosing ? 'animate-modal-out' : 'animate-modal-in'
      }`}>
        {/* Close button with hover animation */}
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 hover:bg-background-tertiary rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <X className="w-5 h-5 text-text-secondary" />
        </button>

        <div className="p-6">
          {/* Animated Icon */}
          <div className={`w-14 h-14 rounded-full ${styles.icon} flex items-center justify-center mx-auto mb-4 animate-bounce-in`}>
            <IconComponent className="w-7 h-7" />
          </div>

          {/* Content with stagger animation */}
          <h3 className="text-lg font-semibold text-text-primary text-center mb-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {title}
          </h3>
          <p className="text-text-secondary text-center mb-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            {message}
          </p>

          {/* Animated Actions */}
          <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 ${styles.button} flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
