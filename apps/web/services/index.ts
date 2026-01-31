/**
 * Services Index - Export all API services
 */

// Core API Client
export { apiClient, TokenManager } from './apiClient';

// Feature Services
export { authService } from './authService';
export { walletService } from './walletService';
export { p2pService } from './p2pService';
export { marketService } from './marketService';
export { notificationService } from './notificationService';
export { userService } from './userService';
export { websocketService } from './websocketService';

// New Services
export { swapService } from './SwapService';
export { adminService } from './AdminService';
export { p2pChatService } from './P2PChatService';

// Utility Services
export { cacheService } from './cacheService';

// Capacitor Plugins
export * from './capacitorPlugins';
