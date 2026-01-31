/**
 * Auth Service - Authentication API calls
 */

import apiClient, { TokenManager } from './apiClient';

// ============================================
// 📝 TYPES
// ============================================

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface OtpVerifyRequest {
  phone: string;
  otp: string;
  type: 'login' | 'register';
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl: string;
    kycStatus: string;
    countryCode: string;
    preferredCurrency: string;
    preferredLanguage: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ============================================
// 🔐 AUTH SERVICE
// ============================================

export const authService = {
  /**
   * Login with phone and password
   */
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data, { skipAuth: true });
    
    const anyData = response.data as any;
    if (response.success && anyData?.accessToken && anyData?.refreshToken) {
      TokenManager.setTokens(anyData.accessToken, anyData.refreshToken);
    }
    
    return response;
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest) => {
    return apiClient.post<{ message: string }>('/auth/register', data, { skipAuth: true });
  },

  /**
   * Verify OTP code
   */
  verifyOtp: async (data: OtpVerifyRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/verify-otp', data, { skipAuth: true });
    
    if (response.success && response.data) {
      TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response;
  },

  /**
   * Request OTP resend
   */
  resendOtp: async (phone: string, type: 'login' | 'register') => {
    return apiClient.post<{ message: string }>('/auth/resend-otp', { phone, type }, { skipAuth: true });
  },

  /**
   * Login with social provider
   */
  socialLogin: async (provider: 'google' | 'apple', token: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/social', { provider, token }, { skipAuth: true });
    
    if (response.success && response.data) {
      TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response;
  },

  /**
   * Logout user
   */
  logout: async () => {
    const refreshToken = TokenManager.getRefreshToken();
    await apiClient.post('/auth/logout', { refreshToken });
    TokenManager.clearTokens();
  },

  /**
   * Forgot password - request reset
   */
  forgotPassword: async (phone: string) => {
    return apiClient.post<{ message: string }>('/auth/forgot-password', { phone }, { skipAuth: true });
  },

  /**
   * Reset password with OTP
   */
  resetPassword: async (phone: string, otp: string, newPassword: string) => {
    return apiClient.post<{ message: string }>('/auth/reset-password', { phone, otp, newPassword }, { skipAuth: true });
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    return apiClient.get<AuthResponse['user']>('/auth/profile');
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<AuthResponse['user']>) => {
    return apiClient.patch<AuthResponse['user']>('/auth/profile', data);
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiClient.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword });
  },

  /**
   * Setup biometric authentication
   */
  setupBiometrics: async (publicKey: string) => {
    return apiClient.post<{ message: string }>('/auth/biometrics/setup', { publicKey });
  },

  /**
   * Verify biometric authentication
   */
  verifyBiometrics: async (signature: string, challenge: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/biometrics/verify', { signature, challenge });
    
    if (response.success && response.data) {
      TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response;
  }
};

export default authService;
