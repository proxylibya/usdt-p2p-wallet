
import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, P2POffer, PaymentMethod, KYCStatus } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useLiveData } from '../context/LiveDataContext';
import { useNotifications } from '../context/NotificationContext';
import { useAppSettings } from '../context/SettingsContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import { TransactionList } from '../components/TransactionList';
import { BellIcon } from '../components/icons/BellIcon';
import ProfileDropdown from '../components/ProfileDropdown';
import { ShieldCheck, Zap, Globe, ArrowRight, Wallet as WalletIcon, Users, ScanLine, Search, Headset, Check, LogIn, UserCircle, Banknote, Repeat, ArrowRightLeft, Smartphone, CreditCard, ArrowDownToLine, ArrowUpFromLine, MoreHorizontal, Coins, RefreshCw, HandCoins, History, LockOpen, Layers, Gift, Send, LayoutGrid, ChevronRight, ChevronLeft, Activity, Shield, CheckCircle2, Lock, ArrowLeftRight } from 'lucide-react';
import { P2PIcon } from '../components/icons/P2PIcon';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { Flag } from '../components/Flag';
import { COUNTRIES } from '../constants/countries';
import { ALL_PAYMENT_METHODS } from '../constants';
import { KYCBadge } from '../components/KYCBadge';
import { Modal } from '../components/Modal';
import { QRScannerModal } from '../components/QRScannerModal';
import { OnboardingFlow } from '../components/OnboardingFlow';
import { ParallelMarketWidget } from '../components/ParallelMarketWidget';
import { LiteDashboard } from '../components/LiteDashboard';
import { UsdtIcon, UsdcIcon, BusdIcon, DaiIcon } from '../components/icons/CryptoIcons';

const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'tr', name: 'Turkish', native: 'Türkçe' },
];

const LANG_FLAGS: Record<string, string> = {
    en: 'US',
    ar: 'SA',
    fr: 'FR',
    es: 'ES',
    tr: 'TR',
};

// Redesigned MethodCard - Binance Style P2P Pill
const MethodCard: React.FC<{ method: PaymentMethod }> = ({ method }) => {
    const { t } = useLanguage();
    
    // Get translated name first
    const translatedName = t(method.key as any);
    
    // Always take the first letter of the English key for the icon to keep it consistent and clean
    const shortChar = method.label.charAt(0).toUpperCase();
    
    return (
        <div className="flex items-center gap-2 pl-1 pr-3 py-1.5 bg-background-secondary border border-brand-yellow/10 rounded-full hover:border-brand-yellow transition-colors cursor-pointer group min-w-fit snap-center shadow-sm">
            {/* Icon Circle */}
            <div className="w-5 h-5 rounded-full bg-background-tertiary flex items-center justify-center border border-border-divider group-hover:border-brand-yellow/50 transition-colors">
                <span className="text-[9px] font-black text-brand-yellow leading-none">
                    {shortChar}
                </span>
            </div>
            {/* Text */}
            <span className="text-[10px] font-bold text-text-primary whitespace-nowrap group-hover:text-brand-yellow transition-colors">
                {translatedName}
            </span>
        </div>
    );
};

const MarketTicker: React.FC = () => {
    const { marketCoins } = useLiveData();
    
    if (!marketCoins || marketCoins.length === 0) return null;

    // Use a cloned list to ensure seamless looping
    const displayCoins = [...marketCoins, ...marketCoins];

    return (
        <div className="w-full overflow-hidden bg-background-secondary/30 border-b border-border-divider/50 py-2 backdrop-blur-sm relative z-10 h-10 flex items-center group">
            {/* LTR direction enforced for ticker to scroll correctly leftwards */}
            <div className="animate-marquee flex whitespace-nowrap items-center group-hover:[animation-play-state:paused]" style={{ direction: 'ltr' }}>
                {displayCoins.map((coin, idx) => (
                    <div key={`${coin.id}-${idx}`} className="flex items-center gap-2 text-xs font-mono shrink-0 px-8">
                        <span className="font-bold text-text-primary">{coin.symbol}</span>
                        <span className="text-text-secondary">${coin.price.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</span>
                        <span className={`font-medium ${coin.change24h >= 0 ? 'text-success' : 'text-error'}`}>
                            {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// === NEW COMPONENT: P2P Security Visualization ===
const P2PSecurityBanner: React.FC = () => {
    const { t, language } = useLanguage();
    const { primaryColor } = useTheme();
    const isArabic = language === 'ar';

    return (
        <div className="relative mx-0 mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-background-secondary to-background-tertiary border border-border-divider/50 p-5 shadow-lg group">
            {/* Background Decoration */}
            <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full ${primaryColor === 'brand-yellow' ? 'bg-primary-gold-10' : 'bg-primary-green-10'} blur-3xl group-hover:bg-primary-gold-10 transition-colors duration-500`}></div>
            
            {/* Header */}
            <div className="relative z-10 mb-6 flex items-center justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                        <ShieldCheck className={`h-4 w-4 ${primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green'}`} />
                        {isArabic ? 'نظام حماية P2P المتقدم' : 'Advanced P2P Protection'}
                    </h3>
                    <p className="text-[10px] text-text-secondary mt-0.5">
                        {t('escrow_explained')}
                    </p>
                </div>
                <div className={`rounded-full ${primaryColor === 'brand-yellow' ? 'bg-primary-gold-10 text-primary-gold border-primary-gold-20' : 'bg-primary-green-10 text-primary-green border-primary-green-20'} px-2 py-1 text-[9px] font-bold border`}>
                    ESCROW
                </div>
            </div>

            {/* Flowchart Diagram */}
            <div className="relative z-10 flex items-center justify-between px-2">
                {/* Step 1: Locked */}
                <div className="flex flex-col items-center gap-2 relative group/step1">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-background-secondary border border-border-divider shadow-sm group-hover/step1:border-brand-yellow/50 transition-colors">
                        <Lock className="h-5 w-5 text-brand-yellow animate-pulse" />
                        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-background-secondary p-[2px]">
                            <div className="h-full w-full rounded-full bg-brand-yellow"></div>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-text-primary">{isArabic ? 'تجميد USDT' : 'Freeze USDT'}</p>
                        <p className="text-[8px] text-text-secondary">{isArabic ? 'حجز الرصيد' : 'Assets Locked'}</p>
                    </div>
                </div>

                {/* Arrow 1 */}
                <div className="flex-1 px-2 pb-6">
                    <div className="relative h-[2px] w-full bg-border-divider">
                        <div className="absolute inset-0 bg-brand-yellow/50 w-1/2 animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>

                {/* Step 2: Payment */}
                <div className="flex flex-col items-center gap-2 group/step2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background-secondary border border-border-divider shadow-sm group-hover/step2:border-blue-400/50 transition-colors">
                        <Banknote className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-text-primary">{isArabic ? 'تأكيد الدفع' : 'Payment'}</p>
                        <p className="text-[8px] text-text-secondary">{isArabic ? 'تحويل بنكي' : 'Bank Transfer'}</p>
                    </div>
                </div>

                {/* Arrow 2 */}
                <div className="flex-1 px-2 pb-6">
                    <div className="relative h-[2px] w-full bg-border-divider">
                         <div className="absolute inset-0 bg-success/50 w-1/2 animate-[shimmer_2s_infinite_0.5s]"></div>
                    </div>
                </div>

                {/* Step 3: Release */}
                <div className="flex flex-col items-center gap-2 group/step3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background-secondary border border-border-divider shadow-sm group-hover/step3:border-success/50 transition-colors">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-text-primary">{isArabic ? 'استلام آمن' : 'Safe Release'}</p>
                        <p className="text-[8px] text-text-secondary">{isArabic ? 'تحرير الرصيد' : 'Crypto Unlocked'}</p>
                    </div>
                </div>
            </div>

            {/* Description Text */}
            <div className="mt-4 rounded-lg bg-background-tertiary/30 border border-border-divider/30 p-2 text-center">
                <p className="text-[10px] leading-relaxed text-text-secondary">
                    {t('funds_held_securely')}
                </p>
            </div>
        </div>
    );
};

interface HomeHeaderProps {
    isAuthenticated: boolean;
    user?: any;
    unreadCount: number;
    onScan: () => void;
    onLanguage: () => void;
    onProfileClick: () => void;
    showProfile?: boolean;
    onCloseProfile?: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ isAuthenticated, user, unreadCount, onScan, onLanguage, onProfileClick, showProfile, onCloseProfile }) => {
    const navigate = useNavigate();
    const { primaryColor } = useTheme();
    const { t } = useLanguage();
    
    return (
        <div className="px-4 pt-4 pb-2 flex flex-col gap-4 sticky top-0 z-30 bg-background-primary/95 backdrop-blur-xl border-b border-transparent transition-all duration-200">
            {/* Top Bar */}
            <div className="flex items-center gap-3 w-full">
                {/* Left: Profile / Logo */}
                <div className="relative flex-shrink-0 flex items-center gap-2">
                    {isAuthenticated ? (
                        <>
                            <button 
                                onClick={onProfileClick} 
                                className="w-9 h-9 rounded-full bg-background-secondary border border-border-divider flex items-center justify-center overflow-hidden active:scale-95 transition-transform hover:bg-background-tertiary shadow-sm relative z-20"
                                aria-label="Profile"
                            >
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                            </button>
                            
                            {/* Verified Badge - Advanced Style */}
                            <div 
                                onClick={() => navigate('/profile/kyc')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm transition-colors hidden sm:flex cursor-pointer hover:brightness-110 ${
                                    user?.kycStatus === 'VERIFIED' 
                                        ? 'bg-[#0ECB81]/10 text-[#0ECB81] border-[#0ECB81]/20' 
                                        : user?.kycStatus === 'PENDING'
                                            ? 'bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20'
                                            : 'bg-[#2B3139] text-[#848E9C] border-[#2B3139]'
                                }`}
                            >
                                {user?.kycStatus === 'VERIFIED' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2 w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                                ) : user?.kycStatus === 'PENDING' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield w-3.5 h-3.5"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
                                )}
                                {user?.kycStatus === 'VERIFIED' ? t('verified') : t('unverified')}
                            </div>
                            
                            {showProfile && onCloseProfile && (
                                <ProfileDropdown onClose={onCloseProfile} />
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            {/* Small Logo for Header */}
                            <svg viewBox="0 0 100 100" className="w-8 h-8 drop-shadow-md">
                                <defs>
                                    <linearGradient id="goldGradientSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#F0B90B" />
                                        <stop offset="100%" stopColor="#F8D33A" />
                                    </linearGradient>
                                </defs>
                                <path d="M50 5 L90 25 V75 L50 95 L10 75 V25 Z" fill="url(#goldGradientSmall)" stroke="#FFFFFF" strokeWidth="2" />
                                <text x="50" y="65" fontSize="40" fontWeight="bold" fill="#0B0E11" textAnchor="middle" fontFamily="Arial">U</text>
                            </svg>
                            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-yellow-300 tracking-tight hidden sm:block">
                                UbinPay
                            </span>
                        </div>
                    )}
                </div>

                {/* Center: Search Bar */}
                <div className="flex-1">
                    <button 
                        onClick={() => navigate('/markets')}
                        className="w-full h-9 bg-background-tertiary/50 hover:bg-background-tertiary rounded-full flex items-center px-3 gap-2 transition-colors group border border-transparent hover:border-border-divider"
                    >
                        <Search className="w-4 h-4 text-text-secondary group-hover:text-text-primary" />
                        <span className="text-xs text-text-secondary group-hover:text-text-primary font-medium truncate">{t('search_coin')}...</span>
                    </button>
                </div>

                {/* Right: Icons */}
                <div className="flex items-center flex-shrink-0 gap-1">
                    <button onClick={onLanguage} className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-background-tertiary active:bg-background-tertiary">
                        <Globe className="w-5 h-5" />
                    </button>

                    <button onClick={onScan} className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-background-tertiary active:bg-background-tertiary">
                        <ScanLine className="w-5 h-5" />
                    </button>
                    
                    <button onClick={() => navigate('/support')} className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-background-tertiary active:bg-background-tertiary">
                        <Headset className="w-5 h-5" />
                    </button>

                    <Link to="/notifications" className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-background-tertiary active:bg-background-tertiary relative">
                        <BellIcon className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-background-primary animate-pulse"></span>
                        )}
                    </Link>
                </div>
            </div>
        </div>
    );
};

const QuickAction: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void; colorClass?: string }> = ({ label, icon, onClick, colorClass = "text-text-primary" }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group w-full">
        <div className="w-12 h-12 rounded-2xl bg-background-tertiary/50 flex items-center justify-center border border-transparent group-hover:border-border-divider group-active:scale-95 transition-all shadow-sm">
            <div className={colorClass}>
                {icon}
            </div>
        </div>
        <span className="text-[11px] font-medium text-text-secondary group-hover:text-text-primary transition-colors text-center w-full truncate">{label}</span>
    </button>
);

const HomeScreen: React.FC = () => {
    const { t, language, setLanguage } = useLanguage();
    const { user, updateUser, isAuthenticated } = useAuth();
    const { primaryColor } = useTheme();
    const { transactions, wallets } = useLiveData();
    const { unreadCount } = useNotifications();
    const { settings } = useAppSettings();
    const navigate = useNavigate();
    
    const [showProfile, setShowProfile] = useState(false);
    const [isLangModalOpen, setIsLangModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [hideBalance, setHideBalance] = useState(false);
    const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);

    const recentTransactions = transactions.slice(0, 3);
    const totalBalance = wallets.reduce((acc, w) => acc + (w.usdValue && !isNaN(w.usdValue) ? w.usdValue : 0), 0);

    const handleLanguageSelect = (code: string) => {
        const newLang = code as Language;
        setLanguage(newLang);
        if (isAuthenticated) updateUser({ preferredLanguage: newLang });
        setIsLangModalOpen(false);
    };

    const handleScanResult = (data: string) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        navigate('/send', { state: { address: data } });
    };

    const handleProfileClick = () => {
        if (isAuthenticated) {
            setShowProfile(!showProfile);
        }
    };

    // Render Lite Mode if enabled
    if (isAuthenticated && settings.viewMode === 'lite') {
        return <LiteDashboard />;
    }

    return (
        <div className="h-full overflow-y-auto no-scrollbar bg-background-primary relative">
            <HomeHeader 
                isAuthenticated={isAuthenticated}
                user={user}
                unreadCount={unreadCount}
                onScan={() => setIsScannerOpen(true)}
                onLanguage={() => setIsLangModalOpen(true)}
                onProfileClick={handleProfileClick}
                showProfile={showProfile}
                onCloseProfile={() => setShowProfile(false)}
            />
            
            <MarketTicker />

            {isAuthenticated ? (
                <div className="px-4 pt-6 pb-32 space-y-8">
                    <OnboardingFlow />
                    
                    <ParallelMarketWidget />

                    <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-background-secondary via-background-secondary to-background-tertiary border border-border-divider shadow-2xl group">
                        <div className={`absolute top-0 right-0 w-48 h-48 ${primaryColor === 'brand-yellow' ? 'bg-primary-gold-10' : 'bg-primary-green-10'} rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none`}></div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 text-text-secondary cursor-pointer hover:text-text-primary transition-colors" onClick={() => setHideBalance(!hideBalance)}>
                                    <span className="text-xs font-bold uppercase tracking-wider">{t('total_equity')}</span>
                                    {hideBalance ? <span className="text-xs">Show</span> : <span className="text-xs">Hide</span>}
                                </div>
                                <KYCBadge status={user?.kycStatus || KYCStatus.NOT_VERIFIED} onClick={() => navigate('/profile/kyc')} />
                            </div>
                            
                            <div className="mb-6">
                                <h2 className={`text-3xl font-bold text-text-primary font-mono tracking-tight transition-all duration-300 ${hideBalance ? 'blur-md select-none' : ''}`}>
                                    {hideBalance ? '******' : totalBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </h2>
                                <p className={`text-xs text-text-secondary font-medium mt-1 ${hideBalance ? 'blur-md' : ''}`}>
                                    ≈ {hideBalance ? '******' : totalBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => navigate('/deposit')} 
                                    className={`py-3 px-4 rounded-xl font-bold text-sm text-background-primary ${primaryColor === 'brand-yellow' ? 'bg-primary-gold hover:brightness-110 shadow-lg shadow-primary-gold/20' : 'bg-primary-green hover:brightness-110 shadow-lg shadow-primary-green/20'} transition-all active:scale-[0.98]`}
                                >
                                    {t('deposit')}
                                </button>
                                <button 
                                    onClick={() => navigate('/p2p')} 
                                    className="py-3 px-4 rounded-xl font-bold text-sm text-text-primary bg-background-tertiary hover:bg-border-divider transition-all active:scale-[0.98]"
                                >
                                    {t('p2p_trading')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 px-2 py-2">
                        <QuickAction label={t('send')} icon={<Send className="w-6 h-6" />} onClick={() => navigate('/send')} />
                        <QuickAction label={t('withdraw')} icon={<ArrowUpFromLine className="w-6 h-6" />} onClick={() => navigate('/withdraw')} />
                        <QuickAction label={t('transfer')} icon={<ArrowRightLeft className="w-6 h-6" />} onClick={() => navigate('/transfer')} />
                        <QuickAction label="More" icon={<MoreHorizontal className="w-6 h-6" />} onClick={() => setIsServicesModalOpen(true)} />
                    </div>

                    {/* NEW: P2P Security Banner Section for Logged In Users */}
                    <P2PSecurityBanner />

                    <BankPartners />

                    <div className="mt-2">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="text-lg font-bold text-text-primary">{t('recent_activity')}</h3>
                            <Link to="/wallet/history" className={`text-xs font-bold hover:underline ${primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green'} flex items-center gap-1`}>
                                {t('view_all')} <ArrowRight className="w-3 h-3 rtl:rotate-180"/>
                            </Link>
                        </div>
                        {recentTransactions.length > 0 ? (
                            <div className="bg-background-secondary rounded-2xl border border-border-divider/50 overflow-hidden">
                                <TransactionList transactions={recentTransactions} />
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-background-secondary rounded-xl border border-border-divider border-dashed">
                                <p className="text-text-secondary text-sm">No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="pb-32 space-y-10">
                    <GuestHero />
                    <div className="px-4">
                        <ParallelMarketWidget />
                        {/* NEW: P2P Security Banner for Guests */}
                        <P2PSecurityBanner />
                    </div>
                    <GuestSteps />
                    <GuestFeatures />
                </div>
            )}

            <Modal isOpen={isLangModalOpen} onClose={() => setIsLangModalOpen(false)} title={t('language')}>
                <div className="space-y-3">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 border ${language === lang.code ? (primaryColor === 'brand-yellow' ? 'bg-primary-gold/10 border-primary-gold/50 shadow-sm' : 'bg-primary-green/10 border-primary-green/50 shadow-sm') : 'bg-background-tertiary/50 border-transparent hover:bg-background-tertiary'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-border-divider/50 shadow-sm shrink-0">
                                    <Flag code={LANG_FLAGS[lang.code] || 'US'} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className={`font-bold text-sm ${language === lang.code ? (primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green') : 'text-text-primary'}`}>
                                        {lang.native}
                                    </span>
                                    <span className="text-xs text-text-secondary font-medium">{lang.name}</span>
                                </div>
                            </div>
                            
                            {language === lang.code && (
                                <div className={`w-6 h-6 rounded-full ${primaryColor === 'brand-yellow' ? 'bg-primary-gold' : 'bg-primary-green'} flex items-center justify-center text-background-primary shadow-md`}>
                                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </Modal>

            <Modal isOpen={isServicesModalOpen} onClose={() => setIsServicesModalOpen(false)} title="All Services">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 px-1">{t('common')}</h3>
                        <div className="grid grid-cols-4 gap-4">
                            <QuickAction label={t('deposit')} icon={<ArrowDownToLine className="w-6 h-6" />} onClick={() => { setIsServicesModalOpen(false); navigate('/deposit'); }} colorClass="text-success" />
                            <QuickAction label={t('withdraw')} icon={<ArrowUpFromLine className="w-6 h-6" />} onClick={() => { setIsServicesModalOpen(false); navigate('/withdraw'); }} />
                            <QuickAction label={t('transfer')} icon={<ArrowRightLeft className="w-6 h-6" />} onClick={() => { setIsServicesModalOpen(false); navigate('/transfer'); }} />
                            <QuickAction label={t('p2p')} icon={<Users className="w-6 h-6" />} onClick={() => { setIsServicesModalOpen(false); navigate('/p2p'); }} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 px-1">{t('trade')}</h3>
                        <div className="grid grid-cols-4 gap-4">
                            <QuickAction label={t('buy')} icon={<Coins className="w-6 h-6" />} onClick={() => { setIsServicesModalOpen(false); navigate('/p2p'); }} colorClass="text-success" />
                            <QuickAction label={t('sell')} icon={<HandCoins className="w-6 h-6" />} onClick={() => { setIsServicesModalOpen(false); navigate('/p2p'); }} colorClass="text-error" />
                            <QuickAction label={t('swap')} icon={<RefreshCw className="w-6 h-6" />} onClick={() => { setIsServicesModalOpen(false); navigate('/swap'); }} />
                            <QuickAction label={t('history')} icon={<History className="w-6 h-6" />} onClick={() => { setIsServicesModalOpen(false); navigate('/wallet/history'); }} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 px-1">Earn & Support</h3>
                        <div className="grid grid-cols-4 gap-4">
                            <QuickAction label="Rewards" icon={<Zap className="w-6 h-6" />} onClick={() => { setIsServicesModalOpen(false); navigate('/rewards'); }} colorClass="text-brand-yellow" />
                            <QuickAction label={t('eidya')} icon={<Gift className="w-6 h-6" />} onClick={() => { setIsServicesModalOpen(false); navigate('/eidya'); }} colorClass="text-error" />
                            <QuickAction label="Staking" icon={<Layers className="w-6 h-6" />} onClick={() => { setIsServicesModalOpen(false); navigate('/earn'); }} />
                            <QuickAction label={t('support')} icon={<Headset className="w-6 h-6" />} onClick={() => { setIsServicesModalOpen(false); navigate('/support'); }} />
                        </div>
                    </div>
                </div>
            </Modal>

            <QRScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
                onScan={handleScanResult} 
            />
        </div>
    );
};

// === SMART LOCALIZED HERO (Improved Version) ===
const GuestHero: React.FC = () => {
    const { t, detectedCountry, language } = useLanguage();
    const navigate = useNavigate();
    const { primaryColor } = useTheme();
    const { config, getPaymentMethodsByCountry } = useSiteConfig();
    
    // 1. Detect User's Region (Priority: Detected IP > Default 'LY')
    const targetCountryCode = detectedCountry || 'LY'; 
    
    // 2. Logic to display text language is based on 'language' context
    const isArabic = language === 'ar';
    
    // 3. Get Country Details for Dynamic Display
    const countryData = COUNTRIES.find(c => c.code === targetCountryCode) || COUNTRIES.find(c => c.code === 'LY')!;
    
    const displayCountryName = isArabic ? countryData.name_ar : countryData.name;
    const displayCurrency = countryData.currency;
    
    // Get app name from config
    const appName = config?.appName || 'UbinPay';
    const appTagline = isArabic ? (config?.appTaglineAr || t('hero_tagline')) : (config?.appTagline || t('hero_tagline'));

    // 4. Dynamic Payment Methods - Use API config with fallback to static data
    const relevantMethods = useMemo(() => {
        // Try to get from API config first
        const apiMethods = getPaymentMethodsByCountry(targetCountryCode);
        if (apiMethods && apiMethods.length > 0) {
            return apiMethods.map(m => ({
                key: m.key,
                label: isArabic && m.labelAr ? m.labelAr : m.label,
                scope: m.scope as 'local' | 'global',
                countryCode: m.countryCode || undefined,
            }));
        }
        // Fallback to static data
        const local = ALL_PAYMENT_METHODS.filter(m => m.countryCode === targetCountryCode);
        if (local.length > 0) return local;
        return ALL_PAYMENT_METHODS.filter(m => m.scope === 'global');
    }, [targetCountryCode, getPaymentMethodsByCountry, isArabic]);

    return (
        <div className="relative px-4 pt-10 pb-8 text-center overflow-hidden">
            {/* Tech Background Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                style={{ backgroundImage: `radial-gradient(circle, ${primaryColor === 'brand-yellow' ? '#F0B90B' : '#0ECB81'} 1px, transparent 1px)`, backgroundSize: '30px 30px' }}>
            </div>
            
            {/* Ambient Glow */}
            <div className={`absolute top-[-50%] left-1/2 -translate-x-1/2 w-[120%] h-[100%] ${primaryColor === 'brand-yellow' ? 'bg-primary-gold-10' : 'bg-primary-green-10'} rounded-full blur-[100px] z-0 pointer-events-none`}></div>

            <div className="relative z-10 flex flex-col items-center">
                
                {/* UbinPay Golden Branding */}
                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="w-24 h-24 mb-4 relative">
                        <div className={`absolute inset-0 ${primaryColor === 'brand-yellow' ? 'bg-primary-gold-20' : 'bg-primary-green-20'} blur-xl rounded-full animate-pulse`}></div>
                        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-2xl">
                            <defs>
                                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#F0B90B" />
                                    <stop offset="100%" stopColor="#F8D33A" />
                                </linearGradient>
                            </defs>
                            <path d="M50 5 L90 25 V75 L50 95 L10 75 V25 Z" fill="url(#goldGradient)" stroke="#FFFFFF" strokeWidth="2" />
                            <text x="50" y="65" fontSize="40" fontWeight="bold" fill="#0B0E11" textAnchor="middle" fontFamily="Arial">U</text>
                        </svg>
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow via-yellow-300 to-brand-yellow drop-shadow-sm mb-2">
                        {appName}
                    </h1>
                    <p className="text-text-secondary text-base sm:text-lg font-medium tracking-wide max-w-xl mx-auto leading-relaxed">
                        {appTagline}
                    </p>
                </div>

                {/* Trust Badge - New Addition */}
                <div className="mb-6 animate-fadeInDown flex items-center gap-2 bg-background-secondary/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border-divider/50 shadow-sm">
                    <ShieldCheck className={`w-4 h-4 ${primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green'}`} />
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        {t('hero_trusted')}
                    </span>
                </div>

                {/* Dynamic Headline */}
                <div className="mb-10 animate-fadeInDown relative"> 
                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl font-black text-text-primary mb-6 leading-tight flex flex-col items-center justify-center gap-3">
                        <span className="opacity-90 tracking-tight text-xl sm:text-2xl font-medium text-text-secondary">
                            {t('hero_market_status')}
                        </span>
                        
                        {/* Main USDT Pill */}
                        <div className="relative group my-2">
                            <div className="absolute inset-0 bg-emerald-500 blur-[30px] opacity-20 rounded-full group-hover:opacity-40 transition-opacity duration-700 animate-pulse"></div>
                            <div className="relative inline-flex items-center gap-4 bg-background-tertiary/90 border border-emerald-500/50 px-8 py-4 rounded-full shadow-[0_0_30px_rgba(38,161,123,0.15)] backdrop-blur-2xl hover:scale-105 transition-all duration-300">
                                <UsdtIcon className="w-12 h-12 drop-shadow-md" />
                                <span className="text-emerald-500 font-mono font-bold text-5xl tracking-tighter pt-1 drop-shadow-sm">USDT</span>
                            </div>
                        </div>

                        {/* Secondary Stablecoins Row (New Request) */}
                        <div className="flex items-center gap-3 mt-2 animate-fadeInUp delay-100">
                            {[
                                { Symbol: 'USDC', Icon: UsdcIcon, color: 'text-blue-400' },
                                { Symbol: 'BUSD', Icon: BusdIcon, color: 'text-yellow-400' },
                                { Symbol: 'DAI', Icon: DaiIcon, color: 'text-orange-400' }
                            ].map(({ Symbol, Icon, color }) => (
                                <div key={Symbol} className="flex items-center gap-2 bg-[#1E2026]/50 border border-white/5 px-3 py-1.5 rounded-full hover:bg-[#1E2026] transition-colors cursor-default">
                                    <Icon className="w-5 h-5" />
                                    <span className={`text-[10px] font-bold ${color}`}>{Symbol}</span>
                                </div>
                            ))}
                        </div>

                        {/* Location Line */}
                        <span className="flex items-center gap-3 mt-6 text-xl sm:text-2xl bg-background-tertiary/30 px-5 py-2 rounded-2xl border border-white/5">
                            <span className="opacity-60 text-base">{t('in')}</span>
                            <span className={`${primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green'} flex items-center gap-2 font-bold`}>
                                <Flag code={countryData.code} className="w-6 h-4 rounded-[2px] shadow-sm object-cover" />
                                {displayCountryName}
                            </span>
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="text-text-secondary text-sm sm:text-base max-w-lg mx-auto leading-relaxed px-6 font-medium opacity-80">
                        {t('hero_description')}
                    </p>
                </div>

                {/* Live Stats Row - New Addition */}
                <div className="flex gap-4 mb-8 text-[10px] text-text-secondary bg-background-tertiary/30 px-4 py-2 rounded-xl border border-border-divider/30 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                        <span>{t('live_market')}</span>
                    </div>
                    <div className="w-px h-3 bg-border-divider"></div>
                    <div className="flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-brand-yellow" />
                        <span>Vol: $1.2M</span>
                    </div>
                </div>

                {/* Local Payment Methods Ribbon */}
                <div className="w-full mb-8 bg-[#0B0E11] rounded-2xl p-0 shadow-lg border border-border-divider/50 overflow-hidden max-w-md mx-auto relative group">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#1E2026] border-b border-border-divider">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                            {t('supported_payment_methods')}
                            <span className="bg-background-tertiary px-1.5 py-0.5 rounded text-[9px] border border-border-divider text-[#F0B90B] font-mono">{displayCurrency}</span>
                        </span>
                    </div>
                    
                    {/* Scrollable List Container */}
                    <div className="relative">
                        {/* Gradients to hint scroll */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0B0E11] to-transparent z-10 pointer-events-none"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0B0E11] to-transparent z-10 pointer-events-none"></div>

                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-3 px-4 items-center justify-start snap-x">
                            {relevantMethods.length > 0 ? (
                                relevantMethods.map(method => (
                                    <MethodCard key={method.key} method={method} />
                                ))
                            ) : (
                                <>
                                    <MethodCard method={{key: 'visa', label: 'Visa', scope: 'global'} as any} />
                                    <MethodCard method={{key: 'mastercard', label: 'Mastercard', scope: 'global'} as any} />
                                    <MethodCard method={{key: 'wise', label: 'Wise', scope: 'global'} as any} />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                    <button 
                        onClick={() => navigate('/register')}
                        className={`w-full ${primaryColor === 'brand-yellow' ? 'bg-primary-gold hover:brightness-110 shadow-lg shadow-primary-gold/20' : 'bg-primary-green hover:brightness-110 shadow-lg shadow-primary-green/20'} text-background-primary font-bold text-lg py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden`}
                    >
                        {/* Shine Effect */}
                        <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:animate-[shimmer_1s_infinite]"></div>
                        
                        <span className="relative z-10">{t('create_account')}</span>
                        <ArrowRight className="w-5 h-5 rtl:rotate-180 relative z-10" />
                    </button>
                     <button 
                        onClick={() => navigate('/login')}
                        className="w-full bg-background-secondary text-text-primary font-bold text-lg py-4 rounded-2xl border border-border-divider hover:bg-background-tertiary transition-colors"
                    >
                        {t('login')}
                    </button>
                </div>
            </div>
            
            <style>{`
                @keyframes shimmer {
                    100% { left: 150%; }
                }
            `}</style>
        </div>
    );
};

const GuestSteps: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    
    const steps = [
        { icon: CreditCard, title: t('step_1_title'), desc: t('step_1_desc') },
        { icon: ArrowRightLeft, title: t('step_2_title'), desc: t('step_2_desc') },
        { icon: Smartphone, title: t('step_3_title'), desc: t('step_3_desc') },
    ];

    return (
        <div className="px-4 py-6 mx-4 mb-6">
            <h2 className="text-center text-xl font-bold text-text-primary mb-8">{t('how_it_works')}</h2>
            <div className="space-y-8 relative">
                {/* Connecting Line */}
                <div className="absolute left-[19px] rtl:right-[19px] rtl:left-auto top-4 bottom-4 w-0.5 bg-gradient-to-b from-transparent via-border-divider to-transparent z-0"></div>
                
                {steps.map((step, i) => (
                    <div key={i} className="relative z-10 flex items-start gap-5 group">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-background-primary shadow-lg transition-colors group-hover:scale-110 duration-300 ${primaryColor === 'brand-yellow' ? 'bg-brand-yellow text-background-primary' : 'bg-brand-green text-background-primary'}`}>
                            <step.icon className="w-5 h-5" />
                        </div>
                        <div className="pt-1 bg-background-secondary/50 p-4 rounded-xl border border-border-divider/50 flex-grow hover:bg-background-secondary transition-colors">
                            <h3 className="font-bold text-text-primary text-base mb-1">{step.title}</h3>
                            <p className="text-sm text-text-secondary leading-snug">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GuestFeatures: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const features = [
        { icon: Smartphone, title: t('feature_fast_tx'), desc: t('feature_fast_desc') },
        { icon: Globe, title: t('feature_global_access'), desc: t('feature_global_desc') },
        { icon: Layers, title: "Web3 & DeFi", desc: "Connect DApps & decentralized wallets." },
        { icon: ShieldCheck, title: t('feature_secure_storage'), desc: t('feature_secure_desc') },
    ];

    return (
        <div className="px-4 py-2">
            <div className="grid gap-3">
                {features.map((f, i) => (
                    <div key={i} className="bg-background-secondary p-4 rounded-xl border border-border-divider/50 flex items-center gap-4 hover:border-brand-yellow/30 transition-colors">
                        <div className={`${primaryColor === 'brand-yellow' ? 'bg-background-tertiary text-primary-gold' : 'bg-background-tertiary text-primary-green'} p-3 rounded-full`}>
                            <f.icon className="w-5 h-5" />
                        </div>
                        <div className="text-start">
                            <h3 className="font-bold text-text-primary text-sm">{f.title}</h3>
                            <p className="text-text-secondary text-xs mt-0.5">{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BankPartners: React.FC = () => {
    const { t, detectedCountry, language } = useLanguage();
    const { user } = useAuth();
    const { getPaymentMethodsByCountry } = useSiteConfig();
    const isArabic = language === 'ar';
    
    // Explicit priority: User's country -> Detected Country -> Libya (Default)
    const targetCountry = user?.countryCode || detectedCountry || 'LY';
    
    const localMethods = useMemo(() => {
        // Try to get from API config first
        const apiMethods = getPaymentMethodsByCountry(targetCountry);
        if (apiMethods && apiMethods.length > 0) {
            return apiMethods.map(m => ({
                key: m.key,
                label: isArabic && m.labelAr ? m.labelAr : m.label,
                scope: m.scope as 'local' | 'global',
                countryCode: m.countryCode || undefined,
            }));
        }
        // Fallback to static data
        let methods = ALL_PAYMENT_METHODS.filter(m => m.countryCode === targetCountry);
        if (methods.length === 0) methods = ALL_PAYMENT_METHODS.filter(m => m.scope === 'global');
        return methods;
    }, [targetCountry, getPaymentMethodsByCountry, isArabic]);

    if (localMethods.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between px-1 mb-3">
                <h3 className="text-lg font-bold text-text-primary">{t('direct_integrations')}</h3>
                <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-background-secondary px-2 py-1 rounded-md border border-border-divider">
                    {targetCountry !== 'GLOBAL' && <Flag code={targetCountry} className="w-3 h-2 rounded-[1px]" />}
                    <span>{targetCountry === 'GLOBAL' ? 'Global' : targetCountry}</span>
                </div>
            </div>
            
            {/* Horizontal Scrollable Container */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 snap-x">
                {localMethods.map(method => (
                    <MethodCard key={method.key} method={method} />
                ))}
            </div>
        </div>
    );
};

export default HomeScreen;