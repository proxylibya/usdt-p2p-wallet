
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useLiveData } from '../../context/LiveDataContext';
import { useNotifications } from '../../context/NotificationContext';
import { ArrowUpDown, ChevronDown, Info } from 'lucide-react';
import { AssetSelectModal } from '../../components/AssetSelectModal';
import { assetIcons } from '../../components/icons/CryptoIcons';
import { Wallet, TransactionType } from '../../types';
import { TransactionStatusModal, TransactionStatus } from '../../components/TransactionStatusModal';

const TransferScreen: React.FC = () => {
    const { t, direction } = useLanguage();
    const { primaryColor } = useTheme();
    const { wallets, fundingWallets, performTransfer, addTransaction } = useLiveData();
    const { sendPushNotification, addNotification } = useNotifications();
    const navigate = useNavigate();

    const [fromAccount, setFromAccount] = useState<'Spot' | 'Funding'>('Spot');
    const [toAccount, setToAccount] = useState<'Spot' | 'Funding'>('Funding');
    const [amount, setAmount] = useState('');
    const [isAssetModalOpen, setAssetModalOpen] = useState(false);
    
    const [statusModalState, setStatusModalState] = useState<{
        isOpen: boolean;
        status: TransactionStatus;
        details: any;
    }>({ isOpen: false, status: 'processing', details: {} });

    const uniqueAssets = useMemo(() => {
        const map = new Map();
        const sourceList = fromAccount === 'Spot' ? wallets : fundingWallets;
        sourceList.forEach(w => {
            if (!map.has(w.symbol)) map.set(w.symbol, { ...w });
        });
        // Also include assets from the other wallet to ensure we can select them even if 0 balance in source
        const otherList = fromAccount === 'Spot' ? fundingWallets : wallets;
        otherList.forEach(w => {
            if (!map.has(w.symbol)) map.set(w.symbol, { ...w, balance: 0 }); // Override balance to 0 for selection purposes if not in source
        });
        
        return Array.from(map.values()) as Wallet[];
    }, [wallets, fundingWallets, fromAccount]);

    const [selectedAsset, setSelectedAsset] = useState<Wallet | undefined>(uniqueAssets[0] || wallets[0]);

    // Get real balances based on direction
    const sourceWallet = selectedAsset 
        ? (fromAccount === 'Spot' ? wallets : fundingWallets).find(w => w.symbol === selectedAsset.symbol) 
        : undefined;
    const availableBalance = sourceWallet ? sourceWallet.balance : 0;

    const handleFlip = () => {
        setFromAccount(prev => prev === 'Spot' ? 'Funding' : 'Spot');
        setToAccount(prev => prev === 'Spot' ? 'Funding' : 'Spot');
        setAmount('');
    };

    const handleConfirm = () => {
        const val = parseFloat(amount);
        if (!val || val <= 0) return;
        
        if (val > availableBalance) {
             addNotification({ icon: 'error', title: 'Error', message: t('insufficient_balance') });
             return;
        }
        
        if (!selectedAsset) return;
        const asset = selectedAsset;
        
        // Open Processing Modal
        setStatusModalState({
            isOpen: true,
            status: 'processing',
            details: {
                amount: val.toString(),
                asset: asset.symbol,
                type: 'send', // Reusing layout for generic amount/asset display
                fromAmount: fromAccount,
                toAmount: toAccount
            }
        });

        // Execute Transfer Logic
        setTimeout(() => {
            const txId = `tx-${Date.now()}`;
            
            // 1. Perform Real Transfer in State
            performTransfer(asset.symbol, val, fromAccount, toAccount);

            // 2. Log Transaction
            addTransaction({
                id: txId,
                type: TransactionType.TRANSFER,
                asset: asset.symbol,
                amount: val,
                usdValue: val * (asset.usdValue / (asset.balance || 1) || 1),
                date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                status: 'Completed',
                networkFee: 0,
                fromAddress: fromAccount, 
                toAddress: toAccount
            });

            // 3. Show Success
            setStatusModalState(prev => ({ 
                ...prev, 
                status: 'success',
                details: { ...prev.details, transactionId: txId }
            }));
            const title = t('transfer_success');
            const message = `Transferred ${val} ${asset.symbol} from ${fromAccount} to ${toAccount}.`;
            sendPushNotification(title, { body: message });
            
        }, 1500);
    };

    const IconComponent = selectedAsset ? assetIcons[selectedAsset.symbol] : null;

    // Show loading if no asset selected yet (wallets not loaded)
    if (!selectedAsset) {
        return (
            <PageLayout title={t('transfer')} scrollable={false}>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow"></div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title={t('transfer')} scrollable={false}>
            <div className="flex flex-col h-full space-y-6">
                {/* From/To Card Section */}
                <div className="relative mt-4 mx-4">
                    {/* Connecting Line and Dots */}
                    <div className="absolute ltr:left-5 rtl:right-5 top-12 bottom-12 w-0.5 bg-border-divider z-0"></div>
                    
                    <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden relative z-10">
                        {/* From Section */}
                        <div className="p-4 flex items-center gap-4 relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-brand-yellow z-10 shadow-[0_0_0_4px_rgba(240,185,11,0.2)] shrink-0"></div>
                            <div className="flex-1 text-start">
                                <p className="text-xs text-text-secondary mb-1 font-medium">{t('from')}</p>
                                <p className="text-base font-bold text-text-primary">{t(fromAccount.toLowerCase() as any) || fromAccount}</p>
                            </div>
                        </div>

                        {/* Divider with Swap Button */}
                        <div className="relative h-px bg-border-divider mx-14">
                            <button 
                                onClick={handleFlip}
                                className={`absolute end-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background-secondary border border-border-divider ${primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green'} hover:bg-background-tertiary transition-transform active:scale-95 shadow-sm z-20`}
                            >
                                <ArrowUpDown className="w-5 h-5" />
                            </button>
                        </div>

                        {/* To Section */}
                        <div className="p-4 flex items-center gap-4 relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-background-tertiary border-2 border-text-secondary z-10 shrink-0"></div>
                            <div className="flex-1 text-start">
                                <p className="text-xs text-text-secondary mb-1 font-medium">{t('to')}</p>
                                <p className="text-base font-bold text-text-primary">{t(toAccount.toLowerCase() as any) || toAccount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto px-4 space-y-6">
                    {/* Asset Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-secondary ms-1">{t('asset')}</label>
                        <button 
                            onClick={() => setAssetModalOpen(true)}
                            className="w-full flex items-center justify-between bg-background-secondary p-4 rounded-xl border border-border-divider hover:bg-background-tertiary transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                {IconComponent && <IconComponent className="w-8 h-8" />}
                                <span className="font-bold text-lg text-text-primary">{selectedAsset.symbol}</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-secondary group-hover:text-text-primary transition-colors">
                                <span className="text-sm">{selectedAsset.name}</span>
                                <ChevronDown className="w-5 h-5" />
                            </div>
                        </button>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                        <div className="flex justify-between ms-1">
                            <label className="text-sm font-bold text-text-secondary">{t('amount')}</label>
                            <span className="text-xs text-text-secondary flex items-center gap-1">
                                {t('available')}: 
                                <span className="font-bold text-text-primary">{availableBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedAsset.symbol}</span>
                            </span>
                        </div>
                        <div className="relative bg-background-secondary border border-border-divider rounded-xl p-4 flex items-center focus-within:border-brand-yellow transition-colors">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-transparent text-2xl font-bold focus:outline-none ltr:text-left rtl:text-right placeholder-text-secondary/30 font-mono"
                                dir="ltr"
                            />
                            <div className="flex items-center gap-2 ms-4 shrink-0">
                                <span className="font-bold text-text-primary text-sm">{selectedAsset.symbol}</span>
                                <div className="w-px h-5 bg-border-divider mx-1"></div>
                                <button 
                                    onClick={() => setAmount(availableBalance.toString())}
                                    className={`text-xs font-bold uppercase px-3 py-1.5 rounded-md ${primaryColor === 'brand-yellow' ? 'bg-primary-gold-10 text-primary-gold hover:bg-primary-gold-20' : 'bg-primary-green-10 text-primary-green hover:bg-primary-green-20'} transition-colors`}
                                >
                                    Max
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-none p-4 bg-background-primary border-t border-border-divider/50 z-20">
                    <button 
                        onClick={handleConfirm}
                        disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance}
                        className={`w-full p-4 rounded-xl text-lg font-bold text-background-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${primaryColor === 'brand-yellow' ? 'bg-brand-yellow' : 'bg-brand-green'}`}
                    >
                        {t('confirm')} {t('transfer')}
                    </button>
                </div>
            </div>

            <AssetSelectModal 
                isOpen={isAssetModalOpen} 
                onClose={() => setAssetModalOpen(false)} 
                onSelect={(w) => { setSelectedAsset(w); setAssetModalOpen(false); }}
                title={t('select_asset')}
                wallets={uniqueAssets}
            />

            <TransactionStatusModal 
                isOpen={statusModalState.isOpen}
                status={statusModalState.status}
                details={statusModalState.details}
                onClose={() => {
                    setStatusModalState(prev => ({ ...prev, isOpen: false }));
                    if (statusModalState.status === 'success') {
                        navigate('/wallet');
                    }
                }}
            />
        </PageLayout>
    );
};

export default TransferScreen;
