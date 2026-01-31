
import React, { useState, useEffect, memo } from 'react';
import { useTheme } from '../context/ThemeContext';

interface OrderRow {
    price: number;
    amount: number;
    total: number;
}

const generateOrders = (basePrice: number, type: 'ask' | 'bid', count: number): OrderRow[] => {
    let currentPrice = basePrice;
    const orders: OrderRow[] = [];
    let accumulatedTotal = 0;

    for (let i = 0; i < count; i++) {
        const step = basePrice * 0.0005 * (Math.random() * 0.8 + 0.2);
        if (type === 'ask') currentPrice += step;
        else currentPrice -= step;

        const amount = Math.random() * 2 + 0.1; 
        accumulatedTotal += amount;

        orders.push({
            price: currentPrice,
            amount: amount,
            total: accumulatedTotal
        });
    }
    return type === 'ask' ? orders.reverse() : orders;
};

// Memoized Row
const Row: React.FC<{ order: OrderRow, type: 'ask' | 'bid' }> = memo(({ order, type }) => {
    const width = `${Math.min(100, (order.amount / 5) * 100)}%`; 
    const bgColor = type === 'ask' ? 'bg-error/10' : 'bg-success/10';
    const textColor = type === 'ask' ? 'text-error' : 'text-success';

    return (
        <div className="flex justify-between items-center text-[10px] sm:text-xs py-0.5 relative overflow-hidden group hover:bg-background-tertiary/20 cursor-default">
            {/* Depth Bar */}
            <div className={`absolute top-0 right-0 bottom-0 ${bgColor} transition-all duration-500 ease-out`} style={{ width }} />
            
            <span className={`z-10 w-1/3 text-start pl-2 font-mono ${textColor}`}>{order.price.toFixed(2)}</span>
            <span className="z-10 w-1/3 text-end text-text-primary/90 font-mono">{order.amount.toFixed(4)}</span>
        </div>
    );
});

export const OrderBook: React.FC<{ basePrice: number, symbol: string }> = ({ basePrice, symbol }) => {
    const { primaryColor } = useTheme();
    const [asks, setAsks] = useState<OrderRow[]>([]);
    const [bids, setBids] = useState<OrderRow[]>([]);

    useEffect(() => {
        setAsks(generateOrders(basePrice, 'ask', 7));
        setBids(generateOrders(basePrice, 'bid', 7));
    }, [basePrice]);

    // Live update simulation
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.5) {
                setAsks(prev => {
                    const newAsks = [...prev];
                    const idx = Math.floor(Math.random() * newAsks.length);
                    newAsks[idx] = { ...newAsks[idx], amount: Math.random() * 2 + 0.1 };
                    return newAsks;
                });
            } else {
                setBids(prev => {
                    const newBids = [...prev];
                    const idx = Math.floor(Math.random() * newBids.length);
                    newBids[idx] = { ...newBids[idx], amount: Math.random() * 2 + 0.1 };
                    return newBids;
                });
            }
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full select-none">
            <div className="flex justify-between px-2 pb-2 text-[10px] text-text-secondary uppercase font-bold tracking-wider opacity-70">
                <span className="w-1/3 text-start">Price (USDT)</span>
                <span className="w-1/3 text-end">Amount ({symbol})</span>
            </div>
            
            <div className="flex flex-col justify-end min-h-[140px]">
                {asks.map((order, i) => <Row key={`ask-${i}`} order={order} type="ask" />)}
            </div>

            {/* Enhanced Spread Indicator */}
            <div className="py-3 my-1 flex flex-col items-center justify-center border-y border-border-divider/50 bg-background-tertiary/20 relative overflow-hidden">
                <div className="flex items-baseline gap-2 z-10">
                    <span className={`text-xl font-black ${primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'} tracking-tight`}>
                        {basePrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-text-secondary font-bold">≈ ${basePrice.toFixed(2)}</span>
                </div>
                {/* Subtle Pulse Background */}
                <div className={`absolute inset-0 bg-${primaryColor}/5 animate-pulse`}></div>
            </div>

            <div className="min-h-[140px]">
                {bids.map((order, i) => <Row key={`bid-${i}`} order={order} type="bid" />)}
            </div>
        </div>
    );
};
