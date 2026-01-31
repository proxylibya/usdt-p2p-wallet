/**
 * Swap Service - Handle crypto swap operations
 */

import apiClient from './apiClient';

export interface SwapPair {
  from: string;
  to: string;
  minAmount: number;
  maxAmount: number;
}

export interface SwapQuote {
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  feePercentage: number;
  expiresAt: string;
  quoteId: string;
}

export interface SwapResult {
  success: boolean;
  transactionId: string;
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  toAmount: number;
  fee: number;
}

export interface SwapHistoryItem {
  id: string;
  type: string;
  asset: string;
  amount: number;
  fee: number;
  status: string;
  metadata: {
    quoteId: string;
    fromAsset: string;
    toAsset: string;
    fromAmount: number;
    toAmount: number;
    rate: number;
  };
  createdAt: string;
}

export interface SwapHistoryResponse {
  items: SwapHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

class SwapService {
  /**
   * Get supported swap pairs
   */
  async getSupportedPairs(): Promise<SwapPair[]> {
    const response = await apiClient.get<SwapPair[]>('/api/v1/swap/pairs');
    return response.data;
  }

  /**
   * Get a quote for a swap
   */
  async getQuote(fromAsset: string, toAsset: string, fromAmount: number): Promise<SwapQuote> {
    const response = await apiClient.get<SwapQuote>('/api/v1/swap/quote', {
      fromAsset, 
      toAsset, 
      fromAmount: fromAmount.toString(),
    });
    return response.data;
  }

  /**
   * Execute a swap using a quote
   */
  async executeSwap(quoteId: string): Promise<SwapResult> {
    const response = await apiClient.post<SwapResult>('/api/v1/swap/execute', { quoteId });
    return response.data;
  }

  /**
   * Get swap history
   */
  async getHistory(page: number = 1, limit: number = 20): Promise<SwapHistoryResponse> {
    const response = await apiClient.get<SwapHistoryResponse>('/api/v1/swap/history', {
      page: page.toString(),
      limit: limit.toString(),
    });
    return response.data;
  }

  /**
   * Calculate estimated output amount (client-side estimate)
   */
  estimateOutput(fromAmount: number, rate: number, feePercentage: number = 0.5): number {
    const grossAmount = fromAmount * rate;
    const fee = grossAmount * (feePercentage / 100);
    return grossAmount - fee;
  }

  /**
   * Format asset pair display
   */
  formatPair(from: string, to: string): string {
    return `${from}/${to}`;
  }

  /**
   * Check if a swap pair is supported
   */
  async isPairSupported(from: string, to: string): Promise<boolean> {
    const pairs = await this.getSupportedPairs();
    return pairs.some(p => p.from === from && p.to === to);
  }
}

export const swapService = new SwapService();
export default swapService;
