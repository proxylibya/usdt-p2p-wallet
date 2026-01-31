import { api } from './api';

export interface Eidya {
    id: string;
    asset: string;
    totalAmount: number;
    quantity: number;
    message?: string;
    code: string;
    claimedAmount: number;
    claimedCount: number;
    status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED';
    createdAt: string;
    creator?: {
        name: string;
        avatarUrl?: string;
    };
}

export interface EidyaClaim {
    id: string;
    amount: number;
    createdAt: string;
    eidya: Eidya;
}

export const eidyaService = {
    create: async (data: { asset: string; totalAmount: number; quantity: number; message?: string }) => {
        const response = await api.post<Eidya>('/eidya/create', data);
        return response.data;
    },

    claim: async (code: string) => {
        const response = await api.post<{ claimAmount: number; status: string }>('/eidya/claim', { code });
        return response.data;
    },

    getInfo: async (code: string) => {
        const response = await api.get<Eidya>(`/eidya/info/${code}`);
        return response.data;
    },

    getHistory: async () => {
        const response = await api.get<{ created: Eidya[]; claimed: EidyaClaim[] }>('/eidya/history');
        return response.data;
    }
};
