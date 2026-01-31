/**
 * Unified UI Components for Admin Dashboard
 */

import React from 'react';
import { Loader2, AlertTriangle, Info } from 'lucide-react';

// ========== BADGE ==========

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const variants = {
    success: 'bg-status-success/20 text-status-success',
    warning: 'bg-status-warning/20 text-status-warning',
    error: 'bg-status-error/20 text-status-error',
    info: 'bg-status-info/20 text-status-info',
    purple: 'bg-purple-500/20 text-purple-400',
    default: 'bg-background-tertiary text-text-secondary',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

// ========== STATUS INDICATOR ==========

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'idle';
  label?: string;
  pulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, pulse = true }) => {
  const colors = {
    online: 'bg-status-success',
    offline: 'bg-status-error',
    warning: 'bg-status-warning',
    idle: 'bg-text-secondary',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[status]} ${pulse && status === 'online' ? 'animate-pulse' : ''}`} />
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </div>
  );
};

// ========== LOADING SPINNER ==========

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text, fullScreen = false }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center gap-3">
      <Loader2 className={`${sizes[size]} animate-spin text-brand-yellow`} />
      {text && <p className="text-text-secondary text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="fixed inset-0 flex items-center justify-center bg-background-primary/80 z-50">{content}</div>;
  }

  return <div className="flex items-center justify-center p-8">{content}</div>;
};

// ========== EMPTY STATE ==========

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    {icon && <div className="mb-4 text-text-secondary opacity-50">{icon}</div>}
    <h3 className="text-lg font-medium text-text-primary mb-2">{title}</h3>
    {description && <p className="text-text-secondary text-sm mb-4 max-w-sm">{description}</p>}
    {action}
  </div>
);

// ========== CONFIRM MODAL ==========

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const icons = {
    danger: <AlertTriangle className="w-12 h-12 text-status-error" />,
    warning: <AlertTriangle className="w-12 h-12 text-status-warning" />,
    info: <Info className="w-12 h-12 text-status-info" />,
  };

  const buttonColors = {
    danger: 'bg-status-error hover:bg-status-error/80',
    warning: 'bg-status-warning hover:bg-status-warning/80',
    info: 'bg-status-info hover:bg-status-info/80',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-background-secondary rounded-xl border border-border-divider p-6 w-full max-w-md mx-4">
        <div className="flex flex-col items-center text-center">
          {icons[variant]}
          <h3 className="text-lg font-semibold text-text-primary mt-4 mb-2">{title}</h3>
          <p className="text-text-secondary mb-6">{message}</p>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} disabled={isLoading} className="flex-1 btn-secondary">
              {cancelText}
            </button>
            <button onClick={onConfirm} disabled={isLoading} className={`flex-1 btn-primary ${buttonColors[variant]}`}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== STATS CARD ==========

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  changeLabel?: string;
  color?: 'yellow' | 'green' | 'red' | 'blue' | 'purple';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  change,
  changeLabel = 'vs last period',
  color = 'yellow',
}) => {
  const colors = {
    yellow: 'bg-brand-yellow/20 text-brand-yellow',
    green: 'bg-status-success/20 text-status-success',
    red: 'bg-status-error/20 text-status-error',
    blue: 'bg-status-info/20 text-status-info',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-2">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-2 ${change >= 0 ? 'text-status-success' : 'text-status-error'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% {changeLabel}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

// ========== TABS ==========

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => (
  <div className="flex gap-1 border-b border-border-divider">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        className={`px-4 py-3 font-medium transition-colors relative ${
          activeTab === tab.key
            ? 'text-brand-yellow'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        {tab.label}
        {tab.count !== undefined && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-background-tertiary">
            {tab.count}
          </span>
        )}
        {activeTab === tab.key && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-yellow" />
        )}
      </button>
    ))}
  </div>
);

// ========== PROGRESS BAR ==========

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'auto' | 'yellow' | 'green' | 'red' | 'blue';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  color = 'auto',
}) => {
  const percent = Math.min((value / max) * 100, 100);
  
  const heights = { sm: 'h-1', md: 'h-2', lg: 'h-3' };
  
  const getColor = () => {
    if (color !== 'auto') {
      const colors = {
        yellow: 'bg-brand-yellow',
        green: 'bg-status-success',
        red: 'bg-status-error',
        blue: 'bg-status-info',
      };
      return colors[color];
    }
    if (percent < 60) return 'bg-status-success';
    if (percent < 80) return 'bg-status-warning';
    return 'bg-status-error';
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-text-secondary">{value}</span>
          <span className="text-text-secondary">{max}</span>
        </div>
      )}
      <div className={`${heights[size]} bg-background-tertiary rounded-full overflow-hidden`}>
        <div
          className={`h-full ${getColor()} rounded-full transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

// ========== AVATAR ==========

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline';
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', status }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  const statusSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      {src ? (
        <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-brand-yellow/20 flex items-center justify-center font-semibold text-brand-yellow`}>
          {initials}
        </div>
      )}
      {status && (
        <div className={`absolute bottom-0 right-0 ${statusSizes[size]} rounded-full border-2 border-background-secondary ${status === 'online' ? 'bg-status-success' : 'bg-text-secondary'}`} />
      )}
    </div>
  );
};

// ========== TOOLTIP ==========

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'top' }) => {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative group">
      {children}
      <div className={`absolute ${positions[position]} px-2 py-1 bg-background-primary border border-border-divider rounded text-xs text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50`}>
        {content}
      </div>
    </div>
  );
};
