import { api } from '../utils/api';

export interface StakingProduct {
    id: string;
    asset: string;
    apy: number;
    durationDays: number;
    minAmount: number;
    maxAmount?: number;
    isActive: boolean;
}

export interface StakingSubscription {
    id: string;
    asset: string; // From product
    amount: number;
    startDate: string;
    endDate?: string;
    status: 'ACTIVE' | 'REDEEMED' | 'COMPLETED';
    interestEarned: number;
    product: StakingProduct;
}

export const earnService = {
    getProducts: async (asset?: string) => {
        const response = await api.get<StakingProduct[]>(`/earn/products${asset ? `?asset=${asset}` : ''}`);
        return response.data;
    },

    subscribe: async (productId: string, amount: number) => {
        const response = await api.post<StakingSubscription>('/earn/subscribe', { productId, amount });
        return response.data;
    },

    getMySubscriptions: async () => {
        const response = await api.get<StakingSubscription[]>('/earn/subscriptions');
        return response.data;
    },

    redeem: async (subscriptionId: string) => {
        const response = await api.post<{ success: boolean; principal: number; interest: number; total: number }>(`/earn/redeem/${subscriptionId}`);
        return response.data;
    }
};
