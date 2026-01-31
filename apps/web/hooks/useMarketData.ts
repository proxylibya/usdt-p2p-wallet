
import { useState, useEffect, useRef, useCallback } from 'react';
import { MarketCoin } from '../types';
import { marketService } from '../services';

type PriceChangeStatus = 'up' | 'down' | null;

export const useMarketData = (enabled: boolean) => {
    const [marketCoins, setMarketCoins] = useState<MarketCoin[]>([]);
    const [marketCoinPriceChanges, setMarketCoinPriceChanges] = useState<Record<string, PriceChangeStatus>>({});
    const [latestPrices, setLatestPrices] = useState<Record<string, { price: number, change: number }>>({});
    const [isLoading, setIsLoading] = useState(true);
    
    const isMounted = useRef(true);
    const intervalRef = useRef<any>(null);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchRealData = async () => {
        try {
            const response = await marketService.getMarketCoins();
            if (!response.success || !response.data) return;
            const coins = response.data;
            
            if (isMounted.current) {
                setMarketCoins(prevCoins => {
                    // Compare with previous to set direction
                    const changes: Record<string, PriceChangeStatus> = {};
                    const priceUpdates: Record<string, { price: number, change: number }> = {};
                    
                    coins.forEach(newCoin => {
                        const oldCoin = prevCoins.find(c => c.id === newCoin.id);
                        if (oldCoin) {
                            if (newCoin.price > oldCoin.price) changes[newCoin.id] = 'up';
                            else if (newCoin.price < oldCoin.price) changes[newCoin.id] = 'down';
                        }
                        priceUpdates[newCoin.symbol] = { price: newCoin.price, change: newCoin.change24h };
                    });

                    // Flash effect logic
                    if (Object.keys(changes).length > 0) {
                        setMarketCoinPriceChanges(changes);
                        setTimeout(() => {
                            if (isMounted.current) setMarketCoinPriceChanges({});
                        }, 2000);
                    }
                    
                    setLatestPrices(priceUpdates);
                    return coins;
                });
                setIsLoading(false);
            }
        } catch (e) {
            // Silent fail - backend may not be available
            if (isMounted.current) setIsLoading(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchRealData();
    }, []);

    // Polling Interval (every 10 seconds for real data to avoid rate limits)
    useEffect(() => {
        if (!enabled) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        // Fetch immediately on enable
        fetchRealData();

        intervalRef.current = setInterval(fetchRealData, 10000); 

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [enabled]);

    const refreshMarketData = useCallback(async () => {
        setIsLoading(true);
        await fetchRealData();
    }, []);

    return {
        marketCoins,
        marketCoinPriceChanges,
        latestPrices,
        isLoading,
        refreshMarketData
    };
};
