import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet as WalletType, MarketCoin } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useWallet } from '../context/WalletContext';
import { useMarket } from '../context/MarketContext';
import { useNotifications } from '../context/NotificationContext';
import { Eye, EyeOff, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, History, CreditCard, Gift, LayoutGrid, Search, Send, PieChart, TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { assetIcons } from '../components/icons/CryptoIcons';
import { P2PIcon } from '../components/icons/P2PIcon';
import { PullToRefresh } from '../components/PullToRefresh';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import AIChatModal from '../components/AIChatModal';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { Sparkline } from '../components/Sparkline';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Web3Dashboard } from '../components/Web3Dashboard';

type PriceChangeStatus = 'up' | 'down' | null;

// Optimized Row Component
const WalletItem = React.memo(({ wallet, coinData, changeStatus, hidden, onClick, formattedFiatValue }: { wallet: WalletType; coinData?: MarketCoin; changeStatus: PriceChangeStatus; hidden: boolean; onClick: () => void; formattedFiatValue: string }) => {
    const IconComponent = assetIcons[wallet.symbol];
    const priceColorClass = changeStatus === 'up' ? 'text-success' : changeStatus === 'down' ? 'text-error' : 'text-text-primary';
    const sparklineColor = coinData ? (coinData.change24h >= 0 ? '#0ECB81' : '#F6465D') : '#848E9C';
    
    return (
        <div onClick={onClick} className="flex items-center justify-between py-4 px-4 bg-background-secondary mb-2 rounded-xl border border-transparent hover:border-border-divider/50 active:scale-[0.99] transition-all cursor-pointer shadow-sm">
            <div className="flex items-center gap-3.5 min-w-[110px]">
                {IconComponent ? <IconComponent className="w-10 h-10" /> : <div className="w-10 h-10 bg-background-tertiary rounded-full" />}
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-text-primary text-base">{wallet.symbol}</p>
                    </div>
                    <p className="text-xs text-text-secondary font-medium text-start">{wallet.name}</p>
                </div>
            </div>

            <div className="flex-1 flex justify-center items-center px-2 h-8 opacity-60">
                <div className="w-[60px]">
                    {coinData && coinData.sparkline && (
                        <Sparkline data={coinData.sparkline} color={sparklineColor} width={60} height={20} fill={false} />
                    )}
                </div>
            </div>

            <div className="text-end min-w-[90px]">
                <p className={`font-bold text-base font-mono tracking-tight ${priceColorClass} transition-colors duration-300 ${hidden ? 'blur-sm select-none text-text-primary' : ''}`}>
                    {hidden ? '******' : wallet.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                </p>
                <div className="flex flex-col items-end mt-0.5">
                     <p className={`text-xs text-text-secondary ${hidden ? 'blur-sm select-none' : ''}`}>
                        {hidden ? '*****' : `≈ ${formattedFiatValue}`}
                    </p>
                </div>
            </div>
        </div>
    );
});

const ActionButton = React.memo(({ icon, label, onClick, primary, primaryColor }: { icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean; primaryColor?: string }) => {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-2 flex-1 group active:scale-95 transition-transform">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md border ${primary ? (primaryColor === 'brand-yellow' ? 'bg-primary-gold text-background-primary border-primary-gold' : 'bg-primary-green text-background-primary border-primary-green') : 'bg-background-tertiary/50 text-text-primary border-transparent group-hover:border-border-divider'}`}>
                {icon}
            </div>
            <span className="text-[11px] font-bold text-text-secondary group-hover:text-text-primary text-center leading-tight transition-colors">{label}</span>
        </button>
    );
});

const OverviewDashboard: React.FC<{ wallets: WalletType[] }> = ({ wallets }) => {
    const { primaryColor } = useTheme();
    const { t } = useLanguage();
    
    // Calculations
    const totalBalance = wallets.reduce((acc, w) => acc + (w.usdValue && !isNaN(w.usdValue) ? w.usdValue : 0), 0);
    
    // Accurate 24h PnL Calculation
    // Formula: PnL = CurrentValue - (CurrentValue / (1 + change%))
    const dailyPnL = wallets.reduce((acc, w) => {
        if (!w.usdValue || isNaN(w.usdValue)) return acc;
        const changeRatio = (w.change24h ?? 0) / 100;
        // Avoid division by zero if change is -100% (though rare/impossible for stablecoins)
        const costBasis24h = changeRatio === -1 ? 0 : w.usdValue / (1 + changeRatio);
        return acc + (w.usdValue - costBasis24h);
    }, 0);
    
    const dailyPnLPercent = totalBalance !== 0 ? (dailyPnL / totalBalance) * 100 : 0;
    const isProfit = dailyPnL >= 0;

    // Sort for allocation
    const sortedWallets = [...wallets].sort((a, b) => b.usdValue - a.usdValue);
    const topAssets = sortedWallets.slice(0, 4);
    const otherValue = sortedWallets.slice(4).reduce((acc, w) => acc + w.usdValue, 0);
    
    // Explicitly type to allow 'Others' string mixed with Symbol enum
    const chartData: { name: string; value: number }[] = topAssets.map(w => ({ name: w.symbol, value: w.usdValue }));
    if(otherValue > 0) chartData.push({ name: 'Others', value: otherValue });

    const COLORS = [
        primaryColor === 'brand-yellow' ? '#F0B90B' : '#0ECB81',
        '#3B82F6', '#8B5CF6', '#F59E0B', '#64748B'
    ];

    // Top Gainer
    const topGainer = [...wallets].filter(w => w.usdValue > 1).sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0))[0];

    if (totalBalance === 0) return null;

    return (
        <div className="space-y-4 animate-fadeIn mb-6">
            {/* PnL Card */}
            <div className="bg-background-secondary p-5 rounded-2xl border border-border-divider/50 shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${isProfit ? 'success' : 'error'}/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none`}></div>
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Today's PNL</p>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-black font-mono tracking-tight ${isProfit ? 'text-success' : 'text-error'}`}>
                                {isProfit ? '+' : ''}{dailyPnL.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </span>
                        </div>
                    </div>
                    <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${isProfit ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {Math.abs(dailyPnLPercent).toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* Allocation Chart */}
            <div className="bg-background-secondary p-5 rounded-2xl border border-border-divider/50 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-text-secondary" /> Asset Allocation
                    </h3>
                </div>
                
                <div className="flex items-center justify-center mb-2">
                    <div className="h-40 w-40 relative flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                    cornerRadius={4}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </RechartsPie>
                        </ResponsiveContainer>
                        {/* Center Label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[9px] text-text-secondary uppercase font-bold tracking-widest">Total</span>
                            <span className="text-sm font-black text-text-primary font-mono">${(totalBalance / 1000).toFixed(1)}k</span>
                        </div>
                    </div>
                </div>
                
                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                    {chartData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center justify-between bg-background-tertiary/30 px-3 py-2 rounded-lg border border-transparent hover:border-border-divider/50 transition-colors">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-xs font-bold text-text-primary truncate">{entry.name}</span>
                            </div>
                            <span className="text-xs text-text-secondary font-mono">
                                {((entry.value / totalBalance) * 100).toFixed(0)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Performer */}
            {topGainer && (
                <div className="bg-background-secondary p-4 rounded-2xl border border-border-divider/50 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-text-secondary uppercase mb-1 flex items-center gap-1">
                            <SparklesIcon className="w-3 h-3 text-brand-yellow" /> Top Performer
                        </p>
                        <div className="flex items-center gap-2">
                            {assetIcons[topGainer.symbol] && React.createElement(assetIcons[topGainer.symbol], { className: "w-5 h-5" })}
                            <span className="font-bold text-text-primary">{topGainer.name}</span>
                        </div>
                    </div>
                    <div className="text-end">
                        <span className={`block font-bold font-mono ${(topGainer.change24h ?? 0) >= 0 ? 'text-success' : 'text-error'}`}>
                            {(topGainer.change24h ?? 0) >= 0 ? '+' : ''}{(topGainer.change24h ?? 0).toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-text-secondary">24h Change</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const WalletScreen: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { currency, formatCurrency } = useCurrency();
    const { primaryColor } = useTheme();
    const { wallets, walletPriceChanges, isLoading: isWalletLoading } = useWallet();
    const { marketCoins, refreshMarketData } = useMarket();
    const { addNotification } = useNotifications();
    
    // Toggle state with persistence
    const [viewMode, setViewMode] = useState<'exchange' | 'web3'>(() => {
        return (localStorage.getItem('wallet_view_mode') as 'exchange' | 'web3') || 'exchange';
    });

    const handleViewModeChange = (mode: 'exchange' | 'web3') => {
        setViewMode(mode);
        localStorage.setItem('wallet_view_mode', mode);
    };
    
    const isLoading = isWalletLoading && wallets.length === 0;

    const [hideBalance, setHideBalance] = useState(false);
    const [hideSmallBalances, setHideSmallBalances] = useState(false);
    const [activeTab, setActiveTab] = useState<'Spot' | 'Funding' | 'Overview'>('Spot');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);
    const [initialAiQuery, setInitialAiQuery] = useState('');

    const totalBalance = useMemo(() => wallets.reduce((sum, wallet) => sum + wallet.usdValue, 0), [wallets]);
    const fundingWallets = useMemo(() => wallets.filter(w => ['USDT', 'BUSD', 'USDC', 'DAI'].includes(w.symbol)), [wallets]);
    const fundingBalance = useMemo(() => fundingWallets.reduce((sum, wallet) => sum + wallet.usdValue, 0), [fundingWallets]);

    const displayedBalance = activeTab === 'Funding' ? fundingBalance : totalBalance;

    const filteredWallets = useMemo(() => {
        const currentList = activeTab === 'Funding' ? fundingWallets : wallets;
        let result = currentList;

        if (hideSmallBalances) {
            result = result.filter(w => w.usdValue >= 1);
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(w => 
                w.symbol.toLowerCase().includes(lowerTerm) || 
                w.name.toLowerCase().includes(lowerTerm)
            );
        }
        return result;
    }, [activeTab, fundingWallets, wallets, searchTerm, hideSmallBalances]);

    const handleNavigate = useCallback((path: string) => navigate(path), [navigate]);
    const toggleHideBalance = useCallback(() => setHideBalance(prev => !prev), []);
    
    const handleAnalyzePortfolio = () => {
        setInitialAiQuery("Analyze my portfolio. What should I diversify based on current market data?");
        setIsAiChatOpen(true);
    };

    const handleFeatureComingSoon = () => {
        addNotification({
            icon: 'info',
            title: 'Coming Soon',
            message: 'This feature is currently under development.'
        });
    };

    const handleWalletClick = (wallet: WalletType) => {
        const coin = marketCoins.find(c => c.symbol === wallet.symbol);
        if (coin) {
            navigate(`/markets/${coin.id}`);
        } else {
            navigate('/wallet/history');
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-background-primary text-text-primary pt-safe">
            <div className="px-4 pt-2 flex flex-col gap-4 flex-none bg-background-primary z-10">
                {/* Header Switch - Only visible in Wallet Screen */}
                <div className="flex justify-center">
                    <div className="bg-background-tertiary p-1 rounded-lg flex gap-1 shadow-inner">
                        <button 
                            onClick={() => handleViewModeChange('exchange')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'exchange' ? 'bg-background-secondary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Exchange
                        </button>
                        <button 
                            onClick={() => handleViewModeChange('web3')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'web3' ? 'bg-background-secondary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Web3
                        </button>
                    </div>
                </div>

                {viewMode === 'exchange' && (
                    <div className="flex bg-background-secondary p-1 rounded-xl border border-border-divider/50">
                        {['Spot', 'Funding', 'Overview'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === tab ? (primaryColor === 'brand-yellow' ? 'bg-background-tertiary text-primary-gold shadow-sm' : 'bg-background-tertiary text-primary-green shadow-sm') : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                {t(tab.toLowerCase() as any) || tab}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {viewMode === 'web3' ? (
                <Web3Dashboard />
            ) : (
                <PullToRefresh 
                    onRefresh={refreshMarketData}
                    className="flex-1 overflow-y-auto overflow-x-hidden pb-32 no-scrollbar relative"
                >
                    <div className="px-5 pt-6 pb-2">
                        {/* Header showing Total Balance (Hidden in Overview to avoid duplication with PnL card) */}
                        {activeTab !== 'Overview' && (
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 text-text-secondary text-xs font-bold uppercase tracking-wide mb-1.5 opacity-80">
                                        <span>{activeTab === 'Funding' ? t('funding') : t('total_balance')}</span>
                                        <button onClick={toggleHideBalance} className="p-1 hover:bg-background-tertiary rounded-full transition-colors">
                                            {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                    {isLoading ? (
                                        <SkeletonLoader className="h-10 w-48 rounded-lg mb-1" />
                                    ) : (
                                        <h1 className={`text-4xl font-black text-text-primary tracking-tighter font-mono transition-all duration-300 ${hideBalance ? 'blur-sm select-none' : ''}`} dir="ltr">
                                            {hideBalance ? '******' : displayedBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </h1>
                                    )}
                                    {currency !== 'USD' && (
                                        <p className={`text-sm text-text-secondary font-medium mt-1 transition-all duration-300 ${hideBalance ? 'blur-sm select-none' : ''}`}>
                                            ≈ {hideBalance ? '*****' : formatCurrency(displayedBalance)}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleAnalyzePortfolio} className={`p-2.5 transition-colors rounded-xl ${primaryColor === 'brand-yellow' ? 'bg-primary-gold-10 text-primary-gold' : 'bg-primary-green-10 text-primary-green'} active:scale-95`}>
                                        <SparklesIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleNavigate('/wallet/history')} className="p-2.5 text-text-secondary hover:text-text-primary transition-colors bg-background-tertiary rounded-xl active:scale-95">
                                        <History className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Overview' && totalBalance > 0 && (
                            <OverviewDashboard wallets={wallets} />
                        )}

                        {activeTab === 'Funding' ? (
                            <>
                                <div className="mb-6 bg-gradient-to-r from-brand-yellow/20 to-transparent p-[1px] rounded-2xl">
                                    <div className="bg-background-secondary rounded-2xl p-4 flex items-center justify-between border border-brand-yellow/10">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-brand-yellow p-3 rounded-full text-background-primary">
                                                <P2PIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-text-primary text-lg">{t('p2p_trading')}</h3>
                                                <p className="text-xs text-text-secondary">{t('p2p_zero_fees')}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleNavigate('/p2p')} className="bg-background-tertiary hover:bg-background-primary text-brand-yellow font-bold py-2 px-4 rounded-lg text-xs transition-colors border border-brand-yellow/20">
                                            {t('trade')}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-4 gap-3 mb-8">
                                    <ActionButton icon={<CreditCard className="w-6 h-6" />} label={t('pay_btn')} onClick={() => handleNavigate('/send')} primary primaryColor={primaryColor} />
                                    <ActionButton icon={<Gift className="w-6 h-6" />} label={t('gift_card')} onClick={handleFeatureComingSoon} primaryColor={primaryColor} />
                                    <ActionButton icon={<LayoutGrid className="w-6 h-6" />} label={t('pool')} onClick={handleFeatureComingSoon} primaryColor={primaryColor} />
                                    <ActionButton icon={<ArrowRightLeft className="w-6 h-6" />} label={t('transfer')} onClick={() => handleNavigate('/transfer')} primaryColor={primaryColor} />
                                </div>
                            </>
                        ) : activeTab === 'Spot' && (
                            <div className="flex items-start justify-between gap-4 mb-8">
                                <ActionButton icon={<ArrowDownToLine className="w-6 h-6" />} label={t('deposit')} onClick={() => handleNavigate('/deposit')} primary primaryColor={primaryColor} />
                                <ActionButton icon={<ArrowUpFromLine className="w-6 h-6" />} label={t('withdraw')} onClick={() => handleNavigate('/withdraw')} primaryColor={primaryColor} />
                                <ActionButton icon={<Send className="w-6 h-6" />} label={t('send')} onClick={() => handleNavigate('/send')} primaryColor={primaryColor} />
                                <ActionButton icon={<ArrowRightLeft className="w-6 h-6" />} label={t('transfer')} onClick={() => handleNavigate('/transfer')} primaryColor={primaryColor} />
                            </div>
                        )}
                    </div>

                    {activeTab !== 'Overview' && (
                        <div className="bg-background-tertiary/20 min-h-[400px] rounded-t-3xl border-t border-border-divider/50 pt-5 px-2">
                            <div className="flex items-center justify-between px-3 mb-4">
                                <h3 className="text-lg font-bold text-text-primary">{t('assets')}</h3>
                            </div>
                            
                            <div className="px-3 mb-4 space-y-3">
                                <div className="relative">
                                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                    <input
                                        type="text"
                                        placeholder={t('search_asset')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-background-secondary border border-transparent focus:border-brand-yellow rounded-xl py-2.5 ps-10 pe-4 text-sm focus:outline-none transition-all placeholder-text-secondary/70 text-text-primary"
                                    />
                                </div>
                                
                                <div 
                                    className="flex items-center gap-2 px-1 cursor-pointer" 
                                    onClick={() => setHideSmallBalances(!hideSmallBalances)}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${hideSmallBalances ? (primaryColor === 'brand-yellow' ? 'bg-primary-gold border-primary-gold' : 'bg-primary-green border-primary-green') : 'border-text-secondary'}`}>
                                        {hideSmallBalances && <div className="w-2 h-2 bg-background-primary rounded-[1px]"></div>}
                                    </div>
                                    <span className="text-xs text-text-secondary select-none font-medium">{t('hide_small_balances')}</span>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="space-y-3 px-2">
                                    <SkeletonLoader className="h-20 w-full rounded-xl" />
                                    <SkeletonLoader className="h-20 w-full rounded-xl" />
                                    <SkeletonLoader className="h-20 w-full rounded-xl" />
                                </div>
                            ) : filteredWallets.length > 0 ? (
                                filteredWallets.map(wallet => (
                                    <WalletItem 
                                        key={wallet.id} 
                                        wallet={wallet}
                                        coinData={marketCoins.find(c => c.symbol === wallet.symbol)}
                                        changeStatus={walletPriceChanges[wallet.id] ?? null} 
                                        hidden={hideBalance}
                                        onClick={() => handleWalletClick(wallet)}
                                        formattedFiatValue={formatCurrency(wallet.usdValue)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-10 text-text-secondary">
                                    <p>{t('no_assets_found')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </PullToRefresh>
            )}
            
            <AIChatModal 
                isOpen={isAiChatOpen} 
                onClose={() => { setIsAiChatOpen(false); setInitialAiQuery(''); }} 
                initialQuery={initialAiQuery} 
            />
        </div>
    );
};

export default WalletScreen;