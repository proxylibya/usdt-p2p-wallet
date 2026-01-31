
import React from 'react';

export type CryptoSymbol = 'USDT' | 'USDC' | 'BUSD' | 'DAI' | 'BTC' | 'ETH' | 'BNB' | 'SOL' | 'XRP' | 'ADA' | 'DOGE' | 'DOT' | 'MATIC' | 'LTC' | 'AVAX';
export type NetworkType = 'TRC20' | 'SPL' | 'ERC20' | 'BEP20' | 'SOL' | 'Bitcoin' | 'Polygon' | 'Avalanche';

export interface Wallet {
  id: string;
  name: string;
  symbol: CryptoSymbol;
  network: NetworkType;
  address?: string;
  balance: number;
  lockedBalance?: number; // Funds in P2P Escrow or active Orders
  usdValue: number;
  change24h?: number;
}

export enum TransactionType {
  DEPOSIT = 'Deposit',
  WITHDRAW = 'Withdraw',
  SWAP_IN = 'Swap In',
  SWAP_OUT = 'Swap Out',
  P2P_BUY = 'P2P Buy',
  P2P_SELL = 'P2P Sell',
  TRANSFER = 'Transfer',
  LOCK = 'Escrow Lock', // Internal
  UNLOCK = 'Escrow Refund', // Internal
}

export enum TradeStatus {
  COMPLETED = 'Completed',
  PENDING = 'Pending',
  FAILED = 'Failed',
  CANCELLED = 'Cancelled',
  IN_PROGRESS = 'In Progress'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  asset: string;
  amount: number;
  usdValue: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
  network?: string;
  txId?: string;
  fromAddress?: string;
  toAddress?: string;
  networkFee?: number;
}

export interface PaymentMethod {
  key: string;
  label: string;
  scope: 'local' | 'global';
  countryCode?: 'LY' | 'EG' | 'TN' | 'TR' | 'SA';
}

export interface P2POffer {
  id: string;
  type: 'BUY' | 'SELL'; // Maker's Intent. SELL = Maker has crypto, wants Fiat.
  user: {
    name: string;
    rating: number;
    trades: number;
    avatarUrl: string;
    completionRate: number;
    isVerifiedMerchant: boolean;
  };
  userId?: string;
  isActive: boolean;
  asset: 'USDT' | 'USDC' | 'BUSD';
  fiatCurrency: 'LYD' | 'USD' | 'EGP' | 'TND' | 'EUR' | 'SAR' | 'TRY';
  countryCode: 'LY' | 'GLOBAL' | 'EG' | 'TN' | 'TR' | 'SA';
  price: number;
  available: number;
  minLimit: number;
  maxLimit: number;
  paymentMethods: string[];
  paymentDetails?: {
    [methodKey: string]: {
      'Account Name'?: string;
      'Bank Name'?: string;
      'Account Number'?: string;
      'Phone Number'?: string;
      'Email Address'?: string;
      'IBAN'?: string;
    }
  };
  terms?: string;
}

export interface Notification {
  id: string;
  icon: 'success' | 'error' | 'info';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export enum TradeStatusP2P {
  WAITING_FOR_PAYMENT = 'Waiting for Payment',
  PAID_CONFIRMED_BY_BUYER = 'Paid (Waiting Release)', // Specific state for "I have paid"
  WAITING_FOR_RELEASE = 'Waiting for Release', // Generic bucket
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  DISPUTED = 'Disputed', // Mediation State
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'counterparty' | 'system';
  text: string;
  attachmentUrl?: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface P2PTrade {
  id: string;
  offer: P2POffer;
  status: TradeStatusP2P;
  amount: number; // Crypto Amount (e.g. 100 USDT)
  fiatAmount: number; // Fiat Amount (e.g. 712 LYD)
  createdAt: string;
  expiresAt?: string;
  completedAt?: string;
  chatHistory: ChatMessage[];
  isMyRoleBuyer: boolean; // True if I am buying crypto, False if I am selling
  unreadMessages?: number;
  buyerName?: string;
  sellerName?: string;
  disputeReason?: string;
}

export interface PriceAlert {
  id: string;
  assetSymbol: 'USDT' | 'USDC' | 'BUSD' | 'DAI';
  targetPrice: number;
  priceAtCreation: number;
}

export interface SwapHistoryItem {
  id: string;
  fromAssetSymbol: 'USDT' | 'USDC' | 'BUSD' | 'DAI';
  fromAmount: number;
  toAssetSymbol: 'USDT' | 'USDC' | 'BUSD' | 'DAI';
  toAmount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

export enum KYCStatus {
    NOT_VERIFIED = 'Not Verified',
    PENDING = 'Pending',
    VERIFIED = 'Verified',
    REJECTED = 'Rejected'
}

export interface AddressBookEntry {
    id: string;
    label: string;
    address: string;
    asset: string;
    network: string;
}

export interface MarketCoin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  sparkline: number[];
}

export interface AdminUser {
    id: string;
    name: string;
    phoneNumber: string;
    avatarUrl: string;
    status: 'Active' | 'Banned' | 'Pending';
    joinDate: string;
    lastLogin: string;
    totalVolume: number;
    kycStatus: KYCStatus;
}

export interface DashboardStat {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
}
