
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Wallet, TransactionType } from '../../types';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLiveData } from '../../context/LiveDataContext';
import { useWallet } from '../../context/WalletContext';
import { FingerprintIcon } from '../../components/icons/FingerprintIcon';
import { User, Scan, CheckCircle, XCircle, Clock } from 'lucide-react';
import { TransactionStatusModal, TransactionStatus } from '../../components/TransactionStatusModal';
import { assetIcons } from '../../components/icons/CryptoIcons';
import { QRScannerModal } from '../../components/QRScannerModal';
import { walletService } from '../../services';
import { SelectModal } from '../../components/SelectModal';
import { SelectField } from '../../components/SelectField';

const SendScreen: React.FC = () => {
    const location = useLocation();
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { isBiometricEnabled } = useAuth();
    const { addNotification, sendPushNotification } = useNotifications();
    const { wallets, updateWalletBalance, addTransaction } = useLiveData();
    const { addressBook } = useWallet();
    
    // Refs for inputs
    const amountInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<'crypto' | 'internal'>('crypto');

    // Unique assets list from real wallet data
    const uniqueAssets = useMemo(() => {
        const map = new Map();
        wallets.forEach(w => {
            if (!map.has(w.symbol)) map.set(w.symbol, { ...w });
        });
        return Array.from(map.values());
    }, [wallets]);

    const [selectedAsset, setSelectedAsset] = useState<Wallet>(() => {
        const assetSymbol = location.state?.assetSymbol;
        if (assetSymbol) {
            return uniqueAssets.find(w => w.symbol === assetSymbol) || uniqueAssets[0];
        }
        return uniqueAssets[0];
    });

    const totalBalance = useMemo(() => {
        return wallets.filter(w => w.symbol === selectedAsset.symbol).reduce((acc, curr) => acc + curr.balance, 0);
    }, [selectedAsset, wallets]);

    const [recipient, setRecipient] = useState(location.state?.address || '');
    const [amount, setAmount] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    
    // Internal Send ID Lookup State
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [foundUser, setFoundUser] = useState<{ name: string; avatar: string; id: string } | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

    const [statusModalState, setStatusModalState] = useState<{
        isOpen: boolean;
        status: TransactionStatus;
        details: any;
    }>({ isOpen: false, status: 'processing', details: {} });

    // Real user lookup via API
    useEffect(() => {
        if (activeTab === 'internal' && recipient.length > 4) {
            setIsLookingUp(true);
            const timer = setTimeout(async () => {
                try {
                    const response = await walletService.lookupRecipient(recipient);
                    if (response.success && response.data) {
                        setFoundUser({
                            name: response.data.name,
                            avatar: response.data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(response.data.name)}&background=random`,
                            id: response.data.id
                        });
                    } else {
                        setFoundUser(null);
                    }
                } catch {
                    setFoundUser(null);
                } finally {
                    setIsLookingUp(false);
                }
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setFoundUser(null);
            setIsLookingUp(false);
        }
    }, [recipient, activeTab]);

    // Network fee: 0 for internal transfers, standard fee for external
    const networkFee = activeTab === 'internal' ? 0 : 1.0;
    
    const handleSendMax = () => {
        setAmount(totalBalance.toString());
    };
    
    const handleConfirmSend = async () => {
        setIsConfirming(true);
        if (isBiometricEnabled) {
            await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setIsConfirming(false);
        
        setStatusModalState({
            isOpen: true,
            status: 'processing',
            details: {
                amount,
                asset: selectedAsset.symbol,
                address: recipient,
                type: 'send'
            }
        });

        // Use real API for internal transfers
        const executeTransfer = async () => {
            try {
                const response = await walletService.sendToUser({
                    asset: selectedAsset.symbol,
                    amount: parseFloat(amount),
                    recipient: foundUser?.id || recipient,
                    network: selectedAsset.network
                });

                if (response.success && response.data) {
                    updateWalletBalance(selectedAsset.symbol, -parseFloat(amount));
                    
                    addTransaction({
                        id: response.data.transactionId || `tx-${Date.now()}`,
                        type: TransactionType.TRANSFER,
                        asset: selectedAsset.symbol,
                        amount: -parseFloat(amount),
                        usdValue: -parseFloat(amount) * (selectedAsset.usdValue/selectedAsset.balance || 1),
                        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                        status: 'Completed',
                        toAddress: recipient,
                        networkFee: networkFee
                    });

                    setStatusModalState(prev => ({ 
                        ...prev, 
                        status: 'success',
                        details: { ...prev.details, transactionId: response.data.transactionId }
                    }));
                    const title = t('transaction_success_message');
                    const message = `Sent ${amount} ${selectedAsset.symbol} to ${recipient}.`;
                    sendPushNotification(title, { body: message });
                    addNotification({ icon: 'success', title: 'Transfer Successful', message });
                    
                    setRecipient('');
                    setAmount('');
                    setFoundUser(null);
                } else {
                    setStatusModalState(prev => ({ 
                        ...prev, 
                        status: 'failed',
                        details: { ...prev.details, error: response.error || 'Transfer failed' }
                    }));
                    addNotification({ icon: 'error', title: 'Transfer Failed', message: response.error || 'Unknown error' });
                }
            } catch (err) {
                setStatusModalState(prev => ({ 
                    ...prev, 
                    status: 'failed',
                    details: { ...prev.details, error: 'Network error' }
                }));
                addNotification({ icon: 'error', title: 'Transfer Failed', message: 'Network error occurred' });
            }
        };

        setTimeout(executeTransfer, 1500);
    };

    const handleScanResult = (data: string) => {
        setRecipient(data);
        addNotification({ icon: 'success', title: 'Scanned', message: 'Address scanned successfully.' });
        // Focus amount input after scan
        setTimeout(() => {
            amountInputRef.current?.focus();
        }, 300);
    };

    const isConfirmDisabled = isConfirming || !recipient || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > totalBalance || (activeTab === 'internal' && !foundUser && recipient.length > 4);
    const IconComponent = assetIcons[selectedAsset.symbol];

    const selectedAssetLabel = `${selectedAsset.name} (${selectedAsset.symbol})`;

    // Recent contacts from address book
    const recentContacts = addressBook.slice(0, 3).map(entry => ({
        id: entry.address,
        name: entry.label,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${entry.address}`
    }));

    return (
        <PageLayout title={t('send')} scrollable={false}>
            <div className="space-y-6 relative h-full flex flex-col">
                
                {/* Tabs */}
                <div className="bg-background-secondary p-1 rounded-xl border border-border-divider/30 flex shrink-0 mt-4 mx-4">
                    <button 
                        onClick={() => { setActiveTab('crypto'); setRecipient(''); setFoundUser(null); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'crypto' ? (primaryColor === 'brand-yellow' ? 'bg-primary-gold text-background-primary' : 'bg-primary-green text-background-primary') : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Crypto Address
                    </button>
                    <button 
                        onClick={() => { setActiveTab('internal'); setRecipient(''); setFoundUser(null); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'internal' ? (primaryColor === 'brand-yellow' ? 'bg-primary-gold text-background-primary' : 'bg-primary-green text-background-primary') : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Email / ID
                    </button>
                </div>

                <div className="flex-grow space-y-6 overflow-y-auto pb-20 px-4">
                    {/* Recipient Input */}
                    <div>
                        <label htmlFor="recipient" className="text-sm font-medium text-text-secondary ms-1 block mb-2">
                            {activeTab === 'crypto' ? t('to_address') : 'Recipient Email, Phone or ID'}
                        </label>
                         <div className="relative">
                            <input
                                id="recipient"
                                type="text"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                placeholder={activeTab === 'crypto' ? 'Long press to paste or Scan' : 'Enter User ID / Email'}
                                className={`w-full bg-background-secondary border rounded-xl p-4 ltr:pl-4 ltr:pr-12 rtl:pl-12 rtl:pr-4 focus:ring-2 focus:outline-none transition-colors ${foundUser ? 'border-success ring-1 ring-success' : 'border-border-divider'}`}
                                style={!foundUser ? {'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties : {}}
                                autoCorrect="off"
                                autoComplete="off"
                                autoCapitalize="none"
                            />
                            <div className="absolute ltr:right-2 rtl:left-2 top-1/2 -translate-y-1/2 flex gap-1">
                                {activeTab === 'crypto' && (
                                    <button 
                                        onClick={() => setIsScannerOpen(true)}
                                        className="p-2 hover:bg-background-tertiary rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        <Scan className="w-5 h-5" />
                                    </button>
                                )}
                                {activeTab === 'internal' && <div className="p-2 text-text-secondary"><User className="w-5 h-5" /></div>}
                            </div>
                        </div>

                        {/* User Lookup Feedback */}
                        {activeTab === 'internal' && recipient.length > 4 && (
                            <div className="mt-2 ms-1 min-h-[20px] animate-fadeInDown">
                                {isLookingUp ? (
                                    <p className="text-xs text-text-secondary flex items-center gap-2"><span className="w-2 h-2 bg-brand-yellow rounded-full animate-ping"></span> Searching user...</p>
                                ) : foundUser ? (
                                    <div className="flex items-center gap-2 text-success bg-success/10 p-2 rounded-lg pe-4 border border-success/20">
                                        <img src={foundUser.avatar} className="w-6 h-6 rounded-full" alt="" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold leading-none">{foundUser.name}</span>
                                            <span className="text-[10px] opacity-80">ID: {foundUser.id}</span>
                                        </div>
                                        <CheckCircle className="w-4 h-4 ms-2" />
                                    </div>
                                ) : (
                                    <p className="text-xs text-error flex items-center gap-1"><XCircle className="w-3 h-3"/> User not found</p>
                                )}
                            </div>
                        )}

                         {/* Recent Contacts for Internal */}
                        {activeTab === 'internal' && !recipient && (
                            <div className="mt-4 animate-fadeInUp">
                                <p className="text-xs text-text-secondary font-bold mb-3 ms-1 uppercase tracking-wide flex items-center gap-1"><Clock className="w-3 h-3"/> Recent</p>
                                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                    {recentContacts.map(contact => (
                                        <button 
                                            key={contact.id} 
                                            onClick={() => setRecipient(contact.id)}
                                            className="flex flex-col items-center gap-2 min-w-[70px] p-2 rounded-xl hover:bg-background-secondary transition-colors"
                                        >
                                            <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full border-2 border-background-tertiary" />
                                            <span className="text-[10px] font-medium text-text-primary text-center truncate w-full">{contact.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Asset Selection */}
                    <div>
                        <label className="text-sm font-medium text-text-secondary mb-2 block ms-1">{t('select_asset')}</label>
                        <div className="relative">
                            <SelectField
                                valueLabel={selectedAssetLabel}
                                onClick={() => setIsAssetModalOpen(true)}
                                leftIcon={IconComponent ? <IconComponent className="w-6 h-6" /> : undefined}
                                style={{ '--tw-ring-color': `var(--tw-color-${primaryColor})` } as React.CSSProperties}
                            />
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <div className="flex justify-between items-center mb-2 ms-1">
                            <label htmlFor="amount" className="text-sm font-medium text-text-secondary">{t('amount')}</label>
                            <span className="text-xs text-text-secondary">{t('balance')}: <span className="text-text-primary font-bold">{totalBalance.toLocaleString()}</span></span>
                        </div>
                         <div className="relative bg-background-secondary border border-border-divider rounded-xl p-4 flex items-center focus-within:border-brand-yellow transition-colors">
                            <input
                                id="amount"
                                ref={amountInputRef}
                                type="text"
                                inputMode="decimal"
                                value={amount}
                                onChange={(e) => {
                                    // Allow only valid decimal numbers
                                    const val = e.target.value;
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                        setAmount(val);
                                    }
                                }}
                                placeholder="0.00"
                                className="w-full bg-transparent text-2xl font-bold focus:outline-none ltr:text-left rtl:text-right placeholder-text-secondary/50"
                                dir="ltr"
                            />
                            <div className="flex items-center gap-2 ltr:ml-4 rtl:mr-4 shrink-0">
                                 <span className="font-bold text-text-primary">{selectedAsset.symbol}</span>
                                 <div className="w-px h-5 bg-border-divider mx-1"></div>
                                 <button 
                                    type="button"
                                    onClick={handleSendMax}
                                    className={`text-xs font-bold uppercase px-2 py-1 rounded ${primaryColor === 'brand-yellow' ? 'bg-primary-gold-10 text-primary-gold hover:bg-primary-gold-20' : 'bg-primary-green-10 text-primary-green hover:bg-primary-green-20'} transition-colors`}
                                >
                                    Max
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Summary Section */}
                     <div className="bg-background-secondary rounded-xl p-4 space-y-2 text-sm border border-border-divider/50">
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary">{t('network_fee')}</span>
                            <span className={`font-medium ${activeTab === 'internal' ? 'text-success' : 'text-text-primary'}`}>
                                {activeTab === 'internal' ? 'Free (Internal)' : `${networkFee} ${selectedAsset.symbol}`}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-border-divider pt-2 mt-2">
                            <span className="text-text-secondary">{t('total_transaction_volume')}</span>
                            <span className="text-lg font-bold text-text-primary font-mono">{(parseFloat(amount) || 0 + networkFee).toFixed(4)} {selectedAsset.symbol}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Action */}
                <div className="sticky bottom-0 pt-4 pb-6 bg-background-primary z-10 mt-auto border-t border-border-divider/50 px-4">
                    <button 
                        onClick={handleConfirmSend}
                        disabled={isConfirmDisabled}
                        className={`w-full p-4 rounded-xl text-lg font-bold text-background-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] hover:brightness-110 ${primaryColor === 'brand-yellow' ? 'bg-brand-yellow' : 'bg-brand-green'}`}
                    >
                        {isConfirming ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-background-primary"></div>
                                <span>{t('verifying')}</span>
                            </>
                        ) : (
                            <>
                                {isBiometricEnabled && <FingerprintIcon className="w-6 h-6" />}
                                <span>{t('confirm_send')}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
             <TransactionStatusModal
                isOpen={statusModalState.isOpen}
                status={statusModalState.status}
                details={statusModalState.details}
                onClose={() => setStatusModalState(prev => ({ ...prev, isOpen: false }))}
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
                        label: `${wallet.name} (${wallet.symbol})`,
                        icon: Ico ? <Ico className="w-8 h-8" /> : undefined,
                    };
                })}
                onChange={(symbol) => setSelectedAsset(uniqueAssets.find(w => w.symbol === symbol) || uniqueAssets[0])}
            />
        </PageLayout>
    );
};

export default SendScreen;
