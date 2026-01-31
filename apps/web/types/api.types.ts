/**
 * API Response Types - Type-safe API responses
 */

// ============================================
// 🌐 BASE RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
}

export interface ApiError {
  success: false;
  error: {
    statusCode: number;
    message: string;
    error: string;
    path: string;
    timestamp: string;
    details?: ValidationError[];
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================
// 👤 AUTH TYPES
// ============================================

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
}

export interface OtpResponse {
  message: string;
  otpSent: boolean;
  expiresIn: number;
}

export interface RegisterResponse {
  userId: string;
  message: string;
  otpSent: boolean;
}

// ============================================
// 👤 USER TYPES
// ============================================

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  kycStatus: KycStatus;
  isActive: boolean;
  createdAt: string;
}

export type KycStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface UserStats {
  totalTrades: number;
  completedTrades: number;
  successRate: number;
  totalVolume: number;
  averageRating: number;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  hasSecurityQuestions: boolean;
  lastPasswordChange: string;
  activeSessions: number;
}

// ============================================
// 💰 WALLET TYPES
// ============================================

export interface Wallet {
  id: string;
  asset: string;
  network: string;
  balance: number;
  lockedBalance: number;
  accountType: 'SPOT' | 'FUNDING';
}

export interface Transaction {
  id: string;
  type: TransactionType;
  asset: string;
  amount: number;
  fee: number;
  status: TransactionStatus;
  txHash?: string;
  address?: string;
  createdAt: string;
  completedAt?: string;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'P2P_BUY' | 'P2P_SELL' | 'SWAP';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface DepositAddress {
  address: string;
  network: string;
  asset: string;
  memo?: string;
  qrCode: string;
}

export interface PortfolioValue {
  totalUsd: number;
  change24h: number;
  wallets: Wallet[];
}

// ============================================
// 🤝 P2P TYPES
// ============================================

export interface P2POffer {
  id: string;
  type: 'BUY' | 'SELL';
  asset: string;
  fiatCurrency: string;
  price: number;
  available: number;
  minLimit: number;
  maxLimit: number;
  paymentMethods: string[];
  terms?: string;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
    completedTrades: number;
    rating: number;
  };
  createdAt: string;
}

export interface P2PTrade {
  id: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  fiatAmount: number;
  price: number;
  status: TradeStatus;
  paymentMethod: string;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
  offer: P2POffer;
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
}

export type TradeStatus = 
  | 'WAITING_PAYMENT' 
  | 'PAID' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'DISPUTED'
  | 'EXPIRED';

export interface ChatMessage {
  id: string;
  tradeId: string;
  senderId: string;
  text: string;
  attachmentUrl?: string;
  createdAt: string;
  isRead: boolean;
}

export interface PaymentMethod {
  id: string;
  method: string;
  details: Record<string, string>;
}

// ============================================
// 📊 MARKET TYPES
// ============================================

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  image?: string;
}

export interface PriceAlert {
  id: string;
  assetSymbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
  triggeredAt?: string;
}

// ============================================
// 🔔 NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

export type NotificationType = 
  | 'TRADE_STARTED'
  | 'PAYMENT_RECEIVED'
  | 'CRYPTO_RELEASED'
  | 'TRADE_COMPLETED'
  | 'TRADE_CANCELLED'
  | 'DISPUTE_OPENED'
  | 'PRICE_ALERT'
  | 'DEPOSIT_CONFIRMED'
  | 'WITHDRAWAL_COMPLETED'
  | 'SYSTEM';

// ============================================
// 🔄 SWAP TYPES
// ============================================

export interface SwapQuote {
  id: string;
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  expiresAt: string;
}

export interface SwapPair {
  fromAsset: string;
  toAsset: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
}
