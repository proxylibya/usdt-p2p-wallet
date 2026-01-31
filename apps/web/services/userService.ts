/**
 * User Service - User Profile, KYC, and Security API calls
 */

import apiClient from './apiClient';

// ============================================
// 📝 TYPES
// ============================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  countryCode: string;
  kycStatus: 'NOT_VERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  wallets?: any[];
}

export interface UserStats {
  totalBalance: number;
  walletsCount: number;
  transactionsCount: number;
  p2pTradesCount: number;
}

export interface KycSubmission {
  documentType: string;
  documentNumber: string;
  frontImage: string;
  backImage?: string;
  selfieImage: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  lastLoginAt: string;
  hasSecurityQuestions?: boolean;
}

// ============================================
// 👤 USER SERVICE
// ============================================

export const userService = {
  /**
   * Get current user profile
   */
  getProfile: async () => {
    return apiClient.get<UserProfile>('/users/me');
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: { name?: string; email?: string; avatarUrl?: string }) => {
    return apiClient.patch<UserProfile>('/users/me', data);
  },

  /**
   * Get user statistics
   */
  getStats: async () => {
    return apiClient.get<UserStats>('/users/me/stats');
  },

  // ========== KYC ==========

  /**
   * Get KYC status
   */
  getKycStatus: async () => {
    return apiClient.get<{ kycStatus: string; kycData?: any }>('/users/kyc/status');
  },

  /**
   * Submit KYC documents
   */
  submitKyc: async (data: KycSubmission) => {
    return apiClient.post<{ message: string }>('/users/kyc/submit', data);
  },

  // ========== SECURITY ==========

  /**
   * Get security settings
   */
  getSecuritySettings: async () => {
    return apiClient.get<SecuritySettings>('/users/security');
  },

  /**
   * Enable 2FA
   */
  enable2FA: async (secret: string) => {
    return apiClient.post<{ message: string }>('/users/security/2fa/enable', { secret });
  },

  /**
   * Setup 2FA (get secret + QR)
   */
  setup2FA: async () => {
    return apiClient.post<{ secret: string; otpauthUrl: string }>('/users/security/2fa/setup');
  },

  /**
   * Verify 2FA code
   */
  verify2FA: async (code: string) => {
    return apiClient.post<{ message?: string }>('/users/security/2fa/verify', { code });
  },

  /**
   * Disable 2FA
   */
  disable2FA: async () => {
    return apiClient.post<{ message: string }>('/users/security/2fa/disable');
  },

  /**
   * Set security questions
   */
  setSecurityQuestions: async (questions: { question: string; answer: string }[]) => {
    return apiClient.post<{ message: string; hasSecurityQuestions: boolean }>('/users/security/questions', { questions });
  },

  /**
   * Upload user avatar
   */
  uploadAvatar: async (file: File) => {
    return apiClient.upload<{ url: string; key: string }>('/upload', file);
  },
};

export default userService;
