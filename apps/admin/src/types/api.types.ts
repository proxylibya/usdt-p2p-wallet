/**
 * Unified API Types for Admin Dashboard
 * All shared types and interfaces
 */

// ========== COMMON ==========

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DateRange {
  from: string;
  to: string;
}

// ========== USER ==========

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  country?: string;
  isActive: boolean;
  isVerified: boolean;
  kycStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  role: 'USER' | 'MERCHANT' | 'VIP';
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

// ========== TRANSACTION ==========

export interface Transaction {
  id: string;
  userId: string;
  userName?: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'P2P_BUY' | 'P2P_SELL' | 'SWAP' | 'STAKING';
  asset: string;
  amount: number;
  fee: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  txHash?: string;
  address?: string;
  network?: string;
  createdAt: string;
  completedAt?: string;
}

// ========== P2P ==========

export interface P2POffer {
  id: string;
  userId: string;
  userName?: string;
  type: 'BUY' | 'SELL';
  asset: string;
  fiatCurrency: string;
  price: number;
  minAmount: number;
  maxAmount: number;
  availableAmount: number;
  paymentMethods: string[];
  terms?: string;
  isActive: boolean;
  completedTrades: number;
  createdAt: string;
}

export interface P2PTrade {
  id: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  buyerName?: string;
  sellerName?: string;
  asset: string;
  amount: number;
  price: number;
  totalFiat: number;
  status: 'PENDING' | 'PAID' | 'RELEASED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  type: 'bank' | 'ewallet' | 'cash';
  icon: string;
  isActive: boolean;
  requiresDetails: string[];
  countries: string[];
  processingTime: string;
  createdAt: string;
}

// ========== DISPUTE ==========

export interface Dispute {
  id: string;
  tradeId: string;
  initiatorId: string;
  initiatorName?: string;
  respondentId: string;
  respondentName?: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  assignedTo?: string;
  evidence: { type: string; url: string }[];
  createdAt: string;
  resolvedAt?: string;
}

// ========== KYC ==========

export interface KYCRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentType: 'ID_CARD' | 'PASSPORT' | 'DRIVING_LICENSE';
  documentFront: string;
  documentBack?: string;
  selfie: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// ========== WALLET ==========

export interface Wallet {
  id: string;
  userId: string;
  userName?: string;
  asset: string;
  network: string;
  address: string;
  balance: number;
  frozenBalance: number;
  isActive: boolean;
  createdAt: string;
}

// ========== SUPPORT ==========

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'general' | 'technical' | 'billing' | 'kyc' | 'dispute';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  assignedTo?: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  content: string;
  sender: 'user' | 'admin';
  senderName?: string;
  attachments?: string[];
  createdAt: string;
}

// ========== ANNOUNCEMENT ==========

export interface Announcement {
  id: string;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  type: 'info' | 'warning' | 'success' | 'promo';
  target: 'all' | 'verified' | 'merchants';
  isActive: boolean;
  isPinned: boolean;
  startDate: string;
  endDate?: string;
  viewCount: number;
  createdAt: string;
}

// ========== FEES ==========

export interface FeeRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'tiered';
  category: 'trading' | 'withdrawal' | 'deposit' | 'p2p' | 'swap' | 'staking';
  value: number;
  minAmount?: number;
  maxAmount?: number;
  tiers?: FeeTier[];
  isActive: boolean;
  appliesTo: 'all' | 'verified' | 'vip' | 'merchant';
  description: string;
}

export interface FeeTier {
  min: number;
  max: number;
  fee: number;
}

// ========== SECURITY ==========

export interface SecurityAlert {
  id: string;
  type: 'login_attempt' | 'suspicious_tx' | 'ip_blocked' | 'device_change' | 'large_withdrawal' | 'fraud_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userName?: string;
  details: string;
  ipAddress?: string;
  location?: string;
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved' | 'dismissed';
}

export interface BlockedEntity {
  id: string;
  type: 'ip' | 'device' | 'user' | 'country';
  value: string;
  reason: string;
  blockedAt: string;
  expiresAt?: string;
  blockedBy: string;
}

// ========== DASHBOARD ==========

export interface DashboardStats {
  users: { total: number; online: number; newToday: number; growth: number };
  transactions: { total: number; today: number; pending: number; volume24h: number };
  p2p: { activeOffers: number; activeTrades: number; completedToday: number; disputes: number };
  revenue: { today: number; week: number; month: number; fees: number };
  system: { uptime: string; requests: number; errors: number; latency: number };
}

export interface ChartData {
  volumeData: { date: string; volume: number; trades: number }[];
  userGrowth: { date: string; users: number; active: number }[];
  revenueData: { date: string; revenue: number; fees: number }[];
  assetDistribution: { name: string; value: number; color: string }[];
  topCountries: { country: string; users: number; volume: number }[];
}

// ========== SYSTEM ==========

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  lastChecked: string;
  services: ServiceStatus[];
  metrics: SystemMetrics;
  recentErrors: SystemError[];
}

export interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  lastError?: string;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeConnections: number;
  requestsPerMinute: number;
}

export interface SystemError {
  id: string;
  message: string;
  count: number;
  lastOccurred: string;
}

// ========== AUDIT LOG ==========

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  createdAt: string;
}

// ========== SETTINGS ==========

export interface SystemSettings {
  general: {
    platformName: string;
    platformNameAr: string;
    supportEmail: string;
    supportPhone: string;
    maintenanceMode: boolean;
  };
  fees: {
    tradingFee: number;
    withdrawalFee: number;
    p2pFee: number;
    minWithdrawal: number;
    maxWithdrawal: number;
  };
  limits: {
    dailyWithdrawalLimit: number;
    dailyP2PLimit: number;
    kycRequiredAmount: number;
  };
  security: {
    maxLoginAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
    require2FA: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
  };
}
