
import React, { useState, useMemo, useEffect } from 'react';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLiveData } from '../../context/LiveDataContext';
import { useMarket } from '../../context/MarketContext';
import { WALLETS, ALL_PAYMENT_METHODS } from '../../constants';
import { P2POffer } from '../../types';
import { AlertCircle, ChevronDown, Globe } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useNavigate, useLocation } from 'react-router-dom';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { useNotifications } from '../../context/NotificationContext';
import { COUNTRIES, Country } from '../../constants/countries';
import { MarketSelectModal } from '../../components/MarketSelectModal';
import { Flag } from '../../components/Flag';
import { SelectField } from '../../components/SelectField';
import { SelectModal } from '../../components/SelectModal';

// Added className prop and handling z-index style on parent to prevent dropdown clipping
const FormSection: React.FC<{ title: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ title, children, className, style }) => (
    <div className={className} style={style}>
        <h2 className="text-base font-bold text-text-primary mb-3">{title}</h2>
        <div className="space-y-4 bg-background-secondary p-4 rounded-lg">
            {children}
        </div>
    </div>
);

const InputGroup: React.FC<{ label: string; children: React.ReactNode; error?: string; helperText?: string }> = ({ label, children, error, helperText }) => (
    <div>
        <label className="text-sm font-medium text-text-secondary">{label}</label>
        <div className="mt-1">{children}</div>
        {helperText && !error && <p className="text-xs text-text-secondary/80 mt-1">{helperText}</p>}
        {error && <p className="text-xs text-error mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {error}</p>}
    </div>
);


const CreateOfferScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { user } = useAuth();
    const { addP2POffer, updateP2POffer } = useLiveData();
    const { latestPrices } = useMarket();
    const navigate = useNavigate();
    const location = useLocation();
    const { addNotification } = useNotifications();
    
    const editOffer = location.state?.editOffer as P2POffer | undefined;
    
    // Get real market price from API, fallback to 1 for stablecoins
    const marketPrice = useMemo(() => {
        const priceData = latestPrices['USDT'];
        return priceData?.price || 1;
    }, [latestPrices]);

    // Form state
    const [offerType, setOfferType] = useState<'buy' | 'sell'>('sell');
    const [assetSymbol, setAssetSymbol] = useState('USDT');
    
    const [countryCode, setCountryCode] = useState<string>(user?.countryCode || 'LY');
    const [isMarketModalOpen, setMarketModalOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isPaymentTimeModalOpen, setIsPaymentTimeModalOpen] = useState(false);
    
    const [priceType, setPriceType] = useState<'fixed' | 'floating'>('fixed');
    const [fixedPrice, setFixedPrice] = useState('');
    const [floatingMargin, setFloatingMargin] = useState('1.5');
    const [totalAmount, setTotalAmount] = useState('');
    const [minLimit, setMinLimit] = useState('');
    const [maxLimit, setMaxLimit] = useState('');
    const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
    const [paymentTimeLimit, setPaymentTimeLimit] = useState('15');
    const [remarks, setRemarks] = useState('');
    
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

    // Derived unique symbols for dropdown to prevent duplicates
    const uniqueAssetSymbols = useMemo(() => {
        // Use a Set to store unique symbols from WALLETS
        const symbols = new Set(WALLETS.map(w => w.symbol));
        // Convert back to array and sort alphabetically
        return Array.from(symbols).sort();
    }, []);

    // Load initial data if editing
    useEffect(() => {
        if (editOffer) {
            setOfferType(editOffer.type === 'BUY' ? 'buy' : 'sell');
            setAssetSymbol(editOffer.asset);
            setCountryCode(editOffer.countryCode);
            setFixedPrice(editOffer.price.toString());
            setTotalAmount(editOffer.available.toString());
            setMinLimit(editOffer.minLimit.toString());
            setMaxLimit(editOffer.maxLimit.toString());
            setSelectedMethods(editOffer.paymentMethods);
            setPriceType('fixed'); 
        }
    }, [editOffer]);

    const asset = useMemo(() => WALLETS.find(w => w.symbol === assetSymbol), [assetSymbol]);
    
    const selectedCountryData = useMemo(() => {
        if (countryCode === 'GLOBAL') return { currency: 'USD', name: 'Global' };
        return COUNTRIES.find(c => c.code === countryCode) || { currency: 'LYD', name: 'Libya' };
    }, [countryCode]);
    
    const fiatCurrency = selectedCountryData.currency;
    
    const availablePaymentMethods = useMemo(() => {
        const scope = countryCode === 'GLOBAL' ? 'global' : 'local';
        if (scope === 'global') {
            return ALL_PAYMENT_METHODS.filter(m => m.scope === 'global');
        }
        return ALL_PAYMENT_METHODS.filter(m => m.scope === 'local' && m.countryCode === countryCode);
    }, [countryCode]);

    const calculatedFloatingPrice = useMemo(() => {
        const margin = parseFloat(floatingMargin);
        if (isNaN(margin)) return marketPrice;
        const finalPrice = offerType === 'sell' ? marketPrice * (1 + margin / 100) : marketPrice * (1 - margin / 100);
        return finalPrice;
    }, [floatingMargin, offerType]);

    useEffect(() => {
        if (!editOffer) {
             setSelectedMethods([]); // Reset payment methods on region change
        }
        setTouched(prev => ({ ...prev, paymentMethods: true }));
    }, [countryCode]);

    useEffect(() => {
        const validate = () => {
            if (!asset) return;
            const newErrors: Record<string, string> = {};

            if (priceType === 'fixed' && (!fixedPrice || parseFloat(fixedPrice) <= 0)) {
                newErrors.price = t('error_valid_price');
            }
            if (priceType === 'floating' && (floatingMargin === '' || isNaN(parseFloat(floatingMargin)))) {
                newErrors.price = t('error_valid_margin');
            }
            if (!totalAmount || parseFloat(totalAmount) <= 0) {
                newErrors.totalAmount = t('error_valid_total_amount');
            }
            // Removed generic balance check for SELL offers to allow testing without funds
            
            if (!minLimit || parseFloat(minLimit) <= 0) {
                newErrors.minLimit = t('error_min_limit');
            }
            if (!maxLimit || parseFloat(maxLimit) <= 0) {
                newErrors.maxLimit = t('error_max_limit');
            } else if (parseFloat(minLimit) > parseFloat(maxLimit)) {
                newErrors.maxLimit = t('error_max_less_than_min');
            }
            const currentPrice = priceType === 'fixed' ? parseFloat(fixedPrice) : calculatedFloatingPrice;
            const totalValue = parseFloat(totalAmount) * currentPrice;

            if (!isNaN(totalValue) && parseFloat(maxLimit) > totalValue) {
                newErrors.maxLimit = t('error_max_greater_than_total');
            }
            if (selectedMethods.length === 0) {
                newErrors.paymentMethods = t('error_payment_method_required');
            } else if (selectedMethods.length > 3) {
                newErrors.paymentMethods = t('error_payment_method_max');
            }
            setErrors(newErrors);
        };
        validate();
    }, [offerType, asset, countryCode, priceType, fixedPrice, floatingMargin, totalAmount, minLimit, maxLimit, selectedMethods, calculatedFloatingPrice, t]);
    
    const handleBlur = (field: string) => {
        setTouched(prev => ({...prev, [field]: true}));
    };

    const handlePostOffer = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({
            price: true,
            totalAmount: true,
            minLimit: true,
            maxLimit: true,
            paymentMethods: true,
        });
        if (Object.keys(errors).length === 0) {
            setConfirmModalOpen(true);
        }
    };
    
    const handleConfirmPost = () => {
        const finalPrice = priceType === 'fixed' ? parseFloat(fixedPrice) : calculatedFloatingPrice;
        
        const newOffer: P2POffer = {
            id: editOffer ? editOffer.id : `offer-${Date.now()}`,
            type: offerType === 'buy' ? 'BUY' : 'SELL',
            user: {
                name: user?.name || 'Me',
                rating: 5.0,
                trades: 0,
                avatarUrl: user?.avatarUrl || '',
                completionRate: 100,
                isVerifiedMerchant: user?.kycStatus === 'Verified'
            },
            userId: user?.id,
            isActive: true,
            asset: assetSymbol as any,
            fiatCurrency: fiatCurrency as any,
            countryCode: countryCode as any,
            price: finalPrice,
            available: parseFloat(totalAmount),
            minLimit: parseFloat(minLimit),
            maxLimit: parseFloat(maxLimit),
            paymentMethods: selectedMethods,
        };

        if (editOffer) {
            updateP2POffer(newOffer);
        } else {
            addP2POffer(newOffer);
        }

        setConfirmModalOpen(false);
        
        addNotification({
            icon: 'success',
            title: editOffer ? t('offer_updated_successfully') || 'Offer Updated' : t('offer_posted_successfully') || 'Offer Created',
            message: editOffer ? 'Your offer has been updated.' : 'Your offer is now live.'
        });
        
        navigate('/p2p');
    };
    
    const handleMethodToggle = (methodKey: string) => {
        if (!touched.paymentMethods) {
            handleBlur('paymentMethods');
        }
        setSelectedMethods(prev => 
            prev.includes(methodKey) 
                ? prev.filter(m => m !== methodKey)
                : [...prev, methodKey]
        );
    };

    const handleSelectMarket = (market: Country | null) => {
        setCountryCode(market ? market.code : 'GLOBAL');
        setMarketModalOpen(false);
    };

    if (!asset) return <PageLayout title={editOffer ? 'Update Offer' : t('create_offer')}><SkeletonLoader className="w-full h-96" /></PageLayout>;

    const finalPrice = priceType === 'fixed' ? parseFloat(fixedPrice) : calculatedFloatingPrice;
    const isButtonDisabled = Object.keys(errors).length > 0;
    const limitError = (touched.minLimit && errors.minLimit) || (touched.maxLimit && errors.maxLimit);
    
    const pageTitle = editOffer ? 'Update Offer' : t('create_offer');
    const submitButtonText = editOffer ? 'Update Offer' : t('post_offer');

    return (
        <PageLayout title={pageTitle} scrollable={false}>
            <form onSubmit={handlePostOffer} className="flex flex-col flex-grow h-full">
                <div className="flex-grow space-y-6 overflow-y-auto pb-4 px-4 pt-4">
                    {/* Z-index handling: Higher z-index for top sections allows dropdowns to overlap lower sections */}
                    <FormSection title={t('offer_details')} className="relative z-50">
                         <InputGroup label={t('offer_type')}>
                            <div className="flex bg-background-tertiary p-1 rounded-lg">
                                <button type="button" onClick={() => setOfferType('buy')} className={`flex-1 p-2 rounded-md font-semibold text-sm transition ${offerType === 'buy' ? 'bg-success text-white' : 'text-text-secondary'}`}>{t('buy')}</button>
                                <button type="button" onClick={() => setOfferType('sell')} className={`flex-1 p-2 rounded-md font-semibold text-sm transition ${offerType === 'sell' ? `bg-error text-white` : 'text-text-secondary'}`}>{t('sell')}</button>
                            </div>
                         </InputGroup>
                         <div className="grid grid-cols-2 gap-4">
                            <InputGroup label={t('asset')}>
                                <div className="relative z-20">
                                    <SelectField
                                        valueLabel={assetSymbol}
                                        onClick={() => setIsAssetModalOpen(true)}
                                        className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 ltr:pl-3 ltr:pr-10 rtl:pr-3 rtl:pl-10 appearance-none focus:ring-2 focus:outline-none text-text-primary font-bold"
                                        style={{ '--tw-ring-color': `var(--tw-color-${primaryColor})` } as React.CSSProperties}
                                    />
                                </div>
                            </InputGroup>
                            <InputGroup label={t('country')}>
                                <div className="relative z-20">
                                    <button
                                        type="button"
                                        onClick={() => setMarketModalOpen(true)}
                                        className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 flex items-center justify-between focus:outline-none focus:ring-2"
                                        style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                                        aria-haspopup="listbox"
                                        aria-expanded={isMarketModalOpen}
                                        aria-label="Select currency"
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                             {countryCode === 'GLOBAL' ? (
                                                 <div className="w-6 h-4 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0"><Globe className="w-3 h-3 text-blue-500"/></div>
                                             ) : (
                                                 <Flag code={countryCode} className="w-6 h-4 rounded-sm object-cover flex-shrink-0" />
                                             )}
                                             <span className="truncate text-sm text-text-primary font-medium">{selectedCountryData.name} ({selectedCountryData.currency})</span>
                                        </div>
                                        <ChevronDown className="w-5 h-5 text-text-secondary flex-shrink-0 transition-transform" />
                                    </button>
                                </div>
                            </InputGroup>
                         </div>
                    </FormSection>

                    <FormSection title={t('pricing')} className="relative z-40">
                        <div className="flex bg-background-tertiary p-1 rounded-lg">
                            <button type="button" onClick={() => setPriceType('fixed')} className={`flex-1 p-2 rounded-md font-semibold text-sm transition ${priceType === 'fixed' ? `bg-background-primary text-text-primary shadow` : 'text-text-secondary'}`}>{t('fixed')}</button>
                            <button type="button" onClick={() => setPriceType('floating')} className={`flex-1 p-2 rounded-md font-semibold text-sm transition ${priceType === 'floating' ? `bg-background-primary text-text-primary shadow` : 'text-text-secondary'}`}>{t('floating')}</button>
                        </div>
                        {priceType === 'fixed' ? (
                            <InputGroup label={t('price')} error={touched.price ? errors.price : undefined}>
                                <input type="number" inputMode="decimal" step="any" placeholder="0.00" value={fixedPrice} onBlur={() => handleBlur('price')} onChange={e => setFixedPrice(e.target.value)} className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 focus:ring-2 focus:outline-none text-left rtl:text-right" dir="ltr" style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}/>
                            </InputGroup>
                        ) : (
                            <InputGroup label={t('margin')} error={touched.price ? errors.price : undefined} helperText={`${t('market_price')}: ${marketPrice.toFixed(2)} ${fiatCurrency}. Your price: ${calculatedFloatingPrice.toFixed(2)} ${fiatCurrency}`}>
                                <div className="relative">
                                     <input type="number" inputMode="decimal" step="any" placeholder="1.5" value={floatingMargin} onBlur={() => handleBlur('price')} onChange={e => setFloatingMargin(e.target.value)} className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 pe-8 focus:ring-2 focus:outline-none text-left rtl:text-right" dir="ltr" style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}/>
                                     <span className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium text-sm">%</span>
                                </div>
                            </InputGroup>
                        )}
                    </FormSection>
                    
                    <FormSection title={t('payment_and_limits')} className="relative z-30">
                        <InputGroup label={`${t('total_amount_to_sell')} (${asset.symbol})`} error={touched.totalAmount ? errors.totalAmount : undefined} helperText={`${t('balance')}: ${asset.balance.toLocaleString()}`}>
                           <input type="number" inputMode="decimal" step="any" placeholder="e.g. 5000" value={totalAmount} onBlur={() => handleBlur('totalAmount')} onChange={e => setTotalAmount(e.target.value)} className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 focus:ring-2 focus:outline-none text-left rtl:text-right" dir="ltr" style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}/>
                        </InputGroup>
                        <InputGroup label={`${t('order_limits')} (${fiatCurrency})`} error={limitError || undefined}>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="number" inputMode="decimal" placeholder={t('min')} value={minLimit} onBlur={() => handleBlur('minLimit')} onChange={e => setMinLimit(e.target.value)} className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 focus:ring-2 focus:outline-none text-left rtl:text-right" dir="ltr" style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}/>
                                <input type="number" inputMode="decimal" placeholder={t('max')} value={maxLimit} onBlur={() => handleBlur('maxLimit')} onChange={e => setMaxLimit(e.target.value)} className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 focus:ring-2 focus:outline-none text-left rtl:text-right" dir="ltr" style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}/>
                            </div>
                        </InputGroup>
                         <InputGroup label={t('payment_methods')} error={touched.paymentMethods ? errors.paymentMethods : undefined} helperText={t('payment_method_helper')}>
                            {availablePaymentMethods.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {availablePaymentMethods.map(method => (
                                        <button type="button" key={method.key} onClick={() => handleMethodToggle(method.key)} className={`p-2 rounded-lg text-sm font-semibold text-center transition border ${selectedMethods.includes(method.key) ? `border-transparent ${primaryColor === 'brand-yellow' ? 'bg-brand-yellow/10 text-brand-yellow' : 'bg-brand-green/10 text-brand-green'}` : 'bg-background-tertiary border-border-divider text-text-secondary'}`}>
                                            {t(method.key as any)}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-text-secondary italic p-2 bg-background-tertiary rounded-lg">No specific payment methods available for {selectedCountryData.name} yet.</div>
                            )}
                        </InputGroup>
                    </FormSection>
                    
                    <FormSection title={t('conditions')} className="relative z-20">
                        <InputGroup label={t('payment_time_limit')}>
                            <SelectField
                                valueLabel={`${paymentTimeLimit} ${t('minutes')}`}
                                onClick={() => setIsPaymentTimeModalOpen(true)}
                                className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 ltr:pl-3 ltr:pr-10 rtl:pr-3 rtl:pl-10 focus:ring-2 focus:outline-none text-text-primary font-medium"
                                style={{ '--tw-ring-color': `var(--tw-color-${primaryColor})` } as React.CSSProperties}
                            />
                        </InputGroup>
                        <InputGroup label={t('remarks_optional')}>
                            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 focus:ring-2 focus:outline-none" style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}></textarea>
                        </InputGroup>
                    </FormSection>
                </div>
                
                <div className="flex-none p-4 mt-auto bg-background-primary border-t border-border-divider/50 z-10">
                    <button type="submit" disabled={isButtonDisabled} className={`w-full p-4 rounded-lg text-lg font-bold text-background-primary transition-opacity disabled:opacity-50 ${primaryColor === 'brand-yellow' ? 'bg-brand-yellow' : 'bg-brand-green'}`}>
                        {submitButtonText}
                    </button>
                </div>
            </form>

            <Modal isOpen={isConfirmModalOpen} onClose={() => setConfirmModalOpen(false)} title={editOffer ? 'Confirm Update' : t('confirm_offer_creation')}>
                <div className="space-y-4 text-sm">
                    <p className="text-center text-text-secondary">{t('review_offer_details_prompt')}</p>
                    <div className="bg-background-tertiary p-3 rounded-lg space-y-2">
                        <div className="flex justify-between"><span className="text-text-secondary">{t('offer_type')}</span><span className={`font-bold ${offerType === 'buy' ? 'text-success' : 'text-error'}`}>{t(offerType)}</span></div>
                        <div className="flex justify-between"><span className="text-text-secondary">{t('market_snapshot')}</span><span className="font-bold text-text-primary">{selectedCountryData.name} ({fiatCurrency})</span></div>
                        <div className="flex justify-between"><span className="text-text-secondary">{t('asset')}</span><span className="font-bold text-text-primary">{totalAmount} {asset.symbol}</span></div>
                        <div className="flex justify-between"><span className="text-text-secondary">{t('price')}</span><span className="font-bold text-text-primary">{finalPrice.toFixed(2)} {fiatCurrency}</span></div>
                        <div className="flex justify-between"><span className="text-text-secondary">{t('order_limits')}</span><span className="font-bold text-text-primary">{minLimit} - {maxLimit} {fiatCurrency}</span></div>
                        <div className="flex justify-between"><span className="text-text-secondary">{t('payment_methods')}</span><span className="font-bold text-text-primary text-end">{selectedMethods.map(m => t(m as any)).join(', ')}</span></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setConfirmModalOpen(false)} className="flex-1 p-3 rounded-lg font-semibold bg-background-tertiary text-text-primary">{t('cancel')}</button>
                        <button onClick={handleConfirmPost} className={`flex-1 p-3 rounded-lg font-bold text-background-primary ${primaryColor === 'brand-yellow' ? 'bg-brand-yellow' : 'bg-brand-green'}`}>{t('confirm')}</button>
                    </div>
                </div>
            </Modal>
            
             <MarketSelectModal 
                isOpen={isMarketModalOpen}
                onClose={() => setMarketModalOpen(false)}
                onSelect={handleSelectMarket}
                currentCode={countryCode}
            />

            <SelectModal
                isOpen={isAssetModalOpen}
                onClose={() => setIsAssetModalOpen(false)}
                title={t('asset')}
                value={assetSymbol}
                searchable
                searchPlaceholder={t('search_asset')}
                accentColorClassName={primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'}
                options={uniqueAssetSymbols.map((symbol) => ({ value: symbol, label: symbol }))}
                onChange={(symbol) => setAssetSymbol(symbol)}
            />

            <SelectModal
                isOpen={isPaymentTimeModalOpen}
                onClose={() => setIsPaymentTimeModalOpen(false)}
                title={t('payment_time_limit')}
                value={paymentTimeLimit}
                accentColorClassName={primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'}
                options={['15', '30', '45', '60'].map((v) => ({ value: v, label: `${v} ${t('minutes')}` }))}
                onChange={(v) => setPaymentTimeLimit(v)}
            />
        </PageLayout>
    );
};

export default CreateOfferScreen;
