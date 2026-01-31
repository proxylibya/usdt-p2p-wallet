
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ALL_PAYMENT_METHODS } from '../../constants';
import { Wallet, PaymentMethod, TransactionType } from '../../types';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLiveData } from '../../context/LiveDataContext';
import { CopyIcon } from '../../components/icons/CopyIcon';
import { Share2, Download, ChevronRight, AlertTriangle, History, ChevronDown, Wallet as WalletIcon, Banknote, Building2, CreditCard, Info, Clock, CheckCircle, Copy, Network, Check, ShieldCheck } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { assetIcons } from '../../components/icons/CryptoIcons';
import { useNotifications } from '../../context/NotificationContext';
import { COUNTRIES, Country } from '../../constants/countries';
import { Flag } from '../../components/Flag';
import { MarketSelectModal } from '../../components/MarketSelectModal';
import { walletService } from '../../services';
import { SelectField } from '../../components/SelectField';
import { SelectModal } from '../../components/SelectModal';

// Helper to render dynamic payment icons based on brand colors
const PaymentMethodIcon: React.FC<{ methodKey: string }> = ({ methodKey }) => {
    const { primaryColor } = useTheme();

    // Map keys to specific visual styles
    const getStyle = (key: string) => {
        // Mobile Wallets
        if (key.includes('vodafone')) return { bg: 'bg-red-600', label: 'V', textColor: 'text-white' };
        if (key.includes('orange')) return { bg: 'bg-orange-500', label: 'O', textColor: 'text-white' };
        if (key.includes('etisalat')) return { bg: 'bg-green-500', label: 'E', textColor: 'text-white' };
        if (key.includes('insta')) return { bg: 'bg-purple-900', label: 'IP', textColor: 'text-white' };
        
        // Libyan Methods
        if (key.includes('sadad')) return { bg: 'bg-green-800', label: 'S', textColor: 'text-white' };
        if (key.includes('mobi')) return { bg: 'bg-blue-600', label: 'M', textColor: 'text-white' };
        if (key.includes('tadavul')) return { bg: 'bg-blue-700', label: 'T', textColor: 'text-white' };
        
        // Global Methods
        if (key.includes('wise')) return { bg: 'bg-lime-400', label: 'Wise', textColor: 'text-slate-800 text-[10px] tracking-tight' };
        if (key.includes('payoneer')) return { bg: 'bg-white border border-gray-200', icon: <span className="font-bold text-orange-600 text-[10px]">Pay</span>, label: '' }; 
        if (key.includes('paypal')) return { bg: 'bg-blue-900', label: 'P', textColor: 'text-white italic font-serif' };
        
        return { bg: 'bg-background-tertiary', icon: <Banknote className="w-5 h-5 text-text-secondary" />, label: '' };
    };

    const style = getStyle(methodKey);

    return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden ${style.bg}`}>
            {style.label ? <span className={`font-black ${style.textColor || 'text-white'} ${style.label.length > 2 ? 'text-[9px]' : 'text-xs'}`}>{style.label}</span> : style.icon}
        </div>
    );
};

const DepositScreen: React.FC = () => {
    const { t, detectedCountry } = useLanguage();
    const { primaryColor } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const { user } = useAuth();
    const { wallets, updateWalletBalance, addTransaction } = useLiveData();
    
    const [activeTab, setActiveTab] = useState<'crypto' | 'fiat'>('crypto');

    // --- Crypto Logic ---
    const uniqueAssets = useMemo(() => {
        const map = new Map();
        wallets.forEach(w => {
            if (!map.has(w.symbol)) map.set(w.symbol, { ...w });
        });
        return Array.from(map.values());
    }, [wallets]);
    
    const [selectedAsset, setSelectedAsset] = useState<Wallet | null>(() => {
        const assetSymbol = location.state?.assetSymbol;
        if (assetSymbol && uniqueAssets.length > 0) {
            return uniqueAssets.find(w => w.symbol === assetSymbol) || uniqueAssets[0];
        }
        return uniqueAssets.length > 0 ? uniqueAssets[0] : null;
    });

    // Update selectedAsset when wallets load
    useEffect(() => {
        if (!selectedAsset && uniqueAssets.length > 0) {
            const assetSymbol = location.state?.assetSymbol;
            if (assetSymbol) {
                setSelectedAsset(uniqueAssets.find(w => w.symbol === assetSymbol) || uniqueAssets[0]);
            } else {
                setSelectedAsset(uniqueAssets[0]);
            }
        }
    }, [uniqueAssets, selectedAsset, location.state?.assetSymbol]);

    const [isNetworkModalOpen, setNetworkModalOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const networks = useMemo(() => {
        if (!selectedAsset) return ['TRC20'];
        if (selectedAsset.symbol === 'USDT') return ['TRC20', 'ERC20', 'BEP20', 'SOL'];
        if ((selectedAsset.symbol as string) === 'ETH') return ['ERC20', 'BEP20', 'Arbitrum One'];
        if ((selectedAsset.symbol as string) === 'BTC') return ['Bitcoin', 'BEP20'];
        return [selectedAsset.network];
    }, [selectedAsset]);
    
    // Default to TRC20 for USDT
    const [selectedNetwork, setSelectedNetwork] = useState(selectedAsset?.symbol === 'USDT' ? 'TRC20' : networks[0]);
    const [copied, setCopied] = useState(false);
    const [depositAddress, setDepositAddress] = useState('');
    const [depositQrCodeUrl, setDepositQrCodeUrl] = useState('');
    const [isAddressLoading, setIsAddressLoading] = useState(false);

    const walletAddress = useMemo(() => {
        if (isAddressLoading) return '...';
        return depositAddress || t('no_address_found');
    }, [depositAddress, isAddressLoading, t]);

    useEffect(() => { 
        if (!selectedAsset) return;
        if (selectedAsset.symbol === 'USDT') setSelectedNetwork('TRC20');
        else setSelectedNetwork(networks[0]); 
    }, [selectedAsset, networks]);

    useEffect(() => {
        if (!selectedAsset) return;
        let isActive = true;
        setIsAddressLoading(true);
        walletService.getDepositAddress(selectedAsset.symbol, selectedNetwork)
            .then((response) => {
                if (!isActive) return;
                if (response.success && response.data?.address) {
                    setDepositAddress(response.data.address);
                    setDepositQrCodeUrl(
                        response.data.qrCode ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(response.data.address)}&color=000000&bgcolor=ffffff&margin=2`
                    );
                } else {
                    setDepositAddress('');
                    setDepositQrCodeUrl('');
                }
            })
            .finally(() => {
                if (isActive) setIsAddressLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [selectedAsset?.symbol, selectedNetwork]);

    const handleCopy = (text: string) => {
        if (!depositAddress) return;
        navigator.clipboard.writeText(text);
        addNotification({ icon: 'success', title: t('copied'), message: t('address_copied') });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveImage = () => {
        addNotification({ icon: 'info', title: t('saving'), message: 'Generating image...' });
        setTimeout(() => {
            addNotification({ icon: 'success', title: t('success'), message: 'QR Code saved to gallery.' });
        }, 1500);
    };

    const handleShare = async () => {
        if (!depositAddress) return;
        const shareData = {
            title: t('deposit_address'),
            text: `Here is my ${selectedAsset?.symbol} (${selectedNetwork}) deposit address: ${depositAddress}`,
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch { /* Share dismissed */ }
        } else {
            handleCopy(walletAddress);
        }
    };

    const CryptoIconComponent = selectedAsset ? assetIcons[selectedAsset.symbol] : null;
    const selectedAssetLabel = selectedAsset ? `${selectedAsset.name} (${selectedAsset.symbol})` : '';

    // Show loading if wallets not yet loaded
    if (!selectedAsset) {
        return (
            <PageLayout title={t('deposit')}>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-brand-yellow border-t-transparent rounded-full"></div>
                </div>
            </PageLayout>
        );
    }

    // --- Fiat Logic ---
    
    // Initialize with user country, fall back to detected IP country, then default to Libya/USD global if not set
    // This logic ensures 'guest' users from Libya see Libyan methods immediately
    const [depositCountryCode, setDepositCountryCode] = useState<string>(() => {
        if (user?.countryCode) return user.countryCode;
        if (detectedCountry) return detectedCountry;
        return 'LY'; // Default to Libya logic if nothing else found for demo
    });

    const [isCountrySelectorOpen, setIsCountrySelectorOpen] = useState(false);
    
    const depositCountry = useMemo(() => {
        if (depositCountryCode === 'GLOBAL') return { currency: 'USD', name: 'Global', code: 'GLOBAL' };
        return COUNTRIES.find(c => c.code === depositCountryCode) || COUNTRIES.find(c => c.code === 'LY')!;
    }, [depositCountryCode]);
    
    const [fiatAmount, setFiatAmount] = useState('100');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
    const [selectedCardType, setSelectedCardType] = useState<'visa' | 'mastercard' | null>(null);
    const [isDepositRequestSent, setIsDepositRequestSent] = useState(false);
    const [referenceId, setReferenceId] = useState('');

    const localMethods = useMemo(() => {
        return ALL_PAYMENT_METHODS.filter(m => m.countryCode === depositCountry.code);
    }, [depositCountry]);

    const handleFiatDepositRequest = () => {
        if (!fiatAmount) return;
        
        if (selectedCardType) {
             setIsDepositRequestSent(true);
             addNotification({
                icon: 'success',
                title: 'Redirecting',
                message: t('redirecting_gateway')
             });
        } else if (selectedPaymentMethod) {
            const ref = `${Math.floor(10000000 + Math.random() * 90000000)}`;
            setReferenceId(ref);
            setIsDepositRequestSent(true);
            addNotification({
                icon: 'success',
                title: t('deposit_request_created'),
                message: `Please send funds to the details provided.`
            });
        }
    };

    const confirmDeposit = () => {
        const amountToAdd = parseFloat(fiatAmount) || 100;
        updateWalletBalance('USDT', amountToAdd);
        addTransaction({
            id: `tx-${Date.now()}`,
            type: TransactionType.DEPOSIT,
            asset: 'USDT',
            amount: amountToAdd,
            usdValue: amountToAdd,
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            status: 'Completed',
            networkFee: 0
        });

        addNotification({
            icon: 'success',
            title: t('deposit_confirmed'),
            message: `Your deposit of ${amountToAdd} USDT has been credited.`
        });
        navigate('/wallet');
    };
    
    const handleCountrySelect = (country: Country | null) => {
        setDepositCountryCode(country ? country.code : 'GLOBAL');
        setIsCountrySelectorOpen(false);
        setSelectedPaymentMethod(null);
        setSelectedCardType(null);
    }

    // Generate dynamic QR Code URL - Standard Black on White for better scanning
    const qrCodeUrl = depositQrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(depositAddress || '')}&color=000000&bgcolor=ffffff&margin=2`;

    const DetailRow: React.FC<{ label: string; value: string; onCopy?: () => void; isRef?: boolean }> = ({ label, value, onCopy, isRef }) => {
        const [isCopied, setIsCopied] = useState(false);
        const handleCopyDetail = () => {
            if (onCopy) {
                onCopy();
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            }
        }

        return (
            <div className="flex justify-between items-center py-2">
                <span className={`text-sm ${isRef ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>{label}</span>
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xl text-brand-yellow">{value}</span>
                    {onCopy && (
                        <button onClick={handleCopyDetail} className={`p-1.5 rounded-md hover:bg-background-primary transition-colors ${isCopied ? 'text-success' : 'text-text-secondary hover:text-text-primary'}`}>
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // Determines if the bottom action sheet should be visible
    const showFiatAction = activeTab === 'fiat' && !isDepositRequestSent && (selectedPaymentMethod !== null || selectedCardType !== null);

    return (
        <PageLayout 
            title={t('deposit')} 
            action={<button onClick={() => navigate('/wallet/history')} className="p-2 rounded-full hover:bg-background-tertiary transition-colors"><History className="w-5 h-5 text-text-secondary" /></button>}
            noPadding
            scrollable={false}
        >
            <div className="flex flex-col h-full relative">
                <div className="px-4 pt-2">
                    <div className="flex bg-background-secondary p-1.5 rounded-xl border border-border-divider/30 mb-4">
                        <button 
                            onClick={() => setActiveTab('crypto')} 
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all bg-brand-yellow text-background-primary"
                        >
                            <WalletIcon className="w-4 h-4" />
                            {t('crypto')}
                        </button>
                        <button 
                            onClick={() => setActiveTab('fiat')} 
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all text-text-secondary hover:text-text-primary"
                        >
                            <Banknote className="w-4 h-4" />
                            {t('bank_transfer')}
                        </button>
                    </div>
                </div>

                {/* Main Scrollable Content */}
                <div className="flex-grow overflow-y-auto px-4 pb-32 space-y-6">
                    {activeTab === 'crypto' && (
                        <div className="space-y-6 animate-fadeInDown">
                            <div className="space-y-1.5">
                                <label className="text-xs text-text-secondary mb-1 block ms-1 font-medium">{t('select_asset')}</label>
                                <div className="relative">
                                    <SelectField
                                        valueLabel={selectedAssetLabel}
                                        onClick={() => setIsAssetModalOpen(true)}
                                        leftIcon={CryptoIconComponent ? <CryptoIconComponent className="w-7 h-7" /> : undefined}
                                        style={{ '--tw-ring-color': `var(--tw-color-${primaryColor})` } as React.CSSProperties}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-text-secondary ms-1 font-bold uppercase tracking-wide">{t('network')}</label>
                                <button 
                                    onClick={() => setNetworkModalOpen(true)}
                                    className="w-full flex justify-between items-center bg-background-secondary border border-border-divider rounded-xl p-4 hover:border-brand-yellow/50 hover:bg-background-tertiary transition-all group active:scale-[0.99] shadow-sm relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="w-10 h-10 rounded-full bg-background-tertiary flex items-center justify-center border border-border-divider group-hover:border-brand-yellow/30 transition-colors">
                                            <Network className="w-5 h-5 text-text-secondary group-hover:text-brand-yellow transition-colors" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-bold text-text-primary text-base group-hover:text-brand-yellow transition-colors">{selectedNetwork}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-text-secondary font-medium bg-background-primary/50 px-1.5 py-0.5 rounded border border-border-divider/50">
                                                    {t('arrival_time')} {t('time_estimate_2_mins')}
                                                </span>
                                                {selectedNetwork === 'TRC20' && (
                                                    <span className="text-[10px] font-bold text-background-primary bg-success px-1.5 py-0.5 rounded">
                                                        Recommended
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-text-secondary rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                                </button>
                            </div>

                            {/* QR Code Card */}
                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    {/* Glow effect */}
                                    <div className={`absolute -inset-1 bg-gradient-to-b from-${primaryColor}/20 to-transparent rounded-3xl blur-xl opacity-50`}></div>
                                    
                                    <div className="relative bg-white p-3 rounded-2xl shadow-2xl">
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-2">
                                            <img 
                                                src={qrCodeUrl} 
                                                alt="Deposit QR Code" 
                                                className="w-48 h-48 object-contain"
                                            />
                                        </div>
                                        {/* Center Logo Overlay */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-white rounded-full p-1.5 shadow-lg border border-gray-100 flex items-center justify-center">
                                            {CryptoIconComponent && <CryptoIconComponent className="w-full h-full" />}
                                        </div>
                                    </div>
                                </div>
                                
                                <p className="mt-6 text-xs text-text-secondary font-medium uppercase tracking-wider">{t('deposit_address')}</p>
                                
                                <div 
                                    onClick={() => handleCopy(walletAddress)}
                                    className="mt-2 flex items-center gap-3 bg-background-secondary hover:bg-background-tertiary px-5 py-3 rounded-xl border border-border-divider cursor-pointer transition-all active:scale-95 group w-full max-w-xs justify-between"
                                >
                                    <p className="font-mono font-bold text-text-primary text-sm truncate">{walletAddress}</p>
                                    <div className="transition-colors text-text-secondary group-hover:text-brand-yellow">
                                        {copied ? <Check className="w-4 h-4 animate-pulse" /> : <CopyIcon className="w-4 h-4"/>}
                                    </div>
                                </div>
                                {copied && <p className="text-success text-xs font-bold mt-2 animate-fadeInDown">{t('copied')}</p>}

                                <div className="grid grid-cols-2 gap-3 w-full mt-6">
                                    <button onClick={handleSaveImage} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-background-secondary hover:bg-background-tertiary border border-border-divider transition-all font-bold text-sm text-text-secondary hover:text-text-primary">
                                        <Download className="w-4 h-4" />
                                        {t('save_image')}
                                    </button>
                                    <button onClick={handleShare} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-background-secondary hover:bg-background-tertiary border border-border-divider transition-all font-bold text-sm text-text-secondary hover:text-text-primary">
                                        <Share2 className="w-4 h-4" />
                                        {t('share_address')}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 items-start p-4 bg-background-tertiary/40 rounded-xl border border-border-divider/30">
                                <div className="bg-brand-yellow/10 p-1.5 rounded-full flex-shrink-0"><AlertTriangle className="w-4 h-4 text-brand-yellow" /></div>
                                <p className="text-xs text-text-secondary leading-relaxed">{t('min_deposit_warning')}</p>
                            </div>
                        </div>
                    )}

                    {/* === FIAT / BANK TRANSFER TAB === */}
                    {activeTab === 'fiat' && (
                         <div className="space-y-6 animate-fadeInDown">
                            {!isDepositRequestSent ? (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-text-secondary ms-1 font-medium">{t('deposit_currency')}</label>
                                        <button 
                                            onClick={() => setIsCountrySelectorOpen(true)}
                                            className="bg-background-secondary p-4 rounded-xl w-full flex items-center justify-between border border-border-divider hover:border-brand-yellow transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                {depositCountry.code !== 'GLOBAL' ? (
                                                    <Flag code={depositCountry.code} className="w-8 h-6 rounded-sm shadow-sm object-cover" />
                                                ) : (
                                                    <div className="w-8 h-6 bg-blue-500/20 rounded-sm flex items-center justify-center text-blue-500 font-bold text-xs">GL</div>
                                                )}
                                                <div className="text-start">
                                                    <span className="block font-bold text-text-primary text-lg leading-none">{depositCountry.currency}</span>
                                                    <span className="text-xs text-text-secondary">{depositCountry.name}</span>
                                                </div>
                                            </div>
                                            <ChevronDown className="w-5 h-5 text-text-secondary" />
                                        </button>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-text-secondary ms-1 mb-2 block">{t('amount')}</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={fiatAmount}
                                                onChange={e => setFiatAmount(e.target.value)}
                                                className="w-full bg-background-secondary border border-border-divider rounded-xl p-4 text-2xl font-bold text-text-primary focus:outline-none focus:border-brand-yellow placeholder:text-text-secondary/30 ltr:pr-16 rtl:pl-16 ltr:text-left rtl:text-right"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 font-bold text-text-secondary">{depositCountry.currency}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Credit Card Section */}
                                    <div>
                                        <label className="text-sm font-medium text-text-secondary ms-1 mb-2 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5"/> {t('pay_with_card')}</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => { setSelectedCardType('visa'); setSelectedPaymentMethod(null); }}
                                                className="relative p-4 rounded-xl border transition-all overflow-hidden group bg-brand-yellow/10 border-brand-yellow shadow-sm"
                                            >
                                                <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-900/10 rounded-full blur-xl group-hover:bg-blue-900/20 transition-colors"></div>
                                                <div className="flex flex-col items-start gap-3 relative z-10">
                                                    <div className="font-black italic text-2xl text-text-primary tracking-tighter">VISA</div>
                                                    <span className="text-[10px] text-text-secondary font-medium bg-background-tertiary px-2 py-1 rounded">{t('instant')}</span>
                                                </div>
                                                {selectedCardType === 'visa' && <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-brand-yellow"></div>}
                                            </button>
                                            
                                            <button 
                                                onClick={() => { setSelectedCardType('mastercard'); setSelectedPaymentMethod(null); }}
                                                className="relative p-4 rounded-xl border transition-all overflow-hidden group bg-brand-yellow/10 border-brand-yellow shadow-sm"
                                            >
                                                <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-colors"></div>
                                                 <div className="flex flex-col items-start gap-3 relative z-10">
                                                    <div className="flex items-center -space-x-2">
                                                        <div className="w-6 h-6 rounded-full bg-red-500/80"></div>
                                                        <div className="w-6 h-6 rounded-full bg-yellow-500/80"></div>
                                                    </div>
                                                    <span className="text-[10px] text-text-secondary font-medium bg-background-tertiary px-2 py-1 rounded">{t('instant')}</span>
                                                </div>
                                                {selectedCardType === 'mastercard' && <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-brand-yellow"></div>}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bank Transfer / Local Methods Section */}
                                    <div>
                                        <label className="text-sm font-medium text-text-secondary ms-1 mb-2 flex items-center gap-1"><Building2 className="w-3.5 h-3.5"/> {t('pay_via_bank')}</label>
                                        {localMethods.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-3">
                                                {localMethods.map(method => (
                                                    <button 
                                                        key={method.key}
                                                        onClick={() => { setSelectedPaymentMethod(method); setSelectedCardType(null); }}
                                                        className="flex items-center gap-4 p-4 rounded-xl border transition-all bg-brand-yellow/10 border-brand-yellow"
                                                    >
                                                        <PaymentMethodIcon methodKey={method.key} />
                                                        <div className="text-start">
                                                            <p className="font-bold text-text-primary">{t(method.key as any)}</p>
                                                            <p className="text-xs text-text-secondary">{t('local_transfer_no_fees')}</p>
                                                        </div>
                                                        {selectedPaymentMethod?.key === method.key && <div className="w-3 h-3 rounded-full bg-brand-yellow ms-auto"></div>}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center p-6 bg-background-secondary rounded-xl border border-border-divider/50 border-dashed">
                                                <Info className="w-8 h-8 text-text-secondary mx-auto mb-2" />
                                                <p className="text-text-secondary text-sm">{t('no_local_methods', { country: depositCountry.name })}</p>
                                            </div>
                                        )}
                                    </div>
                                    {/* Removed button from here */}
                                </>
                            ) : (
                                <div className="animate-fadeInUp space-y-6">
                                    <div className="bg-brand-yellow/10 border border-brand-yellow/20 p-4 rounded-xl flex items-start gap-3">
                                        <Info className="w-5 h-5 text-brand-yellow shrink-0 mt-0.5" />
                                        <p className="text-xs text-text-secondary leading-relaxed">
                                            {t('please_transfer_exactly')} <span className="font-bold text-text-primary">{fiatAmount} {depositCountry.currency}</span>. 
                                            {t('include_ref_id')}
                                        </p>
                                    </div>

                                    <div className="bg-background-secondary rounded-2xl border border-border-divider overflow-hidden shadow-sm">
                                        <div className="bg-background-tertiary/50 p-4 border-b border-border-divider flex justify-between items-center">
                                            <span className="text-sm font-bold text-text-primary">{t('bank_transfer_details')}</span>
                                            <div className="flex items-center gap-1 text-xs text-brand-yellow bg-brand-yellow/10 px-2 py-1 rounded">
                                                <Clock className="w-3 h-3" />
                                                <span>14:59</span>
                                            </div>
                                        </div>
                                        
                                        <div className="p-4 space-y-1 divide-y divide-border-divider/30">
                                            <DetailRow label={t('beneficiary_name')} value="Global Treasury Ltd." onCopy={() => handleCopy("Global Treasury Ltd.")} />
                                            <DetailRow label={t('bank_name')} value={t(selectedPaymentMethod?.key as any) || "Local Bank"} />
                                            <DetailRow label={t('account_number_iban')} value="LY58 0000 0000 1234 5678" onCopy={() => handleCopy("LY580000000012345678")} />
                                            <div className="pt-2">
                                                <DetailRow label={t('reference_id')} value={referenceId} onCopy={() => handleCopy(referenceId)} isRef />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <button onClick={confirmDeposit} className={`w-full p-4 rounded-xl font-bold text-background-primary transition-all active:scale-[0.98] bg-${primaryColor} shadow-sm`}>
                                            {t('i_have_made_transfer')}
                                        </button>
                                        <button onClick={() => setIsDepositRequestSent(false)} className="w-full p-3 rounded-xl font-bold text-text-secondary hover:bg-background-secondary transition-colors">
                                            {t('cancel_request')}
                                        </button>
                                    </div>
                                </div>
                            )}
                         </div>
                    )}
                </div>

                {/* Sticky Action Footer */}
                <div 
                    className={`absolute bottom-0 left-0 right-0 p-4 bg-background-primary border-t border-border-divider shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-20 transition-transform duration-300 ${showFiatAction ? 'translate-y-0' : 'translate-y-full'}`}
                >
                    <button 
                        onClick={handleFiatDepositRequest}
                        disabled={!fiatAmount || (!selectedPaymentMethod && !selectedCardType)}
                        className={`w-full p-4 rounded-xl font-bold text-lg text-background-primary transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${primaryColor === 'brand-yellow' ? 'bg-brand-yellow' : 'bg-brand-green'}`}
                    >
                        {selectedCardType ? t('pay_securely') : t('continue')}
                    </button>
                </div>
            </div>

            <Modal isOpen={isNetworkModalOpen} onClose={() => setNetworkModalOpen(false)} title={t('select_network')}>
                <div className="space-y-2">
                    {networks.map((net) => {
                        return (
                            <button 
                                key={net} 
                                onClick={() => { setSelectedNetwork(net); setNetworkModalOpen(false); }}
                                className={`w-full flex justify-between items-center p-4 rounded-xl transition-all border ${selectedNetwork === net ? `bg-${primaryColor}/10 border-${primaryColor}` : 'bg-background-tertiary border-transparent hover:bg-border-divider'}`}
                            >
                                <div className="text-start">
                                    <p className={`font-bold text-sm ${selectedNetwork === net ? `text-${primaryColor}` : 'text-text-primary'}`}>{net}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-text-secondary">{t('arrival_time')} {t('time_estimate_2_mins')}</span>
                                        {net === 'TRC20' && selectedAsset.symbol === 'USDT' && <span className="text-[10px] font-bold text-background-primary bg-success px-1.5 py-0.5 rounded">Fastest</span>}
                                    </div>
                                </div>
                                {selectedNetwork === net && <div className={`w-3 h-3 rounded-full bg-${primaryColor}`}></div>}
                            </button>
                        );
                    })}
                </div>
            </Modal>

            <SelectModal
                isOpen={isAssetModalOpen}
                onClose={() => setIsAssetModalOpen(false)}
                title={t('select_asset')}
                value={selectedAsset.symbol}
                searchable
                searchPlaceholder={t('search_asset')}
                accentColorClassName={primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'}
                options={uniqueAssets.map((wallet) => {
                    const Ico = assetIcons[wallet.symbol];
                    return {
                        value: wallet.symbol,
                        label: `${wallet.symbol} - ${wallet.name}`,
                        description: wallet.network,
                        icon: Ico ? <Ico className="w-8 h-8" /> : undefined,
                    };
                })}
                onChange={(symbol) => {
                    const next = uniqueAssets.find(w => w.symbol === symbol);
                    if (next) setSelectedAsset(next);
                }}
            />
            
            <MarketSelectModal 
                isOpen={isCountrySelectorOpen}
                onClose={() => setIsCountrySelectorOpen(false)}
                onSelect={handleCountrySelect}
                currentCode={depositCountryCode}
            />
        </PageLayout>
    );
};

export default DepositScreen;
