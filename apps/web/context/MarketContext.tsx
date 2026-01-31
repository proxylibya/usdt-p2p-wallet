
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { MarketCoin } from '../types';
import { useMarketData } from '../hooks/useMarketData';
import { useAppSettings } from './SettingsContext';

type PriceChangeStatus = 'up' | 'down' | null;

interface MarketContextType {
    marketCoins: MarketCoin[];
    marketCoinPriceChanges: Record<string, PriceChangeStatus>;
    latestPrices: Record<string, { price: number, change: number }>;
    isLoading: boolean;
    refreshMarketData: () => Promise<void>;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { settings } = useAppSettings();
    const market = useMarketData(settings.liveData.enabled);

    // Critical: Memoize the value object to prevent downstream re-renders in LiveDataContext
    const value = useMemo(() => ({
        marketCoins: market.marketCoins,
        marketCoinPriceChanges: market.marketCoinPriceChanges,
        latestPrices: market.latestPrices,
        isLoading: market.isLoading,
        refreshMarketData: market.refreshMarketData
    }), [
        market.marketCoins, 
        market.marketCoinPriceChanges, 
        market.latestPrices, 
        market.isLoading, 
        market.refreshMarketData
    ]);

    return (
        <MarketContext.Provider value={value}>
            {children}
        </MarketContext.Provider>
    );
};

export const useMarket = (): MarketContextType => {
    const context = useContext(MarketContext);
    if (!context) {
        throw new Error('useMarket must be used within a MarketProvider');
    }
    return context;
};
