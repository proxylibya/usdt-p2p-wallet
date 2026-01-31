/**
 * Unified Utility Functions for Admin Dashboard
 */

// ========== NUMBER FORMATTING ==========

export const formatNumber = (num: number): string => {
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

export const formatCurrency = (value: number, currency = 'USD'): string => {
  if (currency === 'USD') {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
};

export const formatPercent = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatCrypto = (amount: number, decimals = 8): string => {
  return amount.toFixed(decimals).replace(/\.?0+$/, '');
};

// ========== DATE FORMATTING ==========

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
};

// ========== STRING UTILITIES ==========

export const truncateAddress = (address: string, start = 6, end = 4): string => {
  if (!address || address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const capitalizeFirst = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatSnakeCase = (str: string): string => {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

// ========== VALIDATION ==========

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return /^\+?[\d\s-]{8,}$/.test(phone);
};

export const isValidAddress = (address: string, type: 'trc20' | 'erc20' | 'btc' = 'trc20'): boolean => {
  switch (type) {
    case 'trc20':
      return /^T[a-zA-Z0-9]{33}$/.test(address);
    case 'erc20':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case 'btc':
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address);
    default:
      return false;
  }
};

// ========== CSV EXPORT ==========

export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
): void => {
  if (!data.length) return;

  const keys = headers ? headers.map((h) => h.key) : (Object.keys(data[0]) as (keyof T)[]);
  const headerRow = headers ? headers.map((h) => h.label) : keys.map(String);

  const csvContent = [
    headerRow.join(','),
    ...data.map((row) =>
      keys
        .map((key) => {
          const value = row[key];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// ========== JSON EXPORT ==========

export const exportToJSON = <T>(data: T, filename: string): void => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// ========== CLIPBOARD ==========

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
};

// ========== COLOR UTILITIES ==========

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    // Success states
    success: 'text-status-success',
    completed: 'text-status-success',
    approved: 'text-status-success',
    online: 'text-status-success',
    active: 'text-status-success',
    healthy: 'text-status-success',
    resolved: 'text-status-success',

    // Warning states
    warning: 'text-status-warning',
    pending: 'text-status-warning',
    processing: 'text-status-warning',
    degraded: 'text-status-warning',
    in_progress: 'text-status-warning',

    // Error states
    error: 'text-status-error',
    failed: 'text-status-error',
    rejected: 'text-status-error',
    offline: 'text-status-error',
    critical: 'text-status-error',
    disputed: 'text-status-error',

    // Info states
    info: 'text-status-info',
    open: 'text-status-info',
    new: 'text-status-info',
  };
  return colors[status.toLowerCase()] || 'text-text-secondary';
};

export const getStatusBgColor = (status: string): string => {
  const colors: Record<string, string> = {
    success: 'bg-status-success/20',
    completed: 'bg-status-success/20',
    approved: 'bg-status-success/20',
    warning: 'bg-status-warning/20',
    pending: 'bg-status-warning/20',
    error: 'bg-status-error/20',
    failed: 'bg-status-error/20',
    info: 'bg-status-info/20',
  };
  return colors[status.toLowerCase()] || 'bg-background-tertiary';
};

// ========== SORTING ==========

export const sortByDate = <T extends { [key: string]: any }>(
  items: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'desc'
): T[] => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[key]).getTime();
    const dateB = new Date(b[key]).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

export const sortByNumber = <T extends { [key: string]: any }>(
  items: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'desc'
): T[] => {
  return [...items].sort((a, b) => {
    return order === 'desc' ? b[key] - a[key] : a[key] - b[key];
  });
};

// ========== FILTERING ==========

export const filterBySearch = <T extends Record<string, any>>(
  items: T[],
  query: string,
  keys: (keyof T)[]
): T[] => {
  if (!query.trim()) return items;
  const lowerQuery = query.toLowerCase();
  return items.filter((item) =>
    keys.some((key) => String(item[key] || '').toLowerCase().includes(lowerQuery))
  );
};

// ========== DEBOUNCE ==========

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// ========== LOCAL STORAGE ==========

export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue ?? null;
    } catch {
      return defaultValue ?? null;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable
    }
  },
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
};
