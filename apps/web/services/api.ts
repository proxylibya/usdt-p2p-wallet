/**
 * API Service - Legacy compatibility layer
 * Re-exports services for backward compatibility with existing imports
 */

export { apiClient as api } from './apiClient';
export { walletService as default } from './walletService';
export { walletService } from './walletService';
export { marketService } from './marketService';
export { authService } from './authService';
export { p2pService } from './p2pService';
export { notificationService } from './notificationService';
export { swapService } from './SwapService';

// Swap-specific API functions - delegating to real SwapService
import { swapService } from './SwapService';

export const getSwapRate = async (fromAsset: string, toAsset: string, amount: number) => {
    try {
        const quote = await swapService.getQuote(fromAsset, toAsset, amount);
        return {
            success: true,
            data: {
                rate: quote.rate,
                fromAmount: quote.fromAmount,
                toAmount: quote.toAmount,
                fee: quote.fee,
                estimatedTime: '1-2 minutes',
                quoteId: quote.quoteId
            }
        };
    } catch {
        return { success: false, data: null, error: 'Failed to get swap rate' };
    }
};

export const executeSwap = async (_fromAsset: string, _toAsset: string, _fromAmount: number, _toAmount: number, quoteId?: string) => {
    try {
        if (!quoteId) {
            return { success: false, data: null, error: 'Quote ID required' };
        }
        const result = await swapService.executeSwap(quoteId);
        return {
            success: result.success,
            data: {
                transactionId: result.transactionId,
                status: 'completed',
                fromAsset: result.fromAsset,
                toAsset: result.toAsset,
                fromAmount: result.fromAmount,
                toAmount: result.toAmount,
                timestamp: new Date().toISOString()
            }
        };
    } catch {
        return { success: false, data: null, error: 'Failed to execute swap' };
    }
};

export const getSwapHistory = async () => {
    try {
        const history = await swapService.getHistory();
        return { success: true, data: history.items };
    } catch {
        return { success: false, data: [] };
    }
};
