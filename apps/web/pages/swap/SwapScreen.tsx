import React, { useState, useMemo, useEffect } from 'react';
import { swapService } from '../../services/SwapService';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLiveData } from '../../context/LiveDataContext';
import { SwapConfirmationModal } from '../../components/SwapConfirmationModal';
import { LoginPromptModal } from '../../components/LoginPromptModal';
import { Wallet, SwapHistoryItem, TransactionType } from '../../types';
import { ArrowDown, ChevronDown, AlertTriangle, Info, Network, Settings } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import { AssetSelectModal } from '../../components/AssetSelectModal';
import { assetIcons } from '../../components/icons/CryptoIcons';
import { SwapChart } from '../../components/SwapChart';
import { TransactionStatusModal, TransactionStatus } from '../../components/TransactionStatusModal';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { SwapSettingsModal } from '../../components/SwapSettingsModal';

const getStatusColor = (status: 'Completed' | 'Pending' | 'Failed') => {
    switch(status) {
        case 'Completed': return 'text-success';
        case 'Pending': return 'text-brand-yellow';
        case 'Failed': return 'text-error';
    }
};

// Default assets for non-authenticated users (like Binance)
const DEFAULT_SWAP_ASSETS: Wallet[] = [
    { id: 'usdt', name: 'Tether', symbol: 'USDT', balance: 0, usdValue: 0, network: 'TRC20' },
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', balance: 0, usdValue: 0, network: 'Bitcoin' },
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', balance: 0, usdValue: 0, network: 'ERC20' },
    { id: 'bnb', name: 'BNB', symbol: 'BNB', balance: 0, usdValue: 0, network: 'BEP20' },
    { id: 'usdc', name: 'USD Coin', symbol: 'USDC', balance: 0, usdValue: 0, network: 'ERC20' },
];

const SwapScreen: React.FC = () => {
    const { primaryColor } = useTheme();
    const { t } = useLanguage();
    const { isAuthenticated } = useAuth();
    const { formatCurrency } = useCurrency();
    const { sendPushNotification, addNotification } = useNotifications();
    const { marketCoins, wallets: userWallets, updateWalletBalance, addTransaction } = useLiveData();
    
    // Use user wallets if authenticated, otherwise use default assets
    const wallets = isAuthenticated && userWallets.length > 0 ? userWallets : DEFAULT_SWAP_ASSETS;
    
    const [swapHistory, setSwapHistory] = useState<SwapHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [fromAsset, setFromAsset] = useState<Wallet | undefined>();
    const [toAsset, setToAsset] = useState<Wallet | undefined>();
    const [fromAmount, setFromAmount] = useState('');
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    
    const [isAssetModalOpen, setAssetModalOpen] = useState(false);
    const [assetModalType, setAssetModalType] = useState<'from' | 'to'>('from');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const [slippage, setSlippage] = useState(0.5);
    const [deadline, setDeadline] = useState(20);
    
    const [statusModalState, setStatusModalState] = useState<{
        isOpen: boolean;
        status: TransactionStatus;
        details: any;
    }>({ isOpen: false, status: 'processing', details: {} });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await swapService.getHistory();
                // Transform API response to SwapHistoryItem format
                const historyData: SwapHistoryItem[] = response.items.map(item => ({
                    id: item.id,
                    fromAssetSymbol: (item.metadata?.fromAsset || item.asset) as 'USDT' | 'USDC' | 'BUSD' | 'DAI',
                    fromAmount: item.metadata?.fromAmount || item.amount,
                    toAssetSymbol: (item.metadata?.toAsset || 'USDT') as 'USDT' | 'USDC' | 'BUSD' | 'DAI',
                    toAmount: item.metadata?.toAmount || 0,
                    date: new Date(item.createdAt).toLocaleDateString(),
                    status: item.status === 'COMPLETED' ? 'Completed' : item.status === 'PENDING' ? 'Pending' : 'Failed'
                }));
                setSwapHistory(historyData);
            } catch {
                // Silent fail - backend may not be available
            } finally {
                setIsLoading(false);
            }
        };
        if (isAuthenticated) fetchData();
        else setIsLoading(false);
    }, [isAuthenticated]);

    // Initialization logic for assets once wallets are loaded
    useEffect(() => {
        if (wallets.length > 0 && !fromAsset) {
            setFromAsset(wallets[0]);
            const differentAsset = wallets.find(w => w.id !== wallets[0].id);
            setToAsset(differentAsset || wallets[0]);
        }
    }, [wallets, fromAsset]);
    
    // Only show insufficient assets warning for authenticated users with < 2 wallets
    const hasInsufficientAssets = isAuthenticated && userWallets.length > 0 && userWallets.length < 2;

    const fromPrice = useMemo(() => {
        if (!fromAsset) return 0;
        const coin = marketCoins.find(c => c.symbol === fromAsset.symbol);
        return coin ? coin.price : (fromAsset.balance > 0 ? fromAsset.usdValue / fromAsset.balance : 1);
    }, [fromAsset, marketCoins]);

    const toPrice = useMemo(() => {
        if (!toAsset) return 0;
        const coin = marketCoins.find(c => c.symbol === toAsset.symbol);
        return coin ? coin.price : 1;
    }, [toAsset, marketCoins]);

    const rate = useMemo(() => {
        if (toPrice === 0) return 0;
        return fromPrice / toPrice;
    }, [fromPrice, toPrice]);

    const isCrossChain = fromAsset?.network !== toAsset?.network;
    const swapFee = fromAmount ? parseFloat(fromAmount) * 0.001 : 0; 
    const bridgeFee = isCrossChain ? 1.0 : 0; 
    const totalFee = swapFee + bridgeFee;

    const toAmount = useMemo(() => {
        if (!fromAmount || !rate) return '';
        const rawAmount = parseFloat(fromAmount) * rate;
        const amountAfterSlippage = rawAmount * (1 - slippage / 100);
        return amountAfterSlippage.toFixed(6);
    }, [fromAmount, rate, slippage]);
    
    const priceImpact = useMemo(() => {
        const impact = (parseFloat(fromAmount || '0') / 100000);
        return impact < 0.01 ? '< 0.01%' : `${impact.toFixed(2)}%`;
    }, [fromAmount]);
    
    const isHighSlippage = slippage > 1;

    const handleSwapAssets = () => {
        if (hasInsufficientAssets) return;
        setFromAsset(toAsset);
        setToAsset(fromAsset);
    }
    
    const handleInitiateSwap = () => {
        if(isAuthenticated) setConfirmModalOpen(true);
        else setShowLoginPrompt(true);
    }

    const handleSwapSuccess = () => {
        setStatusModalState({
            isOpen: true,
            status: 'processing',
            details: {
                fromAmount: fromAmount,
                fromAsset: fromAsset?.symbol,
                toAmount: toAmount,
                toAsset: toAsset?.symbol,
                type: 'swap'
            }
        });

        setTimeout(() => {
            if(fromAsset && toAsset) {
                updateWalletBalance(fromAsset.symbol, -parseFloat(fromAmount));
                updateWalletBalance(toAsset.symbol, parseFloat(toAmount));
                
                addTransaction({
                    id: `tx-${Date.now()}`,
                    type: TransactionType.SWAP_IN, // Simplified for history
                    asset: toAsset.symbol,
                    amount: parseFloat(toAmount),
                    usdValue: parseFloat(toAmount) * toPrice,
                    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                    status: 'Completed',
                    networkFee: totalFee
                });
            }

            setStatusModalState(prev => ({ ...prev, status: 'success' }));
            const title = t('transaction_success_message');
            const message = `Swapped ${fromAmount} ${fromAsset?.symbol} for ~${toAmount} ${toAsset?.symbol}.`;
            sendPushNotification(title, { body: message });
            addNotification({ icon: 'success', title: 'Swap Successful', message });
            setFromAmount('');
        }, 2000);
    };

    const openAssetModal = (type: 'from' | 'to') => {
        setAssetModalType(type);
        setAssetModalOpen(true);
    };

    const handleSelectAsset = (wallet: Wallet) => {
        if (assetModalType === 'from') {
            if (toAsset && wallet.id === toAsset.id) {
                setToAsset(fromAsset);
            }
            setFromAsset(wallet);
        } else {
            if (fromAsset && wallet.id === fromAsset.id) {
                setFromAsset(toAsset);
            }
            setToAsset(wallet);
        }
        setAssetModalOpen(false);
    };
    
    const isAmountExceeded = isAuthenticated && fromAsset ? parseFloat(fromAmount) > fromAsset.balance : false;
    // For non-authenticated users, only disable if no amount entered
    const isSwapDisabled = !fromAmount || parseFloat(fromAmount) <= 0 || (isAuthenticated && (isAmountExceeded || hasInsufficientAssets));

    const FromIcon = fromAsset ? assetIcons[fromAsset.symbol] : null;
    const ToIcon = toAsset ? assetIcons[toAsset.symbol] : null;

    // Only show loading for authenticated users fetching their data
    if (isLoading && isAuthenticated && userWallets.length === 0) {
        return (
            <PageLayout title={t('swap')}>
                <SkeletonLoader className="h-full" />
            </PageLayout>
        );
    }

    return (
        <PageLayout 
            title={t('swap')} 
            noPadding
            action={
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-background-tertiary">
                    <Settings className="w-5 h-5" />
                </button>
            }
        >
            <div className="flex flex-col space-y-4 px-4 pt-4">
                {hasInsufficientAssets && (
                    <div className="bg-background-tertiary p-4 rounded-lg flex items-center gap-3 text-sm text-text-secondary">
                        <Info className="w-8 h-8 flex-shrink-0" />
                        <span>{t('insufficient_assets_for_swap')}</span>
                    </div>
                )}
                <div className={`flex flex-col gap-2 ${hasInsufficientAssets ? 'opacity-50' : ''}`}>
                    <div className="bg-background-secondary p-4 rounded-lg">
                        {/* From Asset Selection */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {FromIcon && <div className="p-2 rounded-full bg-background-tertiary">
                                    <FromIcon className="w-6 h-6" />
                                </div>}
                                <div>
                                    <p className="text-xs text-text-secondary mb-1">{t('from')}</p>
                                    <button onClick={() => openAssetModal('from')} className="text-sm font-bold text-text-primary hover:text-brand-yellow flex items-center gap-2">
                                        {fromAsset?.symbol || t('select_asset')}
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="text-right">
                                <input 
                                    type="text" 
                                    value={fromAmount}
                                    onChange={(e) => setFromAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="text-2xl font-bold text-text-primary w-32 text-right bg-transparent focus:outline-none"
                                />
                                <p className="text-xs text-text-secondary mt-1">{formatCurrency(fromPrice * parseFloat(fromAmount || '0'))}</p>
                            </div>
                        </div>
                    </div>

                    {/* Swap Arrow Button */}
                    <div className="flex justify-center">
                        <button 
                            onClick={handleSwapAssets}
                            disabled={hasInsufficientAssets}
                            className="p-3 rounded-full bg-brand-yellow text-background-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ArrowDown className="w-6 h-6" />
                        </button>
                    </div>

                    {/* To Asset Selection */}
                    <div className="bg-background-secondary p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {ToIcon && <div className="p-2 rounded-full bg-background-tertiary">
                                    <ToIcon className="w-6 h-6" />
                                </div>}
                                <div>
                                    <p className="text-xs text-text-secondary mb-1">{t('to')}</p>
                                    <button onClick={() => openAssetModal('to')} className="text-sm font-bold text-text-primary hover:text-brand-yellow flex items-center gap-2">
                                        {toAsset?.symbol || t('select_asset')}
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-text-primary">{toAmount}</p>
                                <p className="text-xs text-text-secondary mt-1">{formatCurrency(parseFloat(toAmount || '0') * toPrice)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Price Impact Warning */}
                    {isHighSlippage && (
                        <div className="bg-error/10 border border-error/30 rounded-lg p-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-error" />
                            <span className="text-xs text-error">{t('high_slippage_warning')}</span>
                        </div>
                    )}

                    {/* Swap Info */}
                    <div className="space-y-2 text-xs text-text-secondary">
                        <div className="flex justify-between">
                            <span>{t('exchange_rate')}</span>
                            <span className="font-mono">1 {fromAsset?.symbol || '-'} = {rate.toFixed(6)} {toAsset?.symbol || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>{t('price_impact')}</span>
                            <span className={priceImpact.includes('<') ? 'text-text-secondary' : 'text-error'}>{priceImpact}</span>
                        </div>
                        {isCrossChain && (
                            <div className="flex justify-between">
                                <span>{t('bridge_fee')}</span>
                                <span>$1.00</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span>{t('network_fee')}</span>
                            <span>{(swapFee).toFixed(4)} {fromAsset?.symbol}</span>
                        </div>
                    </div>

                    {/* Swap Button */}
                    <button 
                        onClick={handleInitiateSwap}
                        disabled={isSwapDisabled}
                        className="w-full py-4 rounded-xl font-bold text-background-primary bg-brand-yellow shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAuthenticated ? t('swap') : t('login_to_swap')}
                    </button>
                </div>

                {/* Swap History */}
                <div className="bg-background-secondary p-4 rounded-lg">
                    <h3 className="text-sm font-bold text-text-primary mb-3">{t('recent_swaps')}</h3>
                    {swapHistory.length > 0 ? (
                        <div className="space-y-2">
                            {swapHistory.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-2 bg-background-tertiary rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(item.status)} bg-opacity-10`}>
                                            <Network className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-text-primary">{item.fromAssetSymbol} → {item.toAssetSymbol}</p>
                                            <p className="text-[10px] text-text-secondary">{item.date}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono text-text-primary">{item.fromAmount} → {item.toAmount}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-text-secondary text-center py-4">{t('no_swap_history')}</p>
                    )}
                </div>

                {/* Swap Chart */}
                {fromAsset && toAsset && (
                    <div className="pb-4">
                        <SwapChart fromAssetSymbol={fromAsset.symbol} toAssetSymbol={toAsset.symbol} rate={rate} />
                    </div>
                )}
            </div>

            {/* Swap Confirmation Modal */}
            <SwapConfirmationModal 
                isOpen={isConfirmModalOpen} 
                onClose={() => setConfirmModalOpen(false)}
                fromAsset={fromAsset}
                toAsset={toAsset}
                fromAmount={fromAmount}
                toAmount={toAmount}
                rate={rate}
                slippage={slippage}
                onConfirm={handleSwapSuccess}
            />

            {/* Login Prompt Modal */}
            <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

            {/* Transaction Status Modal */}
            <TransactionStatusModal 
                isOpen={statusModalState.isOpen}
                status={statusModalState.status}
                details={statusModalState.details}
                onClose={() => setStatusModalState(prev => ({ ...prev, isOpen: false }))}
            />

            {/* Swap Settings Modal */}
            <SwapSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                slippage={slippage}
                setSlippage={setSlippage}
                deadline={deadline}
                setDeadline={setDeadline}
            />
        </PageLayout>
    );
};

export default SwapScreen;