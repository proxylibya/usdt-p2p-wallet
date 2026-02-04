/**
 * API Client - Enterprise-grade HTTP client for Backend communication
 * 
 * Features:
 * - Automatic token refresh
 * - Request/Response interceptors
 * - Error handling
 * - Retry logic
 * - Request cancellation
 */

// ============================================
// 🔧 CONFIGURATION
// ============================================

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';
const REFRESH_TOKEN_URL = '/auth/refresh';

// Storage keys
const ACCESS_TOKEN_KEY = 'usdt_wallet_access_token';
const REFRESH_TOKEN_KEY = 'usdt_wallet_refresh_token';

// ============================================
// 🔑 TOKEN MANAGEMENT
// ============================================

export const TokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
};

// ============================================
// 🌐 API CLIENT
// ============================================

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  data?: any;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  retries?: number;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Subscribe to token refresh
  private subscribeTokenRefresh(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  // Notify all subscribers with new token
  private onTokenRefreshed(token: string): void {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}${REFRESH_TOKEN_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        TokenManager.clearTokens();
        return null;
      }

      const data = await response.json();
      TokenManager.setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      TokenManager.clearTokens();
      return null;
    }
  }

  // Build headers
  private buildHeaders(config: RequestConfig): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...config.headers
    });

    if (!config.skipAuth) {
      const token = TokenManager.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  // Build URL with query params
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  // Main request method
  async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const { method, endpoint, data, params, retries = 1 } = config;

    // Check if token needs refresh
    const accessToken = TokenManager.getAccessToken();
    if (accessToken && TokenManager.isTokenExpired(accessToken) && !config.skipAuth) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        const newToken = await this.refreshAccessToken();
        this.isRefreshing = false;
        
        if (newToken) {
          this.onTokenRefreshed(newToken);
        } else {
          // Token refresh failed - redirect to login
          window.dispatchEvent(new CustomEvent('auth:logout'));
          return { data: null as T, success: false, error: 'Session expired' };
        }
      } else {
        // Wait for token refresh
        await new Promise<void>(resolve => {
          this.subscribeTokenRefresh(() => resolve());
        });
      }
    }

    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders(config);

    const fetchConfig: RequestInit = {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) })
    };

    try {
      const response = await fetch(url, fetchConfig);

      // Handle 401 - Unauthorized
      if (response.status === 401 && !config.skipAuth) {
        const newToken = await this.refreshAccessToken();
        if (newToken && retries > 0) {
          return this.request({ ...config, retries: retries - 1 });
        }
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return { data: null as T, success: false, error: 'Unauthorized' };
      }

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Server returned non-JSON (likely HTML error page or Backend unavailable)
        return {
          data: null as T,
          success: false,
          error: 'Backend unavailable'
        };
      }

      const responseData = await response.json();

      if (!response.ok) {
        return {
          data: null as T,
          success: false,
          error: responseData.message || `Error: ${response.status}`
        };
      }

      return {
        data: responseData,
        success: true
      };
    } catch (error) {
      // Log network errors in development for debugging
      if (import.meta.env.DEV) {
        console.debug('[API] Request failed:', endpoint, error);
      }
      return {
        data: null as T,
        success: false,
        error: 'Backend unavailable'
      };
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, params?: Record<string, string>, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', endpoint, params, ...config });
  }

  async post<T>(endpoint: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', endpoint, data, ...config });
  }

  async put<T>(endpoint: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', endpoint, data, ...config });
  }

  async patch<T>(endpoint: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', endpoint, data, ...config });
  }

  async delete<T>(endpoint: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', endpoint, ...config });
  }

  // Upload method
  async upload<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const url = this.buildUrl(endpoint);
    const token = TokenManager.getAccessToken();
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.status === 401) {
        // Simple token expiry handling for upload
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
          });
          const retryData = await retryResponse.json();
          return {
            data: retryData,
            success: retryResponse.ok,
            message: retryData.message
          };
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        return {
          data: null as T,
          success: false,
          error: errorData.message || `Upload failed with status ${response.status}`
        };
      }

      const data = await response.json();
      return {
        data: data.data || data,
        success: true,
        message: data.message
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('[API] Upload failed:', endpoint, error);
      }
      return {
        data: null as T,
        success: false,
        error: 'Upload failed'
      };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;
