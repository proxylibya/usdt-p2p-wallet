
import React, { useState, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { MarketCoin } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useMarket } from '../context/MarketContext';
import { assetIcons } from '../components/icons/CryptoIcons';
import { Search } from 'lucide-react';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useTheme } from '../context/ThemeContext';
import { Sparkline } from '../components/Sparkline';

type PriceChangeStatus = 'up' | 'down' | null;

// Performance Optimization: 
// CoinRow is memoized to only re-render if specific props change.
// Using strict comparison for complex props to avoid unnecessary renders.
const CoinRow = memo(({ coin, changeStatus }: { coin: MarketCoin, changeStatus: PriceChangeStatus }) => {
    const { formatCurrency } = useCurrency();
    const isPositive = coin.change24h >= 0;
    const IconComponent = assetIcons[coin.symbol] || assetIcons['USDT'];
    const chartColor = isPositive ? '#0ECB81' : '#F6465D';

    return (
        <Link to={`/markets/${coin.id}`} className="grid grid-cols-12 items-center py-4 px-4 hover:bg-background-tertiary/40 transition-colors border-b border-border-divider/30 last:border-0 group active:bg-background-tertiary/60">
            {/* Asset Info - 5 Columns */}
            <div className="col-span-5 flex items-center gap-3.5 overflow-hidden">
                <div className="relative">
                    <IconComponent className="w-10 h-10 flex-shrink-0 group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex items-baseline gap-1.5">
                        <p className="font-bold text-text-primary text-base truncate leading-none">{coin.symbol}</p>
                    </div>
                    <p className="text-xs text-text-secondary truncate mt-1 font-medium">{coin.name}</p>
                </div>
            </div>
            
            {/* Sparkline - 3 Columns */}
            <div className="col-span-3 flex items-center justify-center pe-2 h-8 opacity-80">
                <Sparkline data={coin.sparkline} color={chartColor} width={60} height={24} />
            </div>

            {/* Price Info - 4 Columns */}
            <div className="col-span-4 flex flex-col items-end justify-center">
                <p className={`font-bold text-text-primary price-flash text-base font-mono tracking-tight ${changeStatus === 'up' ? 'price-up' : changeStatus === 'down' ? 'price-down' : ''}`}>
                    {formatCurrency(coin.price)}
                </p>
                <div className={`flex items-center justify-end mt-1 px-1.5 py-0.5 rounded-md ${isPositive ? 'bg-success/10' : 'bg-error/10'}`}>
                    <span className={`text-xs font-bold ${isPositive ? 'text-success' : 'text-error'}`}>
                        {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
                    </span>
                </div>
            </div>
        </Link>
    );
}, (prev, next) => {
    // Strict comparison to prevent re-renders when other list items update
    // This is critical for performance when the live ticker is running
    return (
        prev.coin.id === next.coin.id &&
        prev.coin.price === next.coin.price &&
        prev.coin.change24h === next.coin.change24h &&
        prev.changeStatus === next.changeStatus
    );
});


const MarketsScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { marketCoins, marketCoinPriceChanges, isLoading } = useMarket();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'hot' | 'gainers' | 'losers'>('hot');

    const filteredAndSortedCoins = useMemo(() => {
        let sorted = [...marketCoins];
        
        // Sorting Logic
        if (activeTab === 'gainers') {
            sorted.sort((a, b) => b.change24h - a.change24h);
        } else if (activeTab === 'losers') {
            sorted.sort((a, b) => a.change24h - b.change24h);
        } else { // 'hot' or default
            sorted.sort((a, b) => b.volume24h - a.volume24h);
        }

        if (searchTerm) {
            return sorted.filter(coin =>
                coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return sorted;
    }, [marketCoins, activeTab, searchTerm]);

    const tabs = [
        { key: 'hot', label: t('hot') },
        { key: 'gainers', label: t('gainers') },
        { key: 'losers', label: t('losers') },
    ];

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background-primary">
            <div className="p-4 pb-0 space-y-4 flex-none z-10 bg-background-primary shadow-sm border-b border-border-divider/30">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-text-primary">{t('markets')}</h1>
                </div>
                
                <div className="relative group">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary group-focus-within:text-brand-yellow transition-colors" />
                    <input
                        type="text"
                        placeholder={t('search_coin')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background-secondary border border-transparent rounded-xl p-3 ps-10 focus:ring-2 focus:outline-none transition-all"
                        style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                    />
                </div>

                <div className="flex bg-background-tertiary/50 p-1 rounded-xl backdrop-blur-sm">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all duration-300 ${activeTab === tab.key ? `bg-background-secondary text-text-primary shadow-sm` : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                {/* Column Headers matching CoinRow Grid - Strict 12 Col System */}
                <div className="grid grid-cols-12 text-xs font-bold text-text-secondary px-4 pb-2 uppercase tracking-wide opacity-70">
                    <div className="col-span-5 text-start">{t('asset')}</div>
                    <div className="col-span-3 text-center">Chart</div>
                    <div className="col-span-4 text-end">{t('last_price')}</div>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto pb-32 no-scrollbar bg-background-primary">
                {isLoading && marketCoins.length === 0 ? (
                    <div className="space-y-4 p-4">
                        <SkeletonLoader className="h-16 w-full rounded-xl" />
                        <SkeletonLoader className="h-16 w-full rounded-xl" />
                        <SkeletonLoader className="h-16 w-full rounded-xl" />
                    </div>
                ) : filteredAndSortedCoins.length > 0 ? (
                    <div className="divide-y divide-border-divider/20">
                        {filteredAndSortedCoins.map(coin => (
                            <CoinRow 
                                key={coin.id} 
                                coin={coin} 
                                changeStatus={marketCoinPriceChanges[coin.id] ?? null} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-text-secondary opacity-70">
                        <Search className="w-12 h-12 mb-3 text-background-tertiary" />
                        <p className="text-sm font-medium">{t('no_assets_found')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketsScreen;
