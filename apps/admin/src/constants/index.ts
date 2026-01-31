/**
 * Global Constants for Admin Dashboard
 */

// ========== API ==========
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

// ========== PAGINATION ==========
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ========== REFRESH INTERVALS ==========
export const REALTIME_REFRESH_INTERVAL = 30000; // 30 seconds
export const STATS_REFRESH_INTERVAL = 60000; // 1 minute
export const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

// ========== STATUS COLORS ==========
export const STATUS_COLORS = {
  success: 'bg-status-success/20 text-status-success',
  warning: 'bg-status-warning/20 text-status-warning',
  error: 'bg-status-error/20 text-status-error',
  info: 'bg-status-info/20 text-status-info',
  pending: 'bg-brand-yellow/20 text-brand-yellow',
  neutral: 'bg-background-tertiary text-text-secondary',
} as const;

// ========== USER ROLES ==========
export const USER_ROLES = {
  USER: { label: 'User', color: 'badge-info' },
  MERCHANT: { label: 'Merchant', color: 'badge-warning' },
  VIP: { label: 'VIP', color: 'bg-purple-500/20 text-purple-400' },
} as const;

export const ADMIN_ROLES = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'badge-error' },
  ADMIN: { label: 'Admin', color: 'badge-warning' },
  MODERATOR: { label: 'Moderator', color: 'badge-info' },
  SUPPORT: { label: 'Support', color: 'badge-success' },
} as const;

// ========== KYC STATUS ==========
export const KYC_STATUS = {
  NONE: { label: 'Not Submitted', color: 'bg-gray-500/20 text-gray-400' },
  PENDING: { label: 'Pending', color: 'badge-warning' },
  APPROVED: { label: 'Approved', color: 'badge-success' },
  REJECTED: { label: 'Rejected', color: 'badge-error' },
} as const;

// ========== TRANSACTION TYPES ==========
export const TRANSACTION_TYPES = {
  DEPOSIT: { label: 'Deposit', color: 'badge-success', icon: 'ArrowDownLeft' },
  WITHDRAWAL: { label: 'Withdrawal', color: 'badge-error', icon: 'ArrowUpRight' },
  TRANSFER: { label: 'Transfer', color: 'badge-info', icon: 'ArrowLeftRight' },
  P2P_BUY: { label: 'P2P Buy', color: 'badge-success', icon: 'ShoppingCart' },
  P2P_SELL: { label: 'P2P Sell', color: 'badge-warning', icon: 'Tag' },
  SWAP: { label: 'Swap', color: 'badge-info', icon: 'RefreshCw' },
  STAKING: { label: 'Staking', color: 'bg-purple-500/20 text-purple-400', icon: 'TrendingUp' },
} as const;

// ========== TRANSACTION STATUS ==========
export const TRANSACTION_STATUS = {
  PENDING: { label: 'Pending', color: 'badge-warning' },
  PROCESSING: { label: 'Processing', color: 'badge-info' },
  COMPLETED: { label: 'Completed', color: 'badge-success' },
  FAILED: { label: 'Failed', color: 'badge-error' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400' },
} as const;

// ========== P2P STATUS ==========
export const P2P_TRADE_STATUS = {
  PENDING: { label: 'Pending', color: 'badge-warning' },
  PAID: { label: 'Paid', color: 'badge-info' },
  RELEASED: { label: 'Released', color: 'badge-success' },
  COMPLETED: { label: 'Completed', color: 'badge-success' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400' },
  DISPUTED: { label: 'Disputed', color: 'badge-error' },
} as const;

// ========== DISPUTE STATUS ==========
export const DISPUTE_STATUS = {
  OPEN: { label: 'Open', color: 'badge-error' },
  UNDER_REVIEW: { label: 'Under Review', color: 'badge-warning' },
  RESOLVED: { label: 'Resolved', color: 'badge-success' },
  CLOSED: { label: 'Closed', color: 'bg-gray-500/20 text-gray-400' },
} as const;

// ========== TICKET STATUS ==========
export const TICKET_STATUS = {
  open: { label: 'Open', color: 'badge-info' },
  in_progress: { label: 'In Progress', color: 'badge-warning' },
  waiting: { label: 'Waiting', color: 'bg-purple-500/20 text-purple-400' },
  resolved: { label: 'Resolved', color: 'badge-success' },
  closed: { label: 'Closed', color: 'bg-gray-500/20 text-gray-400' },
} as const;

// ========== PRIORITY ==========
export const PRIORITY = {
  low: { label: 'Low', color: 'badge-info' },
  medium: { label: 'Medium', color: 'badge-warning' },
  high: { label: 'High', color: 'bg-orange-500/20 text-orange-400' },
  urgent: { label: 'Urgent', color: 'badge-error' },
} as const;

// ========== SEVERITY ==========
export const SEVERITY = {
  low: { label: 'Low', color: 'badge-info' },
  medium: { label: 'Medium', color: 'badge-warning' },
  high: { label: 'High', color: 'bg-orange-500/20 text-orange-400' },
  critical: { label: 'Critical', color: 'badge-error' },
} as const;

// ========== ASSETS ==========
export const ASSETS = {
  USDT: { name: 'Tether', symbol: 'USDT', color: '#26A17B', networks: ['TRC20', 'ERC20', 'BEP20'] },
  USDC: { name: 'USD Coin', symbol: 'USDC', color: '#2775CA', networks: ['ERC20', 'BEP20'] },
  BTC: { name: 'Bitcoin', symbol: 'BTC', color: '#F7931A', networks: ['BTC'] },
  ETH: { name: 'Ethereum', symbol: 'ETH', color: '#627EEA', networks: ['ERC20'] },
  TRX: { name: 'TRON', symbol: 'TRX', color: '#EF0027', networks: ['TRC20'] },
} as const;

// ========== COUNTRIES ==========
export const SUPPORTED_COUNTRIES = [
  { code: 'LY', name: 'Libya', nameAr: 'ليبيا', currency: 'LYD' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر', currency: 'EGP' },
  { code: 'TN', name: 'Tunisia', nameAr: 'تونس', currency: 'TND' },
  { code: 'DZ', name: 'Algeria', nameAr: 'الجزائر', currency: 'DZD' },
  { code: 'MA', name: 'Morocco', nameAr: 'المغرب', currency: 'MAD' },
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية', currency: 'SAR' },
  { code: 'AE', name: 'UAE', nameAr: 'الإمارات', currency: 'AED' },
] as const;

// ========== FEE CATEGORIES ==========
export const FEE_CATEGORIES = {
  trading: { label: 'Trading', icon: 'ArrowLeftRight' },
  withdrawal: { label: 'Withdrawal', icon: 'ArrowUpRight' },
  deposit: { label: 'Deposit', icon: 'ArrowDownLeft' },
  p2p: { label: 'P2P', icon: 'Users' },
  swap: { label: 'Swap', icon: 'RefreshCw' },
  staking: { label: 'Staking', icon: 'TrendingUp' },
} as const;

// ========== DATE FORMATS ==========
export const DATE_FORMATS = {
  full: 'YYYY-MM-DD HH:mm:ss',
  date: 'YYYY-MM-DD',
  time: 'HH:mm:ss',
  display: 'MMM DD, YYYY',
  displayWithTime: 'MMM DD, YYYY HH:mm',
} as const;
