
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { P2POffer, P2PTrade } from '../types';
import { useP2PData } from '../hooks/useP2PData';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { useLanguage } from './LanguageContext';
import { useNotifications } from './NotificationContext';

interface P2PContextType {
    p2pOffers: P2POffer[];
    activeTrades: P2PTrade[];
    isLoading: boolean;
    addP2POffer: (offer: P2POffer) => Promise<void>;
    updateP2POffer: (offer: P2POffer) => void;
    deleteP2POffer: (id: string) => void;
    createP2PTrade: (offer: P2POffer, cryptoAmount: number) => Promise<P2PTrade>;
    sendP2PMessage: (tradeId: string, message: string, sender: 'me' | 'counterparty' | 'system', attachmentUrl?: string) => void;
    markP2PTradePaid: (tradeId: string) => Promise<void>;
    releaseP2PEscrow: (tradeId: string) => Promise<void>;
    cancelP2PTrade: (tradeId: string) => Promise<void>;
    submitAppeal: (tradeId: string, reason: string, description: string) => Promise<void>;
    resolveDispute: (tradeId: string, resolution: 'buyer_wins' | 'seller_wins') => Promise<void>;
}

const P2PContext = createContext<P2PContextType | undefined>(undefined);

export const P2PProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { wallets, updateWalletBalance, addTransaction } = useWallet();
    const { t } = useLanguage();
    const { addNotification } = useNotifications();
    
    // Pass addNotification to hook to enable lifecycle alerts
    const notify = (title: string, message: string) => {
        addNotification({ icon: 'info', title, message });
    };

    // Wrapper for t function to match expected signature
    const translate = (key: string, params?: any): string => t(key as any, params);

    const p2pData = useP2PData(user, wallets, updateWalletBalance, addTransaction, translate, notify);

    // Context Value Memoization
    const contextValue = useMemo(() => ({
        p2pOffers: p2pData.p2pOffers,
        activeTrades: p2pData.activeTrades,
        isLoading: p2pData.isLoading,
        addP2POffer: p2pData.addP2POffer,
        updateP2POffer: p2pData.updateP2POffer,
        deleteP2POffer: p2pData.deleteP2POffer,
        createP2PTrade: p2pData.createP2PTrade,
        sendP2PMessage: p2pData.sendP2PMessage,
        markP2PTradePaid: p2pData.markP2PTradePaid,
        releaseP2PEscrow: p2pData.releaseP2PEscrow,
        cancelP2PTrade: p2pData.cancelP2PTrade,
        submitAppeal: p2pData.submitAppeal,
        resolveDispute: p2pData.resolveDispute
    }), [
        p2pData.p2pOffers,
        p2pData.activeTrades,
        p2pData.isLoading,
        p2pData.addP2POffer,
        p2pData.updateP2POffer,
        p2pData.deleteP2POffer,
        p2pData.createP2PTrade,
        p2pData.sendP2PMessage,
        p2pData.markP2PTradePaid,
        p2pData.releaseP2PEscrow,
        p2pData.cancelP2PTrade,
        p2pData.submitAppeal,
        p2pData.resolveDispute
    ]);

    return (
        <P2PContext.Provider value={contextValue}>
            {children}
        </P2PContext.Provider>
    );
};

export const useP2P = (): P2PContextType => {
    const context = useContext(P2PContext);
    if (!context) {
        throw new Error('useP2P must be used within a P2PProvider');
    }
    return context;
};
