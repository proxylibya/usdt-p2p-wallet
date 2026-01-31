/**
 * P2P Service - P2P Trading API calls
 */

import apiClient, { API_BASE_URL, TokenManager } from './apiClient';
import { P2POffer, P2PTrade, ChatMessage } from '../types';

// ============================================
// 📝 TYPES
// ============================================

export interface CreateOfferRequest {
  type: 'BUY' | 'SELL';
  asset: 'USDT' | 'USDC' | 'BUSD';
  fiatCurrency: string;
  price: number;
  available: number;
  minLimit: number;
  maxLimit: number;
  paymentMethods: string[];
  paymentDetails?: Record<string, Record<string, string>>;
  terms?: string;
}

export interface UpdateOfferRequest extends Partial<CreateOfferRequest> {
  isActive?: boolean;
}

export interface OfferFilters {
  type?: 'BUY' | 'SELL';
  asset?: string;
  fiatCurrency?: string;
  countryCode?: string;
  paymentMethod?: string;
  amount?: number;
  page?: number;
  limit?: number;
}

export interface StartTradeRequest {
  offerId: string;
  amount: number;
}

export interface SendMessageRequest {
  tradeId: string;
  text: string;
  attachmentUrl?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// 🤝 P2P SERVICE
// ============================================

export const p2pService = {
  // ========== OFFERS ==========

  /**
   * Get P2P offers with filters
   */
  getOffers: async (filters?: OfferFilters) => {
    const params: Record<string, string> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params[key] = String(value);
      });
    }
    return apiClient.get<PaginatedResponse<P2POffer>>('/p2p/offers', params);
  },

  /**
   * Get offer by ID
   */
  getOfferById: async (id: string) => {
    return apiClient.get<P2POffer>(`/p2p/offers/${id}`);
  },

  /**
   * Create new offer
   */
  createOffer: async (data: CreateOfferRequest) => {
    return apiClient.post<P2POffer>('/p2p/offers', data);
  },

  /**
   * Update offer
   */
  updateOffer: async (id: string, data: UpdateOfferRequest) => {
    return apiClient.patch<P2POffer>(`/p2p/offers/${id}`, data);
  },

  /**
   * Delete/Deactivate offer
   */
  deleteOffer: async (id: string) => {
    return apiClient.delete<{ message: string }>(`/p2p/offers/${id}`);
  },

  /**
   * Get my offers
   */
  getMyOffers: async () => {
    return apiClient.get<P2POffer[]>('/p2p/offers/mine');
  },

  // ========== TRADES ==========

  /**
   * Start a trade from offer
   */
  startTrade: async (data: StartTradeRequest) => {
    return apiClient.post<P2PTrade>('/p2p/trades', data);
  },

  /**
   * Get trade by ID
   */
  getTradeById: async (id: string) => {
    return apiClient.get<P2PTrade>(`/p2p/trades/${id}`);
  },

  /**
   * Get my active trades
   */
  getActiveTrades: async () => {
    return apiClient.get<P2PTrade[]>('/p2p/trades/active');
  },

  /**
   * Get trade history
   */
  getTradeHistory: async (page?: number, limit?: number) => {
    const params: Record<string, string> = {};
    if (page) params.page = String(page);
    if (limit) params.limit = String(limit);
    return apiClient.get<PaginatedResponse<P2PTrade>>('/p2p/trades/history', params);
  },

  /**
   * Mark payment as sent (Buyer action)
   */
  confirmPayment: async (tradeId: string) => {
    return apiClient.post<P2PTrade>(`/p2p/trades/${tradeId}/confirm-payment`);
  },

  /**
   * Release crypto (Seller action)
   */
  releaseCrypto: async (tradeId: string) => {
    return apiClient.post<P2PTrade>(`/p2p/trades/${tradeId}/release`);
  },

  /**
   * Cancel trade
   */
  cancelTrade: async (tradeId: string, reason?: string) => {
    return apiClient.post<P2PTrade>(`/p2p/trades/${tradeId}/cancel`, { reason });
  },

  /**
   * Open dispute
   */
  openDispute: async (tradeId: string, reason: string, evidence?: string[]) => {
    return apiClient.post<P2PTrade>(`/p2p/trades/${tradeId}/dispute`, { reason, evidence });
  },

  /**
   * Resolve dispute (admin or participant)
   */
  resolveDispute: async (tradeId: string, resolution: 'buyer_wins' | 'seller_wins') => {
    return apiClient.post<P2PTrade>(`/p2p/trades/${tradeId}/resolve`, { resolution });
  },

  // ========== CHAT ==========

  /**
   * Get trade chat messages
   */
  getChatMessages: async (tradeId: string) => {
    return apiClient.get<ChatMessage[]>(`/p2p/trades/${tradeId}/messages`);
  },

  /**
   * Send chat message
   */
  sendMessage: async (data: SendMessageRequest) => {
    return apiClient.post<ChatMessage>(`/p2p/trades/${data.tradeId}/messages`, {
      text: data.text,
      attachmentUrl: data.attachmentUrl
    });
  },

  /**
   * Upload attachment for chat
   */
  uploadAttachment: async (tradeId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/p2p/trades/${tradeId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${TokenManager.getAccessToken() || ''}`
      }
    });
    
    return response.json();
  },

  // ========== PAYMENT METHODS ==========

  /**
   * Get user's saved payment methods
   */
  getPaymentMethods: async () => {
    return apiClient.get<Array<{ id: string; method: string; details: Record<string, string> }>>('/p2p/payment-methods');
  },

  /**
   * Save payment method
   */
  savePaymentMethod: async (method: string, details: Record<string, string>) => {
    return apiClient.post<{ id: string }>('/p2p/payment-methods', { method, details });
  },

  /**
   * Delete payment method
   */
  deletePaymentMethod: async (id: string) => {
    return apiClient.delete<{ message: string }>(`/p2p/payment-methods/${id}`);
  }
};

export default p2pService;
