/**
 * Wallet Service - Wallet & Transaction API calls
 */

import apiClient from './apiClient';
import { Wallet, Transaction } from '../types';

// ============================================
// 📝 TYPES
// ============================================

export interface DepositAddressResponse {
  address: string;
  network: string;
  asset: string;
  memo?: string;
  qrCode: string;
}

export interface WithdrawRequest {
  asset: string;
  network: string;
  address: string;
  amount: number;
  memo?: string;
}

export interface TransferRequest {
  asset: string;
  amount: number;
  fromAccount: 'Spot' | 'Funding';
  toAccount: 'Spot' | 'Funding';
}

export interface SendToUserRequest {
  asset: string;
  amount: number;
  recipient: string;
  network?: string;
}

export interface RecipientLookupResponse {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface TransactionFilters {
  type?: string;
  asset?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// 💰 WALLET SERVICE
// ============================================

export const walletService = {
  /**
   * Get all user wallets (Spot)
   */
  getWallets: async () => {
    return apiClient.get<Wallet[]>('/wallets');
  },

  /**
   * Get funding wallets
   */
  getFundingWallets: async () => {
    return apiClient.get<Wallet[]>('/wallets/funding');
  },

  /**
   * Get wallet by asset symbol
   */
  getWalletByAsset: async (asset: string) => {
    return apiClient.get<Wallet>(`/wallets/${asset}`);
  },

  /**
   * Get deposit address for asset
   */
  getDepositAddress: async (asset: string, network: string) => {
    return apiClient.get<DepositAddressResponse>(`/wallets/deposit-address`, { asset, network });
  },

  /**
   * Request withdrawal
   */
  withdraw: async (data: WithdrawRequest) => {
    return apiClient.post<{ transactionId: string; message: string }>('/wallets/withdraw', data);
  },

  /**
   * Internal transfer between Spot and Funding
   */
  transfer: async (data: TransferRequest) => {
    const payload = {
      asset: data.asset,
      amount: data.amount,
      from: data.fromAccount,
      to: data.toAccount,
    };
    return apiClient.post<{ message: string }>('/wallets/transfer', payload);
  },

  /**
   * Send assets to another user
   */
  sendToUser: async (data: SendToUserRequest) => {
    return apiClient.post<{ message: string; transactionId: string; recipientId: string }>('/wallets/send', data);
  },

  /**
   * Lookup recipient for internal transfer
   */
  lookupRecipient: async (recipient: string) => {
    return apiClient.get<RecipientLookupResponse>('/wallets/recipient-lookup', { recipient });
  },

  /**
   * Get transaction history
   */
  getTransactions: async (filters?: TransactionFilters) => {
    const params: Record<string, string> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params[key] = String(value);
      });
    }
    return apiClient.get<PaginatedResponse<Transaction>>('/wallets/transactions', params);
  },

  /**
   * Get transaction by ID
   */
  getTransactionById: async (id: string) => {
    return apiClient.get<Transaction>(`/wallets/transactions/${id}`);
  },

  /**
   * Get total portfolio value
   */
  getPortfolioValue: async () => {
    return apiClient.get<{ totalUsd: number; change24h: number; wallets: Wallet[] }>('/wallets/portfolio');
  },

  /**
   * Validate withdrawal address
   */
  validateAddress: async (address: string, network: string) => {
    return apiClient.post<{ valid: boolean; message?: string }>('/wallets/validate-address', { address, network });
  },

  /**
   * Get withdrawal fee estimate
   */
  getWithdrawalFee: async (asset: string, network: string, amount: number) => {
    return apiClient.get<{ fee: number; total: number }>('/wallets/withdrawal-fee', { 
      asset, 
      network, 
      amount: String(amount) 
    });
  }
};

export default walletService;
