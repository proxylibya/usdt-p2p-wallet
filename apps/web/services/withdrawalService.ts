/**
 * 💸 Withdrawal Service - Enterprise-grade secure withdrawal flow
 * Implements 2-step OTP verification for withdrawals
 */

import { apiClient } from './apiClient';

export interface WithdrawalRequest {
  asset: string;
  network: string;
  address: string;
  amount: number;
  memo?: string;
}

export interface WithdrawalRequestResponse {
  requestId: string;
  transactionId: string;
  message: string;
  expiresAt: string;
  amount: number;
  fee: number;
  total: number;
  address: string;
  network: string;
}

export interface WithdrawalConfirmResponse {
  transactionId: string;
  transactionRef: string;
  message: string;
  status: string;
  amount: number;
  fee: number;
  total: number;
  estimatedTime: string;
}

export interface WithdrawalStatus {
  id: string;
  status: string;
  amount: number;
  fee: number;
  asset: string;
  network: string;
  address: string;
  createdAt: string;
  txHash?: string;
}

class WithdrawalService {
  /**
   * Step 1: Request withdrawal - initiates secure withdrawal and sends OTP
   */
  async requestWithdrawal(data: WithdrawalRequest): Promise<WithdrawalRequestResponse> {
    const response = await apiClient.post<WithdrawalRequestResponse>(
      '/wallets/withdraw/request',
      data
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to initiate withdrawal');
    }

    return response.data;
  }

  /**
   * Step 2: Confirm withdrawal with OTP
   */
  async confirmWithdrawal(requestId: string, otp: string): Promise<WithdrawalConfirmResponse> {
    const response = await apiClient.post<WithdrawalConfirmResponse>(
      '/wallets/withdraw/confirm',
      { requestId, otp }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to confirm withdrawal');
    }

    return response.data;
  }

  /**
   * Get withdrawal status
   */
  async getWithdrawalStatus(transactionId: string): Promise<WithdrawalStatus> {
    const response = await apiClient.get<WithdrawalStatus>(
      `/wallets/withdraw/${transactionId}/status`
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to get withdrawal status');
    }

    return response.data;
  }

  /**
   * Legacy single-step withdrawal (for backward compatibility)
   */
  async withdraw(data: WithdrawalRequest): Promise<any> {
    const response = await apiClient.post('/wallets/withdraw', data);

    if (!response.success) {
      throw new Error(response.error || 'Withdrawal failed');
    }

    return response.data;
  }

  /**
   * Validate withdrawal address before submitting
   */
  async validateAddress(address: string, network: string): Promise<{ valid: boolean; message: string }> {
    const response = await apiClient.post<{ valid: boolean; message: string }>(
      '/wallets/validate-address',
      { address, network }
    );

    if (!response.success) {
      return { valid: false, message: 'Address validation failed' };
    }

    return response.data;
  }

  /**
   * Get withdrawal fee estimate
   */
  async getWithdrawalFee(asset: string, network: string, amount: number): Promise<{ fee: number; total: number }> {
    const response = await apiClient.get<{ fee: number; total: number }>(
      '/wallets/withdrawal-fee',
      { asset, network, amount: amount.toString() }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to get withdrawal fee');
    }

    return response.data;
  }
}

export const withdrawalService = new WithdrawalService();
export default withdrawalService;
