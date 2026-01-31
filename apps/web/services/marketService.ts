/**
 * Market Service - Market Data & Prices API calls
 */

import apiClient from './apiClient';
import { MarketCoin } from '../types';

// ============================================
// 📝 TYPES
// ============================================

export interface PriceAlert {
  id: string;
  assetSymbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: string;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketStats {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  marketCapChange24h: number;
}

// ============================================
// 📊 MARKET SERVICE
// ============================================

export const marketService = {
  /**
   * Get all market coins
   */
  getMarketCoins: async () => {
    return apiClient.get<MarketCoin[]>('/market/coins');
  },

  /**
   * Get coin details by ID
   */
  getCoinById: async (id: string) => {
    return apiClient.get<MarketCoin>(`/market/coins/${id}`);
  },

  /**
   * Get coin price history (candles)
   */
  getCoinCandles: async (symbol: string, interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h', limit: number = 100) => {
    return apiClient.get<CandleData[]>(`/market/candles/${symbol}`, { 
      interval, 
      limit: String(limit) 
    });
  },

  /**
   * Get live prices for multiple symbols
   */
  getLivePrices: async (symbols: string[]) => {
    return apiClient.get<Record<string, { price: number; change24h: number }>>('/market/prices', { 
      symbols: symbols.join(',') 
    });
  },

  /**
   * Get market statistics
   */
  getMarketStats: async () => {
    return apiClient.get<MarketStats>('/market/stats');
  },

  /**
   * Search coins
   */
  searchCoins: async (query: string) => {
    return apiClient.get<MarketCoin[]>('/market/search', { q: query });
  },

  // ========== PRICE ALERTS ==========

  /**
   * Get user's price alerts
   */
  getPriceAlerts: async () => {
    return apiClient.get<PriceAlert[]>('/market/alerts');
  },

  /**
   * Create price alert
   */
  createPriceAlert: async (assetSymbol: string, targetPrice: number, condition: 'above' | 'below') => {
    return apiClient.post<PriceAlert>('/market/alerts', { assetSymbol, targetPrice, condition });
  },

  /**
   * Delete price alert
   */
  deletePriceAlert: async (id: string) => {
    return apiClient.delete<{ message: string }>(`/market/alerts/${id}`);
  },

  /**
   * Toggle price alert
   */
  togglePriceAlert: async (id: string, isActive: boolean) => {
    return apiClient.patch<PriceAlert>(`/market/alerts/${id}`, { isActive });
  },

  // ========== STABLECOIN SPECIFIC ==========

  /**
   * Get stablecoin prices (USDT, USDC, etc.)
   */
  getStablecoinPrices: async () => {
    return apiClient.get<Record<string, { price: number; change24h: number }>>('/market/stablecoins');
  },

  /**
   * Get parallel market rates (for local currencies)
   */
  getParallelRates: async (fiatCurrency: string) => {
    return apiClient.get<{ official: number; parallel: number; spread: number }>(`/market/parallel-rates/${fiatCurrency}`);
  }
};

export default marketService;
