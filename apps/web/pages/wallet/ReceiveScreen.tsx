
import React, { useState, useMemo, useEffect } from 'react';
import { Wallet } from '../../types';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLiveData } from '../../context/LiveDataContext';
import { CopyIcon } from '../../components/icons/CopyIcon';
import { QrCode, User, Share2, Fingerprint, ScanLine, Mail, Download, Check } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { assetIcons } from '../../components/icons/CryptoIcons';
import { SelectField } from '../../components/SelectField';
import { SelectModal } from '../../components/SelectModal';

const ReceiveScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'crypto' | 'id'>('crypto');
    const { wallets } = useLiveData();
    const [selectedAsset, setSelectedAsset] = useState<Wallet | null>(null);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { user } = useAuth();
    const { addNotification } = useNotifications();

    // Initialize selectedAsset from real wallet data
    useEffect(() => {
        if (wallets.length > 0 && !selectedAsset) {
            setSelectedAsset(wallets[0]);
        }
    }, [wallets, selectedAsset]);

    const uniqueAssets = useMemo(() => {
        const map = new Map();
        wallets.forEach(w => {
            if (!map.has(w.symbol)) map.set(w.symbol, { ...w });
        });
        return Array.from(map.values());
    }, [wallets]);

    const walletAddress = selectedAsset?.address || t('no_address_found');
    const userId = user?.id || 'ID-82739102';
    const userEmail = user?.email || 'user@usdt-wallet.app';

    // Dynamic QR Code
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(walletAddress)}&color=000000&bgcolor=ffffff&margin=2`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        addNotification({ icon: 'success', title: t('copied'), message: t('address_copied') });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        const shareData = {
            title: t('receive'),
            text: `My ${selectedAsset?.symbol} (${selectedAsset?.network}) Address:\n${walletAddress}`,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch {
                // Share dismissed
            }
        } else {
            handleCopy(walletAddress);
        }
    };

    const handleSaveImage = async () => {
        // Save QR Code as image using canvas
        const qrElement = document.querySelector('#qr-code-canvas canvas') as HTMLCanvasElement;
        if (!qrElement) {
            addNotification({ icon: 'error', title: t('error'), message: 'QR Code not found' });
            return;
        }
        
        try {
            const dataUrl = qrElement.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${selectedAsset?.symbol || 'crypto'}-address-qr.png`;
            link.href = dataUrl;
            link.click();
            addNotification({ icon: 'success', title: t('success'), message: 'QR Code saved successfully.' });
        } catch {
            addNotification({ icon: 'error', title: t('error'), message: 'Failed to save QR Code' });
        }
    };

    const IconComponent = selectedAsset ? assetIcons[selectedAsset.symbol] : null;
    const selectedAssetLabel = selectedAsset ? `${selectedAsset.name} (${selectedAsset.symbol})` : '';

    return (
        <PageLayout title={t('receive')}>
             <div className="flex flex-col h-full space-y-6">
                
                {/* Tabs */}
                <div className="bg-background-secondary p-1 rounded-xl border border-border-divider/30 flex">
                    <button 
                        onClick={() => setActiveTab('crypto')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'crypto' ? (primaryColor === 'brand-yellow' ? 'bg-primary-gold text-background-primary shadow-md' : 'bg-primary-green text-background-primary shadow-md') : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Crypto Address
                    </button>
                    <button 
                        onClick={() => setActiveTab('id')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'id' ? (primaryColor === 'brand-yellow' ? 'bg-primary-gold text-background-primary shadow-md' : 'bg-primary-green text-background-primary shadow-md') : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Pay ID / Email
                    </button>
                </div>

                {activeTab === 'crypto' ? (
                    <div className="space-y-6 animate-fadeInDown">
                        <div>
                            <label className="text-sm font-medium text-text-secondary">{t('select_asset')}</label>
                            <div className="mt-1">
                                <SelectField
                                    valueLabel={selectedAssetLabel}
                                    onClick={() => setIsAssetModalOpen(true)}
                                    leftIcon={IconComponent ? <IconComponent className="w-6 h-6" /> : undefined}
                                    className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 ltr:pl-12 ltr:pr-10 rtl:pr-12 rtl:pl-10 focus:ring-2 focus:outline-none font-bold text-text-primary"
                                    style={{ '--tw-ring-color': `var(--tw-color-${primaryColor})` } as React.CSSProperties}
                                />
                            </div>
                        </div>

                        <div className="text-center bg-background-secondary p-6 rounded-xl border border-border-divider space-y-4 shadow-sm">
                            <p className="text-sm text-text-secondary">{t('network')}: <span className="font-bold text-text-primary bg-background-tertiary px-2 py-1 rounded">{selectedAsset?.network}</span></p>
                            
                            {/* Dynamic QR Code Area */}
                            <div className="relative group inline-block">
                                <div className="bg-white p-3 rounded-xl shadow-inner relative overflow-hidden">
                                    <img 
                                        src={qrCodeUrl} 
                                        alt="QR Code" 
                                        className="w-48 h-48 object-contain mix-blend-multiply" 
                                        loading="eager"
                                    />
                                    {/* Logo Overlay */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 shadow-md border border-gray-100">
                                         {IconComponent && <IconComponent className="w-full h-full" />}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full">
                                <p className="text-sm text-text-secondary mb-2 text-start ms-1">{t('deposit_address')}</p>
                                <div className="flex items-center gap-2 bg-background-tertiary p-3 rounded-lg border border-border-divider/50 relative overflow-hidden group hover:border-brand-yellow/30 transition-colors">
                                    <p className="font-mono text-sm break-all text-text-primary flex-grow select-all text-start">{walletAddress}</p>
                                    <button 
                                        onClick={() => handleCopy(walletAddress)} 
                                        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${copied ? 'text-success bg-success/10' : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'}`}
                                        aria-label={t('copy')}
                                    >
                                        {copied ? <Check className="w-5 h-5 animate-pulse" /> : <CopyIcon className="w-5 h-5"/>}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={handleSaveImage}
                                    className="p-3 bg-background-tertiary rounded-lg text-text-secondary hover:text-text-primary hover:bg-border-divider transition-colors flex items-center justify-center gap-2 font-semibold text-xs"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>{t('save_image')}</span>
                                </button>
                                <button 
                                    onClick={handleShare}
                                    className={`p-3 rounded-lg text-background-primary font-bold transition-colors flex items-center justify-center gap-2 text-xs ${primaryColor === 'brand-yellow' ? 'bg-primary-gold hover:brightness-110 shadow-lg shadow-primary-gold/20' : 'bg-primary-green hover:brightness-110 shadow-lg shadow-primary-green/20'}`}
                                >
                                    <Share2 className="w-4 h-4" />
                                    <span>{t('share_address')}</span>
                                </button>
                            </div>
                        </div>
                        
                        <div className="bg-brand-yellow/10 text-brand-yellow text-sm p-3 rounded-lg text-center border border-brand-yellow/20 flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-pulse"></span>
                            {t('min_deposit_warning')}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fadeInDown h-full flex flex-col pb-10">
                        <div className="flex-grow flex flex-col items-center text-center space-y-6 bg-gradient-to-b from-background-secondary to-background-tertiary/20 rounded-2xl border border-border-divider p-6 shadow-lg relative overflow-hidden">
                            {/* Decorative bg elements */}
                            <div className={`absolute top-0 right-0 w-32 h-32 ${primaryColor === 'brand-yellow' ? 'bg-primary-gold-10' : 'bg-primary-green-10'} rounded-full blur-3xl -mr-10 -mt-10`}></div>
                            
                            <div className="relative z-10 flex flex-col items-center w-full">
                                <div className={`w-24 h-24 rounded-full bg-background-tertiary p-1.5 ring-2 ${primaryColor === 'brand-yellow' ? 'ring-primary-gold/50' : 'ring-primary-green/50'} mb-4`}>
                                     <div className="w-full h-full rounded-full bg-background-secondary flex items-center justify-center overflow-hidden">
                                        {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="Profile" /> : <User className={`${primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green'} w-10 h-10`} />}
                                     </div>
                                </div>
                                
                                <h2 className="text-2xl font-bold text-text-primary mb-1">{user?.name || 'Anonymous'}</h2>
                                <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
                                    <span className="bg-success/10 text-success px-2 py-0.5 rounded text-xs font-bold border border-success/20">Verified</span>
                                    <span>|</span>
                                    <span>Level 2</span>
                                </div>

                                <div className="w-full space-y-3">
                                    <div className="bg-background-primary/80 backdrop-blur-sm p-4 rounded-xl flex justify-between items-center border border-border-divider/50 hover:border-brand-yellow/30 transition-colors group">
                                        <div className="flex items-center gap-3 text-start">
                                            <div className="p-2 rounded-full bg-background-tertiary text-text-secondary group-hover:text-text-primary transition-colors">
                                                <ScanLine className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">My Pay ID</p>
                                                <p className="text-lg font-bold font-mono text-text-primary tracking-wider">{userId}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleCopy(userId)} className={`text-text-secondary ${primaryColor === 'brand-yellow' ? 'hover:text-primary-gold' : 'hover:text-primary-green'} p-2 hover:bg-background-tertiary rounded-lg transition-colors`}>
                                            <CopyIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="bg-background-primary/80 backdrop-blur-sm p-4 rounded-xl flex justify-between items-center border border-border-divider/50 hover:border-brand-yellow/30 transition-colors group">
                                         <div className="flex items-center gap-3 text-start">
                                            <div className="p-2 rounded-full bg-background-tertiary text-text-secondary group-hover:text-text-primary transition-colors">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Email</p>
                                                <p className="text-base font-bold text-text-primary truncate max-w-[180px]">{userEmail}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleCopy(userEmail)} className={`text-text-secondary ${primaryColor === 'brand-yellow' ? 'hover:text-primary-gold' : 'hover:text-primary-green'} p-2 hover:bg-background-tertiary rounded-lg transition-colors`}>
                                            <CopyIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="mt-8 bg-white p-3 rounded-xl shadow-inner">
                                    <QrCode className="w-32 h-32 text-black" />
                                </div>
                                <p className="text-xs text-text-secondary mt-2">Scan to pay instantly</p>
                            </div>
                        </div>
                        
                        <div className="text-center flex justify-center">
                             <div className="bg-success/10 text-success text-xs px-4 py-2 rounded-full flex items-center gap-2 border border-success/20">
                                <Fingerprint className="w-3 h-3" />
                                Zero Fees on Internal Transfers
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <SelectModal
                isOpen={isAssetModalOpen}
                onClose={() => setIsAssetModalOpen(false)}
                title={t('select_asset')}
                value={selectedAsset?.id || ''}
                searchable
                searchPlaceholder={t('search_asset')}
                accentColorClassName={primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'}
                options={uniqueAssets.map((wallet) => {
                    const Ico = assetIcons[wallet.symbol];
                    return {
                        value: wallet.id,
                        label: `${wallet.name} (${wallet.symbol})`,
                        description: wallet.network,
                        icon: Ico ? <Ico className="w-8 h-8" /> : undefined,
                    };
                })}
                onChange={(id) => setSelectedAsset(uniqueAssets.find(w => w.id === id) || null)}
            />
        </PageLayout>
    );
};

export default ReceiveScreen;
