
import React, { useEffect, useRef, memo } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import { useTheme } from '../context/ThemeContext';

interface TradingChartProps {
    symbol: string;
}

// Generate realistic-looking dummy candle data
const generateData = (initialPrice: number) => {
    const res = [];
    const time = new Date();
    time.setHours(0, 0, 0, 0); // Start of today
    let open = initialPrice;

    for (let i = 0; i < 100; i++) {
        const timeStamp = time.getTime() / 1000;
        const volatility = initialPrice * 0.02; // 2% volatility
        const change = (Math.random() - 0.5) * volatility;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * (volatility / 2);
        const low = Math.min(open, close) - Math.random() * (volatility / 2);

        res.push({
            time: timeStamp,
            open,
            high,
            low,
            close,
        });

        open = close;
        time.setMinutes(time.getMinutes() + 15); // 15-min candles
    }
    return res;
};

export const TradingChart: React.FC<TradingChartProps> = memo(({ symbol }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const { primaryColor } = useTheme();

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#1E2026' }, // Matches bg-background-secondary
                textColor: '#848E9C',
            },
            grid: {
                vertLines: { color: 'rgba(43, 49, 57, 0.2)' },
                horzLines: { color: 'rgba(43, 49, 57, 0.2)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.2)',
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.2)',
                timeVisible: true,
            },
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#0ECB81',
            downColor: '#F6465D',
            borderVisible: false,
            wickUpColor: '#0ECB81',
            wickDownColor: '#F6465D',
        });

        // Determine base price based on symbol for realistic simulation
        let basePrice = 1.00;
        if (symbol === 'BTC') basePrice = 68000;
        if (symbol === 'ETH') basePrice = 3500;
        if (symbol === 'BNB') basePrice = 600;
        if (symbol === 'SOL') basePrice = 150;

        const data = generateData(basePrice);
        candlestickSeries.setData(data as any);

        // Responsive resize
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        // Fit content initially
        chart.timeScale().fitContent();

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [symbol]);

    return (
        <div className="w-full h-full relative">
            <div ref={chartContainerRef} className="w-full h-full" />
            <div className="absolute top-2 left-2 z-10 flex gap-2">
                <span className="text-[10px] font-bold text-text-secondary bg-background-tertiary/80 px-2 py-1 rounded border border-border-divider backdrop-blur-md">
                    15m
                </span>
                <span className="text-[10px] font-bold text-text-primary bg-background-tertiary/80 px-2 py-1 rounded border border-border-divider backdrop-blur-md">
                    Lightweight Charts™
                </span>
            </div>
        </div>
    );
});
