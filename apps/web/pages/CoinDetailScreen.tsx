
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MarketCoin, PriceAlert, TransactionType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useMarket } from '../context/MarketContext';
import { useWallet } from '../context/WalletContext';
import { assetIcons } from '../components/icons/CryptoIcons';
import { SkeletonLoader } from '../components/SkeletonLoader';
import PageLayout from '../components/PageLayout';
import { BellRing, BookOpen, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus, Target, BarChart3, RefreshCw } from 'lucide-react';
import { PriceAlertModal } from '../components/PriceAlertModal';
import { useNotifications } from '../context/NotificationContext';
import { AIService } from '../services/aiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { TradingChart } from '../components/TradingChart';
import { OrderBook } from '../components/OrderBook';
import { QuickTradeModal } from '../components/QuickTradeModal';
import { TransactionStatusModal, TransactionStatus } from '../components/TransactionStatusModal';

interface AISentimentData {
    sentiment: "Bullish" | "Bearish" | "Neutral";
    score: number;
    summary: string;
    supportLevel: number;
    resistanceLevel: number;
    signalStrength: "Weak" | "Moderate" | "Strong";
}

const CoinDetailScreen: React.FC = () => {
    const { coinId } = useParams<{ coinId: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { formatCurrency } = useCurrency();
    const { primaryColor } = useTheme();
    const { addNotification, sendPushNotification } = useNotifications();

    // Direct Context Hooks
    const { marketCoins, marketCoinPriceChanges } = useMarket();
    const { wallets, updateWalletBalance, addTransaction } = useWallet();

    const coin = useMemo(() => marketCoins.find(c => c.id === coinId), [marketCoins, coinId]);
    const changeStatus = coin ? (marketCoinPriceChanges[coin.id] ?? null) : null;

    // Price Alert State
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    
    // AI Insight State
    const [aiData, setAiData] = useState<AISentimentData | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState<'chart' | 'depth' | 'info'>('chart');

    // Trade Modal State
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    
    // Status Modal State
    const [statusModalState, setStatusModalState] = useState<{
        isOpen: boolean;
        status: TransactionStatus;
        details: any;
    }>({ isOpen: false, status: 'processing', details: {} });

    useEffect(() => {
        if (coin && !aiData) {
            fetchSentiment();
        }
    }, [coin]);

    const fetchSentiment = async () => {
        if (!coin) return;
        setIsAiLoading(true);
        try {
            const data = await AIService.getMarketSentiment(coin.symbol, coin.price, coin.change24h, coin.volume24h);
            setAiData(data);
        } catch {
            // AI insight failed
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSetAlert = (assetSymbol: string, targetPrice: number) => {
        const newAlert: PriceAlert = {
            id: Date.now().toString(),
            assetSymbol: assetSymbol as any,
            targetPrice,
            priceAtCreation: coin?.price || 0,
        };
        setAlerts(prev => [...prev, newAlert]);
        addNotification({
            icon: 'success',
            title: 'Alert Set',
            message: `We'll notify you when ${assetSymbol} hits ${formatCurrency(targetPrice)}`
        });
        setIsAlertModalOpen(false);
    };

    const handleDeleteAlert = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const handleTradeClick = (type: 'buy' | 'sell') => {
        setTradeType(type);
        setIsTradeModalOpen(true);
    };

    const executeTrade = (type: 'buy' | 'sell', amount: number, total: number) => {
        setIsTradeModalOpen(false);
        if (!coin) return;

        setStatusModalState({
            isOpen: true,
            status: 'processing',
            details: {
                amount: amount.toString(),
                asset: coin.symbol,
                type: 'trade',
                toAmount: total.toString()
            }
        });

        setTimeout(() => {
            const txId = `tx-${Date.now()}`;
            
            if (type === 'buy') {
                updateWalletBalance('USDT', -total);
                updateWalletBalance(coin.symbol, amount);
                
                addTransaction({
                    id: txId,
                    type: TransactionType.SWAP_IN, 
                    asset: coin.symbol,
                    amount: amount,
                    usdValue: total,
                    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                    status: 'Completed',
                    networkFee: total * 0.001 
                });
            } else {
                updateWalletBalance(coin.symbol, -amount);
                updateWalletBalance('USDT', total);

                addTransaction({
                    id: txId,
                    type: TransactionType.SWAP_OUT,
                    asset: coin.symbol,
                    amount: -amount,
                    usdValue: -total,
                    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                    status: 'Completed',
                    networkFee: total * 0.001 
                });
            }

            setStatusModalState(prev => ({ 
                ...prev, 
                status: 'success',
                details: { ...prev.details, transactionId: txId }
            }));

            const title = type === 'buy' ? 'Buy Order Filled' : 'Sell Order Filled';
            const message = `${type === 'buy' ? 'Bought' : 'Sold'} ${amount} ${coin.symbol} for ${total} USDT`;
            sendPushNotification(title, { body: message });
            addNotification({ icon: 'success', title, message });

        }, 1500);
    };

    if (!coin) {
        return (
            <PageLayout title="">
                 <div className="space-y-6 px-4 pt-4">
                    <SkeletonLoader className="h-20 w-full" />
                    <SkeletonLoader className="h-64 w-full" />
                    <SkeletonLoader className="h-32 w-full" />
                </div>
            </PageLayout>
        );
    }

    const IconComponent = assetIcons[coin.symbol] || assetIcons['USDT'];
    const isPositive = coin.change24h >= 0;
    
    const getGradientColor = (score: number) => {
        if (score >= 60) return 'bg-gradient-to-r from-success/50 to-success';
        if (score <= 40) return 'bg-gradient-to-r from-error/50 to-error';
        return 'bg-gradient-to-r from-brand-yellow/50 to-brand-yellow';
    };
    
    const sentimentIcon = aiData?.sentiment === 'Bullish' ? <TrendingUp className="w-4 h-4" /> : aiData?.sentiment === 'Bearish' ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />;

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-background-primary">
            <PageLayout 
                title={`${coin.name} (${coin.symbol})`}
                action={
                    <button 
                        onClick={() => setIsAlertModalOpen(true)} 
                        className="p-2 rounded-full hover:bg-background-tertiary transition-colors text-brand-yellow"
                    >
                        <BellRing className="w-5 h-5" />
                    </button>
                }
                scrollable={false} 
            >
                {/* Main Content */}
                <div className="flex-grow overflow-y-auto pb-32">
                    <div className="px-4 pt-4 space-y-4">
                        {/* Header Stats */}
                        <div className="flex items-start justify-between">
                            <div>
                                <p className={`text-4xl font-bold text-text-primary tracking-tight font-mono price-flash ${changeStatus === 'up' ? 'price-up' : changeStatus === 'down' ? 'price-down' : ''}`}>
                                    {formatCurrency(coin.price)}
                                </p>
                                <div className={`text-sm font-semibold mt-1 flex items-center gap-2 ${isPositive ? 'text-success' : 'text-error'}`}>
                                    <span>{isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%</span>
                                    <span className="text-text-secondary font-medium text-xs bg-background-tertiary px-1.5 py-0.5 rounded">24h</span>
                                </div>
                            </div>
                            <div className="p-1">
                                <IconComponent className="w-12 h-12" />
                            </div>
                        </div>

                        {/* Unified Tabs */}
                        <div className="flex bg-background-secondary p-1 rounded-lg border border-border-divider/50">
                            {['chart', 'depth', 'info'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
                                        activeTab === tab 
                                        ? `bg-background-tertiary text-text-primary shadow` 
                                        : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {tab === 'chart' ? 'Chart' : tab === 'depth' ? 'Order Book' : 'AI Pulse'}
                                </button>
                            ))}
                        </div>

                        {/* Chart Area - 50vh height for perfect mobile fit */}
                        {activeTab === 'chart' && (
                            <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden animate-fadeIn h-[50vh] relative">
                                <TradingChart symbol={coin.symbol} />
                            </div>
                        )}

                        {activeTab === 'depth' && (
                            <div className="bg-background-secondary rounded-xl border border-border-divider p-4 animate-fadeIn">
                                <h3 className="text-sm font-bold text-text-secondary mb-4 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4"/> Market Depth
                                </h3>
                                <OrderBook basePrice={coin.price} symbol={coin.symbol} />
                            </div>
                        )}

                        {activeTab === 'info' && (
                            <div className="space-y-4 animate-fadeIn">
                                {/* Enhanced AI Insight Card */}
                                <div className="p-5 rounded-3xl border transition-all relative overflow-hidden bg-background-secondary border-border-divider shadow-lg group">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand-yellow/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-brand-yellow/10 transition-colors duration-500"></div>
                                    
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-5 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2.5 rounded-xl bg-brand-yellow/10 ring-1 ring-brand-yellow/20">
                                                <SparklesIcon className="w-5 h-5 text-brand-yellow" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-text-primary">AI Market Pulse</h3>
                                                <p className="text-[10px] text-text-secondary">Powered by Gemini 2.5</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={fetchSentiment} 
                                            className="p-2 rounded-lg bg-background-tertiary hover:text-brand-yellow hover:bg-brand-yellow/10 transition-all border border-border-divider active:scale-95"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>

                                    {isAiLoading ? (
                                        <div className="space-y-4 animate-pulse">
                                            <div className="h-3 bg-background-tertiary rounded w-full"></div>
                                            <div className="h-3 bg-background-tertiary rounded w-5/6"></div>
                                            <div className="h-10 bg-background-tertiary rounded-xl w-full mt-4"></div>
                                        </div>
                                    ) : aiData ? (
                                        <div className="relative z-10">
                                            <div className="mb-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4 ${
                                                    aiData.sentiment === 'Bullish' ? 'bg-success/10 text-success border-success/20' : 
                                                    aiData.sentiment === 'Bearish' ? 'bg-error/10 text-error border-error/20' : 
                                                    'bg-background-tertiary text-text-secondary border-border-divider'
                                                }`}>
                                                    {sentimentIcon}
                                                    <span className="font-bold text-xs uppercase tracking-wide">{aiData.sentiment} Sentiment</span>
                                                </div>
                                                <p className="text-sm text-text-primary/90 leading-relaxed font-medium">
                                                    {aiData.summary}
                                                </p>
                                            </div>
                                            
                                            {/* Advanced Gauge */}
                                            <div className="mb-6 bg-background-tertiary/30 p-4 rounded-xl border border-border-divider/30">
                                                <div className="flex justify-between text-[10px] font-bold text-text-secondary mb-2 uppercase tracking-wide">
                                                    <span className="text-error">Fear</span>
                                                    <span className="text-success">Greed</span>
                                                </div>
                                                <div className="h-3 w-full bg-background-tertiary rounded-full overflow-hidden relative shadow-inner">
                                                    {/* Indicator Bar */}
                                                    <div 
                                                        className={`h-full ${getGradientColor(aiData.score)} relative transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.3)]`} 
                                                        style={{ width: `${aiData.score}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-xs text-text-secondary">Score</span>
                                                    <div className="font-mono font-bold text-lg text-text-primary">
                                                        {aiData.score}<span className="text-xs text-text-secondary font-sans font-normal ml-1">/ 100</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Key Levels Grid */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-background-tertiary/50 p-3 rounded-xl border border-border-divider/50 flex flex-col items-center justify-center relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-success/50"></div>
                                                    <div className="flex items-center gap-1.5 mb-1 text-success text-[10px] font-bold uppercase tracking-wider">
                                                        <Target className="w-3 h-3" /> Support
                                                    </div>
                                                    <p className="font-mono text-lg font-bold text-text-primary tracking-tight">
                                                        ${aiData.supportLevel.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                                    </p>
                                                </div>
                                                <div className="bg-background-tertiary/50 p-3 rounded-xl border border-border-divider/50 flex flex-col items-center justify-center relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-error/50"></div>
                                                    <div className="flex items-center gap-1.5 mb-1 text-error text-[10px] font-bold uppercase tracking-wider">
                                                        <BarChart3 className="w-3 h-3" /> Resistance
                                                    </div>
                                                    <p className="font-mono text-lg font-bold text-text-primary tracking-tight">
                                                        ${aiData.resistanceLevel.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-text-secondary mb-3">AI Analysis unavailable.</p>
                                            <button onClick={fetchSentiment} className="px-4 py-2 rounded-lg bg-background-tertiary text-xs font-bold text-brand-yellow hover:bg-brand-yellow/10 transition-colors">Analyze Now</button>
                                        </div>
                                    )}
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-background-secondary p-4 rounded-xl border border-border-divider shadow-sm">
                                        <span className="text-xs text-text-secondary block mb-1 font-medium">{t('market_cap')}</span>
                                        <span className="font-bold text-text-primary tracking-tight">{formatCurrency(coin.marketCap)}</span>
                                    </div>
                                    <div className="bg-background-secondary p-4 rounded-xl border border-border-divider shadow-sm">
                                        <span className="text-xs text-text-secondary block mb-1 font-medium">{t('volume_24h')}</span>
                                        <span className="font-bold text-text-primary tracking-tight">{formatCurrency(coin.volume24h)}</span>
                                    </div>
                                    <div className="col-span-2 bg-background-secondary p-4 rounded-xl border border-border-divider flex justify-between items-center shadow-sm">
                                        <span className="text-xs text-text-secondary font-medium">{t('circulating_supply')}</span>
                                        <span className="font-bold text-text-primary text-sm font-mono tracking-tight">
                                            {coin.marketCap / coin.price > 1000000 ? `${(coin.marketCap / coin.price / 1000000).toFixed(2)}M` : (coin.marketCap / coin.price).toLocaleString()} {coin.symbol}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Fixed Trading Footer with Glass Effect */}
                <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe bg-background-secondary/95 backdrop-blur-md border-t border-border-divider z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleTradeClick('buy')} 
                            className="flex-1 p-3.5 rounded-xl font-bold text-white bg-success hover:brightness-110 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            <ArrowDown className="w-5 h-5" />
                            {t('buy')}
                        </button>
                        <button 
                            onClick={() => handleTradeClick('sell')} 
                            className="flex-1 p-3.5 rounded-xl font-bold text-white bg-error hover:brightness-110 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            <ArrowUp className="w-5 h-5" />
                            {t('sell')}
                        </button>
                    </div>
                </div>

                <QuickTradeModal 
                    isOpen={isTradeModalOpen}
                    onClose={() => setIsTradeModalOpen(false)}
                    coin={coin}
                    initialType={tradeType}
                    wallets={wallets}
                    onConfirm={executeTrade}
                />

                <PriceAlertModal 
                    isOpen={isAlertModalOpen}
                    onClose={() => setIsAlertModalOpen(false)}
                    alerts={alerts}
                    onSetAlert={handleSetAlert}
                    onDeleteAlert={handleDeleteAlert}
                />

                <TransactionStatusModal 
                    isOpen={statusModalState.isOpen}
                    status={statusModalState.status}
                    details={statusModalState.details}
                    onClose={() => setStatusModalState(prev => ({ ...prev, isOpen: false }))}
                />
            </PageLayout>
        </div>
    );
};

export default CoinDetailScreen;
