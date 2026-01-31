
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wallet, AddressBookEntry, TransactionType } from '../../types';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLiveData } from '../../context/LiveDataContext';
import { WithdrawConfirmationModal } from '../../components/WithdrawConfirmationModal';
import { TransactionStatusModal, TransactionStatus } from '../../components/TransactionStatusModal';
import { AddressBookSelectModal } from '../../components/AddressBookSelectModal';
import { QRScannerModal } from '../../components/QRScannerModal';
import { Scan, ChevronRight, BookUser, AlertCircle, Network, XCircle, CheckCircle2, Shield } from 'lucide-react';
import { assetIcons } from '../../components/icons/CryptoIcons';
import { Modal } from '../../components/Modal';
import { walletService } from '../../services';
import { SelectField } from '../../components/SelectField';
import { SelectModal } from '../../components/SelectModal';

const getNetworkFee = (symbol: string, network: string) => {
    if (symbol === 'BTC') return 0.0004;
    if (symbol === 'ETH') return 0.002;
    if (network === 'ERC20') return 4.5; 
    if (network === 'TRC20') return 1.0;
    if (network === 'BEP20') return 0.29;
    if (network === 'SOL') return 0.1;
    return 1.0; 
};

// Enhanced Regex Patterns for World-Class Validation
const validateAddress = (address: string, network: string): string | null => {
    if (!address) return null;

    const trc20Regex = /^T[a-zA-Z0-9]{33}$/;
    const evmRegex = /^0x[a-fA-F0-9]{40}$/; 
    const btcRegex = /^(1|3)[a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-zA-Z0-9]{25,90}$/;
    const solRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

    switch (network) {
        case 'TRC20':
            if (!trc20Regex.test(address)) return 'Invalid TRC20 address. Starts with "T", 34 chars.';
            break;
        case 'ERC20':
        case 'BEP20':
        case 'Arbitrum One':
        case 'POLYGON':
            if (!evmRegex.test(address)) return 'Invalid EVM address. Starts with "0x", 42 chars.';
            break;
        case 'SOL':
        case 'SPL':
            if (!solRegex.test(address)) return 'Invalid Solana address (Base58).';
            break;
        case 'Bitcoin':
        case 'BTC':
            if (!btcRegex.test(address)) return 'Invalid Bitcoin address.';
            break;
    }
    return null;
};

const WithdrawScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { addNotification, sendPushNotification } = useNotifications();
    const { wallets, updateWalletBalance, addTransaction } = useLiveData();
    const location = useLocation();
    const navigate = useNavigate();

    // Check whitelist setting
    const isWhitelistEnabled = localStorage.getItem('withdrawal_whitelist_enabled') === 'true';

    const uniqueAssets = useMemo(() => {
        const map = new Map();
        wallets.forEach(w => {
            if (!map.has(w.symbol)) map.set(w.symbol, { ...w });
        });
        return Array.from(map.values());
    }, [wallets]);

    const [selectedAsset, setSelectedAsset] = useState<Wallet | undefined>(() => {
        const assetSymbol = location.state?.assetSymbol;
        if (assetSymbol) {
            return uniqueAssets.find(w => w.symbol === assetSymbol) || uniqueAssets[0];
        }
        const assetId = location.state?.assetId;
        if (assetId) {
            const found = wallets.find(w => w.id === assetId);
            return found ? (uniqueAssets.find(u => u.symbol === found.symbol) || uniqueAssets[0]) : uniqueAssets[0];
        }
        return uniqueAssets[0];
    });

    useEffect(() => {
        if (!selectedAsset && uniqueAssets.length > 0) {
             const assetSymbol = location.state?.assetSymbol;
             if (assetSymbol) {
                 const found = uniqueAssets.find(w => w.symbol === assetSymbol);
                 setSelectedAsset(found || uniqueAssets[0]);
             } else {
                 setSelectedAsset(uniqueAssets[0]);
             }
        }
    }, [uniqueAssets, selectedAsset, location.state]);
    
    const totalBalance = useMemo(() => {
        if (!selectedAsset) return 0;
        return wallets.filter(w => w.symbol === selectedAsset.symbol).reduce((acc, curr) => acc + curr.balance, 0);
    }, [selectedAsset, wallets]);
    
    const [address, setAddress] = useState('');
    const [amount, setAmount] = useState('');
    
    // UX: Touched states
    const [touched, setTouched] = useState({ address: false, amount: false });
    const [shakeError, setShakeError] = useState(false);
    
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'crypto' | 'email'>('crypto');

    const [statusModalState, setStatusModalState] = useState<{
        isOpen: boolean;
        status: TransactionStatus;
        details: any;
    }>({ isOpen: false, status: 'processing', details: {} });

    const networks = useMemo(() => {
        if (!selectedAsset) return [];
        if (selectedAsset.symbol === 'USDT') return ['TRC20', 'ERC20', 'BEP20', 'SOL'];
        if ((selectedAsset.symbol as string) === 'ETH') return ['ERC20', 'BEP20', 'Arbitrum One'];
        if ((selectedAsset.symbol as string) === 'BTC') return ['Bitcoin', 'BEP20'];
        return [selectedAsset.network];
    }, [selectedAsset]);

    const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
    const [isNetworkModalOpen, setNetworkModalOpen] = useState(false);
    const [isAddressBookOpen, setAddressBookOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

    useEffect(() => {
        setSelectedNetwork(networks[0]);
    }, [selectedAsset, networks]);

    const addressError = useMemo(() => {
        if (!address) return activeTab === 'crypto' ? 'Address is required' : 'Email is required';
        if (activeTab === 'crypto') return validateAddress(address, selectedNetwork);
        return null;
    }, [address, selectedNetwork, activeTab]);

    const amountError = useMemo(() => {
        if (!amount) return 'Amount is required';
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return 'Invalid amount';
        if (val > totalBalance) return 'Insufficient balance';
        return null;
    }, [amount, totalBalance]);

    const isValid = !addressError && !amountError;

    const networkFee = useMemo(() => {
        if (!selectedAsset || !selectedNetwork) return 0;
        return getNetworkFee(selectedAsset.symbol, selectedNetwork);
    }, [selectedAsset, selectedNetwork]);

    const receivedAmount = useMemo(() => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) return 0;
        return Math.max(0, numericAmount - networkFee);
    }, [amount, networkFee]);

    const handleInitiateWithdrawal = () => {
        setTouched({ address: true, amount: true });
        if (!isValid) {
            setShakeError(true);
            setTimeout(() => setShakeError(false), 500); // Reset animation
            return;
        }
        setConfirmModalOpen(true);
    };

    const executeWithdrawal = async () => {
        const asset = selectedAsset;
        if (!asset) return;

        setConfirmModalOpen(false);
        setStatusModalState({
            isOpen: true,
            status: 'processing',
            details: { amount, asset: asset.symbol, address, type: 'withdraw' }
        });

        try {
            const response = await walletService.withdraw({
                asset: asset.symbol,
                network: selectedNetwork,
                address: address,
                amount: parseFloat(amount)
            });

            if (response.success && response.data) {
                updateWalletBalance(asset.symbol, -parseFloat(amount));
                
                addTransaction({
                    id: response.data.transactionId || `tx-${Date.now()}`,
                    type: TransactionType.WITHDRAW,
                    asset: asset.symbol,
                    amount: -parseFloat(amount),
                    usdValue: -parseFloat(amount),
                    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                    status: 'Pending',
                    toAddress: address,
                    networkFee: networkFee
                });

                setStatusModalState(prev => ({ 
                    ...prev, 
                    status: 'success',
                    details: { ...prev.details, transactionId: response.data.transactionId }
                }));
                const title = 'Withdrawal Submitted';
                const message = `Your withdrawal of ${amount} ${asset.symbol} via ${selectedNetwork} has been submitted.`;
                sendPushNotification(title, { body: message });
                addNotification({ icon: 'success', title, message });
                setAddress('');
                setAmount('');
                setTouched({ address: false, amount: false });
            } else {
                setStatusModalState(prev => ({ 
                    ...prev, 
                    status: 'failed',
                    details: { ...prev.details, error: response.error || 'Withdrawal failed' }
                }));
                addNotification({ icon: 'error', title: 'Withdrawal Failed', message: response.error || 'Unknown error' });
            }
        } catch (err) {
            setStatusModalState(prev => ({ 
                ...prev, 
                status: 'failed',
                details: { ...prev.details, error: 'Network error' }
            }));
            addNotification({ icon: 'error', title: 'Withdrawal Failed', message: 'Network error occurred' });
        }
    };

    const handleAddressSelect = (entry: AddressBookEntry) => {
        setAddress(entry.address);
        if (networks.includes(entry.network)) {
            setSelectedNetwork(entry.network);
        }
        setAddressBookOpen(false);
        setTouched(prev => ({ ...prev, address: true }));
    };

    const handleScanResult = (data: string) => {
        if (isWhitelistEnabled) {
            addNotification({ icon: 'error', title: 'Restricted', message: 'Whitelist Mode is enabled. Select from address book.' });
            return;
        }
        setAddress(data);
        setTouched(prev => ({ ...prev, address: true }));
        addNotification({ icon: 'success', title: 'Scanned', message: 'Address scanned successfully.' });
    };

    const IconComponent = selectedAsset ? assetIcons[selectedAsset.symbol] : null;
    const selectedAssetLabel = selectedAsset ? `${selectedAsset.symbol} - ${selectedAsset.name}` : '';

    if (!selectedAsset) {
        return (
            <PageLayout title={t('withdraw')} scrollable={false}>
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow"></div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title={t('withdraw')} scrollable={false}>
            <div className="flex flex-col h-full relative">
                <div className="flex-grow overflow-y-auto overflow-x-hidden px-4 pb-6 space-y-5 pt-4">
                    {/* Asset Selector */}
                    <div className="space-y-1.5">
                         <label className="text-xs text-text-secondary ms-1 font-medium">{t('select_asset')}</label>
                        <div className="relative">
                            <SelectField
                                valueLabel={selectedAssetLabel}
                                onClick={() => setIsAssetModalOpen(true)}
                                leftIcon={IconComponent ? <IconComponent className="w-7 h-7" /> : undefined}
                                className="w-full bg-background-secondary border border-border-divider rounded-xl p-3.5 ltr:pl-14 ltr:pr-10 rtl:pr-14 rtl:pl-10 font-bold text-text-primary focus:outline-none focus:border-brand-yellow transition-colors text-base"
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-background-secondary p-1.5 rounded-xl border border-border-divider/30">
                        <button 
                            onClick={() => { setActiveTab('crypto'); setTouched({ address: false, amount: false }); }} 
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'crypto' ? 'bg-gradient-to-b from-background-tertiary to-background-secondary text-text-primary border border-border-divider/50' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            {t('send_via_crypto')}
                        </button>
                        <button 
                            onClick={() => { setActiveTab('email'); setTouched({ address: false, amount: false }); }} 
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'email' ? 'bg-gradient-to-b from-background-tertiary to-background-secondary text-text-primary border border-border-divider/50' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            {t('send_via_email')}
                        </button>
                    </div>

                    {activeTab === 'crypto' ? (
                        <div className="space-y-5 animate-fadeInDown">
                            {/* Whitelist Banner */}
                            {isWhitelistEnabled && (
                                <div className="bg-background-tertiary p-3 rounded-xl border border-brand-yellow/30 flex items-center gap-3">
                                    <div className="p-2 bg-brand-yellow/10 rounded-full text-brand-yellow">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-text-primary">Whitelist Mode Enabled</p>
                                        <p className="text-[10px] text-text-secondary">You can only withdraw to saved addresses.</p>
                                    </div>
                                </div>
                            )}

                            {/* Address Input */}
                            <div className={`space-y-1.5 ${shakeError && addressError ? 'animate-shake' : ''}`}>
                                <label className="text-xs text-text-secondary ms-1 font-medium">{t('address')}</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        onBlur={() => setTouched(prev => ({ ...prev, address: true }))}
                                        placeholder={isWhitelistEnabled ? "Select from Address Book" : t('enter_asset_address_placeholder', { asset: selectedAsset.symbol })}
                                        disabled={isWhitelistEnabled} // Disable typing if whitelist is on
                                        className={`w-full bg-background-secondary border rounded-xl py-4 px-4 ltr:pr-24 rtl:pl-24 rtl:text-right ltr:text-left focus:outline-none transition-all font-mono text-sm placeholder:font-sans
                                            ${isWhitelistEnabled ? 'opacity-60 cursor-not-allowed bg-background-tertiary' : ''}
                                            ${touched.address && addressError 
                                                ? 'border-error focus:border-error text-error bg-error/5 ring-1 ring-error/20' 
                                                : touched.address && !addressError 
                                                    ? 'border-success/50 focus:border-success' 
                                                    : 'border-border-divider focus:border-brand-yellow'}
                                        `}
                                    />
                                    
                                    {touched.address && !addressError && address.length > 10 && (
                                        <div className="absolute ltr:right-24 rtl:left-24 top-1/2 -translate-y-1/2 pointer-events-none animate-fadeIn">
                                            <CheckCircle2 className="w-5 h-5 text-success" />
                                        </div>
                                    )}

                                    <div className="absolute ltr:right-2 rtl:left-2 top-1/2 -translate-y-1/2 flex gap-1">
                                        {!isWhitelistEnabled && (
                                            <button 
                                                onClick={() => setIsScannerOpen(true)}
                                                className="p-2 hover:bg-background-tertiary rounded-lg transition-colors text-text-secondary hover:text-text-primary" 
                                                title="Scan QR"
                                            >
                                                <Scan className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setAddressBookOpen(true)}
                                            className={`p-2 rounded-lg transition-colors ${isWhitelistEnabled ? 'bg-brand-yellow text-background-primary hover:brightness-110' : 'hover:bg-background-tertiary text-text-secondary hover:text-text-primary'}`} 
                                            title="Address Book"
                                        >
                                            <BookUser className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                {touched.address && addressError && (
                                    <div className="flex items-center gap-1.5 text-xs text-error mt-1.5 ms-1 animate-fadeIn font-medium">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>{addressError}</span>
                                    </div>
                                )}
                            </div>

                            {/* Network Selection */}
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
                                            {t('arrival_time')} ≈ 2 mins
                                        </span>
                                        <span className="text-[10px] font-bold text-brand-yellow bg-brand-yellow/10 px-1.5 py-0.5 rounded border border-brand-yellow/20">
                                            Fee: {networkFee} {selectedAsset.symbol}
                                        </span>
                                    </div>
                                </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-text-secondary rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                                 </button>
                            </div>

                            {/* Amount Input */}
                            <div className={`space-y-1.5 ${shakeError && amountError ? 'animate-shake' : ''}`}>
                                <div className="flex justify-between text-xs ms-1 mb-1 font-medium">
                                    <span className="text-text-secondary">{t('amount')}</span>
                                    <span className="text-text-secondary">{t('available')}: <span className="text-text-primary font-bold">{totalBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedAsset.symbol}</span></span> 
                                </div>
                                <div className={`relative bg-background-secondary border rounded-xl p-4 flex items-center transition-all duration-200
                                    ${touched.amount && amountError ? 'border-error bg-error/5 ring-1 ring-error/20' : 'border-border-divider focus-within:border-brand-yellow'}`}>
                                    
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        onBlur={() => setTouched(prev => ({ ...prev, amount: true }))}
                                        placeholder="Min 10.00"
                                        className={`w-full bg-transparent font-bold text-xl focus:outline-none rtl:text-right ltr:text-left font-mono
                                            ${touched.amount && amountError ? 'text-error placeholder-error/50' : 'text-text-primary placeholder-text-secondary/30'}
                                        `}
                                        dir="ltr"
                                    />
                                    
                                    {touched.amount && amountError && (
                                        <XCircle className="w-5 h-5 text-error shrink-0 mr-2" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Withdraw Button */}
                    <button 
                        onClick={handleInitiateWithdrawal}
                        disabled={!isValid}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98] ${isValid ? 'bg-brand-yellow text-background-primary hover:brightness-110 shadow-lg shadow-brand-yellow/20' : 'bg-background-tertiary text-text-secondary cursor-not-allowed'}`}
                    >
                        {t('withdraw')}
                    </button>
                </div>
            </div>

            <AddressBookSelectModal 
                isOpen={isAddressBookOpen} 
                onClose={() => setAddressBookOpen(false)} 
                onSelect={handleAddressSelect}
                assetSymbol={selectedAsset.symbol}
            />
            
            <QRScannerModal 
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScanResult}
            />

            <SelectModal
                isOpen={isAssetModalOpen}
                onClose={() => setIsAssetModalOpen(false)}
                title={t('select_asset')}
                value={selectedAsset.symbol}
                searchable
                searchPlaceholder={t('search_asset')}
                options={uniqueAssets.map((wallet) => {
                    const Ico = assetIcons[wallet.symbol];
                    return {
                        value: wallet.symbol,
                        label: `${wallet.symbol} - ${wallet.name}`,
                        description: wallet.network,
                        icon: Ico ? <Ico className="w-8 h-8" /> : undefined,
                    };
                })}
                onChange={(symbol) => setSelectedAsset(uniqueAssets.find(w => w.symbol === symbol) || uniqueAssets[0])}
            />
        </PageLayout>
    );
};

export default WithdrawScreen;
