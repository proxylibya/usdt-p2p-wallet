/**
 * Notification Service - Notifications API calls
 */

import apiClient from './apiClient';
import { Notification } from '../types';

// ============================================
// 📝 TYPES
// ============================================

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  priceAlerts: boolean;
  tradeUpdates: boolean;
  securityAlerts: boolean;
  promotions: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

// ============================================
// 🔔 NOTIFICATION SERVICE
// ============================================

export const notificationService = {
  /**
   * Get all notifications
   */
  getNotifications: async (page: number = 1, limit: number = 20) => {
    return apiClient.get<PaginatedResponse<Notification>>('/notifications', { 
      page: String(page), 
      limit: String(limit) 
    });
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: async () => {
    return apiClient.get<{ count: number }>('/notifications/unread-count');
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: string) => {
    return apiClient.patch<Notification>(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    return apiClient.post<{ message: string }>('/notifications/mark-all-read');
  },

  /**
   * Delete notification
   */
  deleteNotification: async (id: string) => {
    return apiClient.delete<{ message: string }>(`/notifications/${id}`);
  },

  /**
   * Clear all notifications
   */
  clearAll: async () => {
    return apiClient.delete<{ message: string }>('/notifications/clear-all');
  },

  // ========== SETTINGS ==========

  /**
   * Get notification settings
   */
  getSettings: async () => {
    return apiClient.get<NotificationSettings>('/notifications/settings');
  },

  /**
   * Update notification settings
   */
  updateSettings: async (settings: Partial<NotificationSettings>) => {
    return apiClient.patch<NotificationSettings>('/notifications/settings', settings);
  },

  // ========== PUSH NOTIFICATIONS ==========

  /**
   * Register device for push notifications
   */
  registerDevice: async (token: string, platform: 'ios' | 'android' | 'web') => {
    return apiClient.post<{ message: string }>('/notifications/devices', { token, platform });
  },

  /**
   * Unregister device
   */
  unregisterDevice: async (token: string) => {
    return apiClient.delete<{ message: string }>('/notifications/devices', { 
      data: { token } 
    } as any);
  }
};

export default notificationService;
