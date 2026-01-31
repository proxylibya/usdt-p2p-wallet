
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ALL_PAYMENT_METHODS } from '../constants';
import { COUNTRIES, Country } from '../constants/countries';
import { P2POffer, PaymentMethod } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useP2P } from '../context/P2PContext';
import { PlusCircleIcon } from '../components/icons/PlusCircleIcon';
import { TradeModal } from '../components/TradeModal';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { Modal } from '../components/Modal';
import { Filter as FilterIcon, Search, Globe, ListChecks, Trash2, FileText, ChevronDown, ShieldCheck, BadgeCheck, ThumbsUp, Banknote, CreditCard, Smartphone, Timer, Clock, TrendingUp, Check } from 'lucide-react';
import { VerifiedIcon } from '../components/icons/VerifiedIcon';
import { EmptyState } from '../components/EmptyState';
import { Flag } from '../components/Flag';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { MyOfferCard } from '../components/MyOfferCard';
import { MarketSelectModal } from '../components/MarketSelectModal';

// --- Components ---

const GuestP2PBanner: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const navigate = useNavigate();

    return (
        <div className={`mb-4 relative overflow-hidden rounded-2xl p-5 border border-border-divider shadow-lg bg-gradient-to-br ${primaryColor === 'brand-yellow' ? 'from-background-secondary via-background-secondary to-brand-yellow/10' : 'from-background-secondary via-background-secondary to-brand-green/10'}`}>
            <div className="relative z-10">
                <h2 className="text-xl font-bold text-text-primary mb-1">{t('p2p_guest_title')}</h2>
                <p className="text-sm text-text-secondary mb-4 max-w-[80%]">{t('p2p_guest_subtitle')}</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate('/register')} 
                        className="px-4 py-2 rounded-lg font-bold text-sm text-background-primary bg-brand-yellow hover:brightness-110 transition-all shadow-md active:scale-95"
                    >
                        {t('register')}
                    </button>
                    <button 
                        onClick={() => navigate('/login')} 
                        className="px-4 py-2 rounded-lg font-bold text-sm text-text-primary bg-background-tertiary hover:bg-border-divider transition-all active:scale-95 border border-border-divider"
                    >
                        {t('login')}
                    </button>
                </div>
            </div>
            <div className="absolute top-2 right-2 opacity-10">
                <ShieldCheck className="w-24 h-24 text-brand-yellow" />
            </div>
        </div>
    );
};

// Pulsing Dot Component
const OnlineIndicator: React.FC = () => (
    <span className="relative flex h-2.5 w-2.5 mx-1">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success border border-background-secondary"></span>
    </span>
);

// Helper for brand colors
const getBrandColor = (key: string): string => {
    const lower = key.toLowerCase();
    if (lower.includes('vodafone')) return '#E60000';
    if (lower.includes('orange')) return '#FF7900';
    if (lower.includes('etisalat')) return '#99CC33';
    if (lower.includes('instapay')) return '#4B0082';
    if (lower.includes('stc')) return '#4F008C';
    if (lower.includes('urpay')) return '#F59E0B';
    if (lower.includes('sadad')) return '#22C55E'; 
    if (lower.includes('mobi')) return '#0090DF'; 
    if (lower.includes('tadavul')) return '#0057B8'; 
    if (lower.includes('madar')) return '#444444'; 
    if (lower.includes('libyana')) return '#800080';
    if (lower.includes('aman')) return '#008000';
    if (lower.includes('wahda')) return '#0056b3';
    if (lower.includes('sahara')) return '#d4af37';
    if (lower.includes('north')) return '#006400';
    if (lower.includes('jumhouria') || lower.includes('republic')) return '#F0B90B'; 
    if (lower.includes('wise')) return '#9DE846'; 
    if (lower.includes('payoneer')) return '#FF4800';
    if (lower.includes('paypal')) return '#003087';
    if (lower.includes('skrill')) return '#811E4E';
    if (lower.includes('revolut')) return '#0075EB';
    return '#848E9C'; 
};

const PaymentMethodBadge: React.FC<{ methodKey: string }> = ({ methodKey }) => {
    const { t } = useLanguage();
    const label = t(methodKey as any) || methodKey;
    const color = getBrandColor(methodKey);

    return (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold text-text-secondary bg-background-tertiary/30 border border-border-divider/50 whitespace-nowrap hover:bg-background-tertiary transition-colors select-none">
            <div 
                className="w-2 h-2 rounded-full flex-shrink-0 shadow-[0_0_5px_rgba(0,0,0,0.2)]" 
                style={{ backgroundColor: color }}
            ></div>
            <span className="truncate max-w-[120px]">{label}</span>
        </div>
    );
};

// P2P Live Market Ticker
const P2PMarketTicker: React.FC<{ currency: string, avgPrice: number }> = ({ currency, avgPrice }) => {
    const { t } = useLanguage();
    return (
        <div className="flex items-center justify-between bg-background-tertiary/30 border-y border-border-divider/50 px-4 py-1.5 mb-2 overflow-hidden">
            <div className="flex items-center gap-2 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                <span className="text-[10px] font-bold text-success uppercase tracking-wider">Live Market</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-brand-yellow" />
                    Avg: <span className="text-text-primary font-mono font-bold">{avgPrice.toFixed(2)} {currency}</span>
                </span>
                <span className="w-px h-3 bg-border-divider"></span>
                <span>24h Vol: <span className="text-text-primary">1.2M</span></span>
            </div>
        </div>
    );
};

const OfferCard: React.FC<{ offer: P2POffer, onStartTrade: (offer: P2POffer) => void }> = ({ offer, onStartTrade }) => {
    const { t } = useLanguage();
    const isBuyAction = offer.type === 'SELL'; 
    const isFastMerchant = offer.user.completionRate > 95;
    
    return (
        <div className="bg-background-secondary rounded-xl p-4 mb-3 border-b border-border-divider/50 shadow-sm active:bg-background-tertiary/20 transition-all duration-200 group relative overflow-hidden">
            {/* Subtle Highlight for Fast Merchants */}
            {isFastMerchant && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-brand-yellow/10 to-transparent pointer-events-none rounded-bl-3xl"></div>
            )}

            {/* Header: User Info & Stats */}
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-background-tertiary flex items-center justify-center text-sm font-bold text-text-secondary overflow-hidden border border-border-divider ring-2 ring-transparent group-hover:ring-border-divider/50 transition-all">
                             {offer.user.avatarUrl ? <img src={offer.user.avatarUrl} alt="" className="w-full h-full object-cover" /> : offer.user.name[0]}
                        </div>
                        <div className="absolute bottom-0 right-0">
                            {offer.user.isVerifiedMerchant ? (
                                <BadgeCheck className="w-4 h-4 text-brand-yellow fill-background-secondary" />
                            ) : (
                                <OnlineIndicator />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-text-primary">{offer.user.name}</span>
                            {isFastMerchant && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-yellow/10 border border-brand-yellow/20">
                                    <Timer className="w-3 h-3 text-brand-yellow" />
                                    <span className="text-[9px] font-bold text-brand-yellow uppercase tracking-wider">{t('express')}</span>
                                </div>
                            )}
                        </div>
                        <div className="text-[10px] text-text-secondary flex items-center gap-2 mt-0.5">
                            <span>{offer.user.trades} {t('trades')}</span>
                            <span className="w-px h-2 bg-border-divider"></span>
                            <span className={offer.user.completionRate > 90 ? 'text-success' : 'text-text-secondary'}>{offer.user.completionRate}% {t('completion_rate')}</span>
                        </div>
                    </div>
                </div>
                
                {/* Time Indicator (Mock) */}
                <div className="flex items-center gap-1 text-[10px] text-text-secondary bg-background-tertiary/50 px-2 py-1 rounded-md">
                    <Clock className="w-3 h-3" />
                    <span>~15m</span>
                </div>
            </div>

            {/* Price Section */}
            <div className="mb-4 relative z-10">
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-2xl font-black tracking-tight font-mono ${isBuyAction ? 'text-success' : 'text-error'}`}>
                            {offer.price.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-text-primary">{offer.fiatCurrency}</span>
                    </div>
                </div>
            </div>

            {/* Data Grid: Limits & Amount */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mb-4 bg-background-tertiary/20 p-2 rounded-lg border border-border-divider/30">
                <div className="flex flex-col gap-1">
                    <span className="text-text-secondary text-[10px] uppercase">{t('available')}</span>
                    <span className="text-text-primary font-bold font-mono">{offer.available.toLocaleString()} {offer.asset}</span>
                </div>
                <div className="flex flex-col gap-1 items-end text-end">
                    <span className="text-text-secondary text-[10px] uppercase">{t('limit')}</span>
                    <span className="text-text-primary font-bold font-mono">{offer.minLimit.toLocaleString()} - {offer.maxLimit.toLocaleString()} {offer.fiatCurrency}</span>
                </div>
            </div>

            {/* Footer: Payment Methods (Scrollable) & Action */}
            <div className="flex items-center justify-between pt-3 border-t border-border-divider/50 gap-3 relative z-10">
                <div className="flex-1 relative min-w-0 overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar flex gap-1.5 whitespace-nowrap pe-6 py-0.5">
                        {offer.paymentMethods.map(m => <PaymentMethodBadge key={m} methodKey={m} />)}
                    </div>
                    <div className="absolute inset-y-0 end-0 w-8 bg-gradient-to-l rtl:bg-gradient-to-r from-background-secondary to-transparent pointer-events-none"></div>
                </div>
                
                <button 
                    onClick={() => onStartTrade(offer)}
                    className={`flex-shrink-0 px-6 py-2.5 rounded-lg font-bold text-sm text-white shadow-lg transition-transform active:scale-95 hover:brightness-110 ${isBuyAction ? 'bg-success shadow-success/20' : 'bg-error shadow-error/20'}`}
                >
                    {t(isBuyAction ? 'buy' : 'sell')}
                </button>
            </div>
        </div>
    )
}

const P2PHeader: React.FC<{ 
    onFilterClick: () => void; 
    filtersAreActive: boolean;
    selectedCountry: Country | null;
    onCountryClick: () => void;
    viewMode: 'market' | 'my_ads';
    onViewModeChange: (mode: 'market' | 'my_ads') => void;
    onCreateAd: () => void;
}> = ({ onFilterClick, filtersAreActive, selectedCountry, onCountryClick, viewMode, onViewModeChange, onCreateAd }) => {
    const { t } = useLanguage();
    const { isAuthenticated } = useAuth();
    const { primaryColor } = useTheme();
    
    const displayCurrency = selectedCountry ? selectedCountry.currency : 'USD';
    const displayCode = selectedCountry ? selectedCountry.code : 'GLOBAL';

    return (
        <div className="flex-none pb-2">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-text-primary">{viewMode === 'my_ads' ? t('my_ads') : t('p2p_title')}</h1>
                    {viewMode === 'market' && (
                        <button onClick={onCountryClick} className="bg-background-tertiary px-3 py-1.5 rounded-full text-xs font-bold text-text-primary flex items-center gap-2 hover:bg-border-divider transition-colors border border-border-divider active:scale-95">
                            {displayCode === 'GLOBAL' ?
                                <Globe className="w-4 h-4 text-brand-yellow" /> :
                                <Flag code={displayCode} className="w-5 h-4 rounded-sm object-cover shadow-sm" />
                            }
                            <span className="uppercase">{displayCurrency}</span>
                            <ChevronDown className="w-3 h-3 text-text-secondary" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isAuthenticated && (
                        <button 
                            onClick={() => onViewModeChange(viewMode === 'my_ads' ? 'market' : 'my_ads')} 
                            className="p-2 rounded-full transition-colors text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
                            title={t('my_ads')}
                        >
                            <FileText className="w-6 h-6" />
                        </button>
                    )}
                    <button onClick={onFilterClick} className={`relative text-text-secondary hover:text-text-primary transition p-2 rounded-full hover:bg-background-tertiary`}>
                        <FilterIcon className="w-6 h-6" />
                        {filtersAreActive && <span className={`absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-brand-yellow ring-2 ring-background-primary`}></span>}
                    </button>
                    <button onClick={onCreateAd} className={`text-brand-yellow hover:brightness-110 transition p-1 hover:scale-110`}>
                        <PlusCircleIcon className="w-7 h-7" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const P2PScreen: React.FC = () => {
    const { t, detectedCountry } = useLanguage();
    const { primaryColor } = useTheme();
    const { isAuthenticated, user } = useAuth();
    
    // Direct use of P2P Context to isolate updates
    const { p2pOffers, deleteP2POffer, updateP2POffer, isLoading } = useP2P();
    
    const navigate = useNavigate();
    const { addNotification } = useNotifications();

    const [viewMode, setViewMode] = useState<'market' | 'my_ads'>('market');
    const [buySellFilter, setBuySellFilter] = useState<'buy' | 'sell'>('buy'); 
    const [isFilterModalOpen, setFilterModalOpen] = useState(false);
    
    // Advanced Filters
    const [amountFilter, setAmountFilter] = useState('');
    const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
    const [onlyVerified, setOnlyVerified] = useState(false);
    
    const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>(() => {
        if (user?.countryCode) return user.countryCode;
        if (detectedCountry) return detectedCountry;
        return 'GLOBAL';
    });

    const [selectedTradeOffer, setSelectedTradeOffer] = useState<P2POffer | null>(null);
    const [isTradeModalOpen, setTradeModalOpen] = useState(false);
    const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

    const selectedCountry = useMemo(() => {
        if (selectedCountryCode === 'GLOBAL') return null;
        return COUNTRIES.find(c => c.code === selectedCountryCode) || null;
    }, [selectedCountryCode]);

    const availablePaymentMethods = useMemo(() => {
        if (selectedCountryCode === 'GLOBAL') {
            return ALL_PAYMENT_METHODS.filter(m => m.scope === 'global');
        }
        return ALL_PAYMENT_METHODS.filter(m => m.countryCode === selectedCountryCode);
    }, [selectedCountryCode]);

    const filteredOffers = useMemo(() => {
        if (viewMode === 'my_ads') {
            if (!user) return [];
            return p2pOffers.filter(o => o.userId === user.id);
        }

        return p2pOffers.filter(offer => {
            const matchesType = buySellFilter === 'buy' ? offer.type === 'SELL' : offer.type === 'BUY';
            if (!matchesType) return false;
            if (offer.countryCode !== selectedCountryCode) return false;
            if (amountFilter && parseFloat(amountFilter) > 0) {
                const amt = parseFloat(amountFilter);
                if (amt < offer.minLimit || amt > offer.maxLimit) return false;
            }
            if (selectedMethods.length > 0) {
                const hasMethod = offer.paymentMethods.some(m => selectedMethods.includes(m));
                if (!hasMethod) return false;
            }
            if (onlyVerified && !offer.user.isVerifiedMerchant) return false;
            if (!offer.isActive) return false;
            if (user && offer.userId === user.id) return false;

            return true;
        });
    }, [p2pOffers, buySellFilter, amountFilter, selectedMethods, onlyVerified, selectedCountryCode, viewMode, user]);

    // Calculate average price for ticker
    const avgPrice = useMemo(() => {
        if (filteredOffers.length === 0) return 0;
        const sum = filteredOffers.reduce((acc, curr) => acc + curr.price, 0);
        return sum / filteredOffers.length;
    }, [filteredOffers]);

    const handleStartTrade = (offer: P2POffer) => {
        if (!isAuthenticated) {
            setIsLoginPromptOpen(true);
            return;
        }
        setSelectedTradeOffer(offer);
        setTradeModalOpen(true);
    };

    const handleCreateAd = () => {
        if (!isAuthenticated) {
            setIsLoginPromptOpen(true);
            return;
        }
        navigate('/p2p/create');
    };

    const handleEditAd = (id: string) => {
        const offer = p2pOffers.find(o => o.id === id);
        if (offer) {
            navigate('/p2p/create', { state: { editOffer: offer } });
        }
    }

    const handleDeleteAd = (id: string) => {
        if (window.confirm("Are you sure you want to delete this ad?")) {
            deleteP2POffer(id);
            addNotification({ icon: 'info', title: 'Deleted', message: 'Ad removed.' });
        }
    }

    const handleToggleAd = (id: string, isActive: boolean) => {
        const offer = p2pOffers.find(o => o.id === id);
        if (offer) {
            updateP2POffer({ ...offer, isActive });
        }
    }

    const handleMethodToggle = (methodKey: string) => {
        setSelectedMethods(prev => 
            prev.includes(methodKey) ? prev.filter(k => k !== methodKey) : [...prev, methodKey]
        );
    };

    const filtersAreActive = !!amountFilter || selectedMethods.length > 0 || onlyVerified;

    return (
        <div className="flex flex-col h-full w-full bg-background-primary relative overflow-hidden">
            
            {/* Header Section */}
            <div className="flex-none px-4 pt-4 z-20 bg-background-primary">
                <P2PHeader 
                    onFilterClick={() => setFilterModalOpen(true)} 
                    filtersAreActive={filtersAreActive}
                    selectedCountry={selectedCountry}
                    onCountryClick={() => setIsMarketModalOpen(true)}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onCreateAd={handleCreateAd}
                />
                
                {/* Buy/Sell Toggle & Quick Filter */}
                {viewMode === 'market' && (
                    <>
                        <div className="flex bg-background-tertiary p-1 rounded-lg mb-3">
                            <button 
                                onClick={() => setBuySellFilter('buy')} 
                                className={`flex-1 py-2.5 rounded-md font-bold text-sm transition-all active:scale-[0.98] ${buySellFilter === 'buy' ? 'bg-success text-white shadow-lg shadow-success/20' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                {t('buy')}
                            </button>
                            <button 
                                onClick={() => setBuySellFilter('sell')} 
                                className={`flex-1 py-2.5 rounded-md font-bold text-sm transition-all active:scale-[0.98] ${buySellFilter === 'sell' ? 'bg-error text-white shadow-lg shadow-error/20' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                {t('sell')}
                            </button>
                        </div>

                        {/* Payment Method Quick Filter */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 mb-1">
                            <button
                                onClick={() => setSelectedMethods([])}
                                className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors bg-brand-yellow/10 border-brand-yellow text-brand-yellow"
                            >
                                {t('all_transactions')}
                            </button>
                            {availablePaymentMethods.map(method => {
                                const isSelected = selectedMethods.includes(method.key);
                                return (
                                    <button
                                        key={method.key}
                                        onClick={() => handleMethodToggle(method.key)}
                                        className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors bg-brand-yellow/10 border-brand-yellow text-brand-yellow"
                                    >
                                        {t(method.key as any)}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Live Ticker */}
            {viewMode === 'market' && avgPrice > 0 && (
                <P2PMarketTicker currency={selectedCountry ? selectedCountry.currency : 'USD'} avgPrice={avgPrice} />
            )}

            {/* List Content */}
            <div className="flex-grow overflow-y-auto px-4 pb-32 no-scrollbar">
                {!isAuthenticated && viewMode === 'market' && <GuestP2PBanner />}

                {isLoading ? (
                    <div className="space-y-4 pt-4">
                        <SkeletonLoader className="h-40 w-full rounded-xl" />
                        <SkeletonLoader className="h-40 w-full rounded-xl" />
                        <SkeletonLoader className="h-40 w-full rounded-xl" />
                    </div>
                ) : filteredOffers.length > 0 ? (
                    <div className="animate-fadeInUp">
                        {filteredOffers.map(offer => (
                            viewMode === 'my_ads' ? (
                                <MyOfferCard 
                                    key={offer.id} 
                                    offer={offer} 
                                    onToggle={handleToggleAd}
                                    onEdit={handleEditAd}
                                    onDelete={handleDeleteAd}
                                />
                            ) : (
                                <OfferCard key={offer.id} offer={offer} onStartTrade={handleStartTrade} />
                            )
                        ))}
                        <div className="text-center py-6 text-text-secondary text-xs opacity-50 flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-border-divider"></span>
                            End of results
                            <span className="w-1.5 h-1.5 rounded-full bg-border-divider"></span>
                        </div>
                    </div>
                ) : (
                    <div className="pt-10">
                        <EmptyState 
                            icon={viewMode === 'my_ads' ? ListChecks : Search}
                            title={viewMode === 'my_ads' ? (buySellFilter === 'buy' ? t('no_buy_ads') : t('no_sell_ads')) : t('no_matching_offers')}
                            message={viewMode === 'my_ads' ? t('no_ads_of_this_type') : t('no_matching_offers_message')}
                            action={
                                viewMode === 'my_ads' ? (
                                    <button onClick={handleCreateAd} className="px-6 py-2 rounded-lg bg-brand-yellow text-background-primary font-bold text-sm">{t('create_ad')}</button>
                                ) : (
                                    <button onClick={() => { setAmountFilter(''); setSelectedMethods([]); setOnlyVerified(false); }} className={`px-6 py-2 rounded-lg bg-background-tertiary text-text-primary font-bold text-sm`}>{t('reset_filters')}</button>
                                )
                            }
                        />
                    </div>
                )}
            </div>

            {/* Filter Modal */}
            <Modal isOpen={isFilterModalOpen} onClose={() => setFilterModalOpen(false)} title={t('filter_by')}>
                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-bold text-text-primary mb-2 block">{t('amount')}</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                placeholder={t('amount')} // Translated placeholder
                                value={amountFilter}
                                onChange={(e) => setAmountFilter(e.target.value)}
                                className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 pe-12 focus:outline-none focus:border-brand-yellow text-text-primary text-start"
                            />
                            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm font-bold">{selectedCountry ? selectedCountry.currency : 'USD'}</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-text-primary mb-2 block">{t('payment_methods')}</label>
                        <div className="flex flex-wrap gap-2">
                            {availablePaymentMethods.map(method => (
                                <button 
                                    key={method.key}
                                    onClick={() => handleMethodToggle(method.key)}
                                    className="px-3 py-2 rounded-lg text-xs font-bold border transition-colors bg-brand-yellow/10 border-brand-yellow text-brand-yellow"
                                >
                                    {t(method.key as any)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-background-tertiary p-3 rounded-lg">
                        <span className="text-sm font-bold text-text-primary flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-brand-yellow" />
                            {t('verified_merchants')}
                        </span>
                        <button 
                            onClick={() => setOnlyVerified(!onlyVerified)}
                            className="w-11 h-6 rounded-full relative transition-colors bg-brand-yellow"
                        >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${onlyVerified ? 'right-1' : 'left-1'}`}></span>
                        </button>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                            onClick={() => { setAmountFilter(''); setSelectedMethods([]); setOnlyVerified(false); setFilterModalOpen(false); }}
                            className="flex-1 p-3 rounded-lg font-semibold bg-background-tertiary text-text-primary hover:bg-border-divider"
                        >
                            {t('reset')}
                        </button>
                        <button 
                            onClick={() => setFilterModalOpen(false)}
                            className="flex-1 p-3 rounded-lg font-bold text-background-primary bg-brand-yellow"
                        >
                            {t('apply_filters')}
                        </button>
                    </div>
                </div>
            </Modal>

            {selectedTradeOffer && (
                <TradeModal isOpen={isTradeModalOpen} onClose={() => setTradeModalOpen(false)} offer={selectedTradeOffer} />
            )}
            
            <LoginPromptModal isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
            
            <MarketSelectModal 
                isOpen={isMarketModalOpen} 
                onClose={() => setIsMarketModalOpen(false)} 
                onSelect={(country) => {
                    setSelectedCountryCode(country ? country.code : 'GLOBAL');
                    setIsMarketModalOpen(false);
                    setSelectedMethods([]); 
                }}
                currentCode={selectedCountryCode}
            />
        </div>
    );
};

export default P2PScreen;
