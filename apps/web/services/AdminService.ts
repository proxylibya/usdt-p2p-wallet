/**
 * Admin Service - Handle admin panel API operations
 */

import apiClient from './apiClient';

// ============================================
// Types
// ============================================

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  pendingKyc: number;
  openDisputes: number;
  totalVolume: number;
}

export interface AdminUser {
  id: string;
  phone: string;
  email: string;
  name: string;
  isActive: boolean;
  isBanned: boolean;
  kycStatus: 'NOT_VERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  lastLoginAt: string;
  wallets?: any[];
  _count?: {
    transactions: number;
    p2pTradesAsBuyer: number;
    p2pTradesAsSeller: number;
  };
}

export interface KycApplication {
  id: string;
  userId: string;
  documentType: string;
  documentNumber: string;
  frontImage: string;
  backImage: string;
  selfieImage: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface AdminTransaction {
  id: string;
  userId: string;
  type: string;
  asset: string;
  amount: number;
  fee: number;
  status: string;
  createdAt: string;
  user: {
    name: string;
    phone: string;
  };
}

export interface P2PDispute {
  id: string;
  status: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  fiatAmount: number;
  disputeReason: string;
  createdAt: string;
  buyer: { name: string; phone: string };
  seller: { name: string; phone: string };
  offer: { asset: string; fiatCurrency: string };
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// Admin Service
// ============================================

class AdminService {
  private basePath = '/api/v1/admin';

  // ========== DASHBOARD ==========

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>(`${this.basePath}/dashboard/stats`);
    return response.data;
  }

  // ========== USERS ==========

  async getUsers(
    page: number = 1,
    limit: number = 20,
    filters?: { search?: string; status?: string; kycStatus?: string }
  ): Promise<PaginatedResponse<AdminUser>> {
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };
    if (filters?.search) params.search = filters.search;
    if (filters?.status) params.status = filters.status;
    if (filters?.kycStatus) params.kycStatus = filters.kycStatus;

    const response = await apiClient.get<PaginatedResponse<AdminUser>>(`${this.basePath}/users`, params);
    return response.data;
  }

  async getUserDetails(userId: string): Promise<AdminUser> {
    const response = await apiClient.get<AdminUser>(`${this.basePath}/users/${userId}`);
    return response.data;
  }

  async updateUserStatus(
    userId: string,
    data: { isActive?: boolean; isBanned?: boolean; banReason?: string }
  ): Promise<AdminUser> {
    const response = await apiClient.put<AdminUser>(`${this.basePath}/users/${userId}/status`, data);
    return response.data;
  }

  async banUser(userId: string, reason: string): Promise<AdminUser> {
    return this.updateUserStatus(userId, { isBanned: true, banReason: reason });
  }

  async unbanUser(userId: string): Promise<AdminUser> {
    return this.updateUserStatus(userId, { isBanned: false });
  }

  // ========== KYC ==========

  async getPendingKyc(page: number = 1, limit: number = 20): Promise<PaginatedResponse<KycApplication>> {
    const response = await apiClient.get<PaginatedResponse<KycApplication>>(
      `${this.basePath}/kyc/pending`,
      { page: page.toString(), limit: limit.toString() }
    );
    return response.data;
  }

  async verifyKyc(userId: string, status: 'VERIFIED' | 'REJECTED', reason?: string): Promise<any> {
    const response = await apiClient.put<any>(`${this.basePath}/kyc/${userId}/verify`, { status, reason });
    return response.data;
  }

  async approveKyc(userId: string): Promise<any> {
    return this.verifyKyc(userId, 'VERIFIED');
  }

  async rejectKyc(userId: string, reason: string): Promise<any> {
    return this.verifyKyc(userId, 'REJECTED', reason);
  }

  // ========== TRANSACTIONS ==========

  async getTransactions(
    page: number = 1,
    limit: number = 20,
    filters?: { type?: string; status?: string; userId?: string }
  ): Promise<PaginatedResponse<AdminTransaction>> {
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };
    if (filters?.type) params.type = filters.type;
    if (filters?.status) params.status = filters.status;
    if (filters?.userId) params.userId = filters.userId;

    const response = await apiClient.get<PaginatedResponse<AdminTransaction>>(
      `${this.basePath}/transactions`,
      params
    );
    return response.data;
  }

  async updateTransaction(
    transactionId: string,
    data: { status: string; adminNote?: string }
  ): Promise<AdminTransaction> {
    const response = await apiClient.put<AdminTransaction>(
      `${this.basePath}/transactions/${transactionId}`,
      data
    );
    return response.data;
  }

  // ========== DISPUTES ==========

  async getDisputes(page: number = 1, limit: number = 20): Promise<PaginatedResponse<P2PDispute>> {
    const response = await apiClient.get<PaginatedResponse<P2PDispute>>(
      `${this.basePath}/disputes`,
      { page: page.toString(), limit: limit.toString() }
    );
    return response.data;
  }

  async resolveDispute(
    tradeId: string,
    data: { winner: 'buyer' | 'seller'; reason: string }
  ): Promise<any> {
    const response = await apiClient.post<any>(`${this.basePath}/disputes/${tradeId}/resolve`, data);
    return response.data;
  }

  // ========== AUDIT LOGS ==========

  async getAuditLogs(page: number = 1, limit: number = 50): Promise<PaginatedResponse<AuditLog>> {
    const response = await apiClient.get<PaginatedResponse<AuditLog>>(
      `${this.basePath}/audit-logs`,
      { page: page.toString(), limit: limit.toString() }
    );
    return response.data;
  }
}

export const adminService = new AdminService();
export default adminService;
