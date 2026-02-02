/**
 * 🏠 Guest Hero Section - Landing page hero for non-authenticated users
 * Extracted from HomeScreen.tsx for better maintainability
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Activity } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { Flag } from '../Flag';
import { COUNTRIES } from '../../constants/countries';
import { ALL_PAYMENT_METHODS } from '../../constants';
import { PaymentMethod } from '../../types';
import { UsdtIcon, UsdcIcon, BusdIcon, DaiIcon } from '../icons/CryptoIcons';

// Method Card Component
const MethodCard: React.FC<{ method: PaymentMethod }> = ({ method }) => {
    const { t } = useLanguage();
    const translatedName = t(method.key as any);
    const shortChar = method.label.charAt(0).toUpperCase();
    
    return (
        <div className="flex items-center gap-2 pl-1 pr-3 py-1.5 bg-background-secondary border border-brand-yellow/10 rounded-full hover:border-brand-yellow transition-colors cursor-pointer group min-w-fit snap-center shadow-sm">
            <div className="w-5 h-5 rounded-full bg-background-tertiary flex items-center justify-center border border-border-divider group-hover:border-brand-yellow/50 transition-colors">
                <span className="text-[9px] font-black text-brand-yellow leading-none">
                    {shortChar}
                </span>
            </div>
            <span className="text-[10px] font-bold text-text-primary whitespace-nowrap group-hover:text-brand-yellow transition-colors">
                {translatedName}
            </span>
        </div>
    );
};

export const GuestHero: React.FC = () => {
    const { t, detectedCountry, language } = useLanguage();
    const navigate = useNavigate();
    const { primaryColor } = useTheme();
    const { config, getPaymentMethodsByCountry } = useSiteConfig();
    
    const targetCountryCode = detectedCountry || 'LY'; 
    const isArabic = language === 'ar';
    const countryData = COUNTRIES.find(c => c.code === targetCountryCode) || COUNTRIES.find(c => c.code === 'LY')!;
    
    const displayCountryName = isArabic ? countryData.name_ar : countryData.name;
    const displayCurrency = countryData.currency;
    
    const appName = config?.appName || 'UbinPay';
    const appTagline = isArabic ? (config?.appTaglineAr || t('hero_tagline')) : (config?.appTagline || t('hero_tagline'));

    const relevantMethods = useMemo(() => {
        const apiMethods = getPaymentMethodsByCountry(targetCountryCode);
        if (apiMethods && apiMethods.length > 0) {
            return apiMethods.map(m => ({
                key: m.key,
                label: isArabic && m.labelAr ? m.labelAr : m.label,
                scope: m.scope as 'local' | 'global',
                countryCode: m.countryCode || undefined,
            }));
        }
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

                {/* Trust Badge */}
                <div className="mb-6 animate-fadeInDown flex items-center gap-2 bg-background-secondary/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border-divider/50 shadow-sm">
                    <ShieldCheck className={`w-4 h-4 ${primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green'}`} />
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        {t('hero_trusted')}
                    </span>
                </div>

                {/* Dynamic Headline */}
                <div className="mb-10 animate-fadeInDown relative"> 
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

                        {/* Secondary Stablecoins Row */}
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

                    <p className="text-text-secondary text-sm sm:text-base max-w-lg mx-auto leading-relaxed px-6 font-medium opacity-80">
                        {t('hero_description')}
                    </p>
                </div>

                {/* Live Stats Row */}
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
                    
                    <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0B0E11] to-transparent z-10 pointer-events-none"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0B0E11] to-transparent z-10 pointer-events-none"></div>

                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-3 px-4 items-center justify-start snap-x">
                            {relevantMethods.length > 0 ? (
                                relevantMethods.map(method => (
                                    <MethodCard key={method.key} method={method as PaymentMethod} />
                                ))
                            ) : (
                                <>
                                    <MethodCard method={{key: 'visa', label: 'Visa', scope: 'global'} as PaymentMethod} />
                                    <MethodCard method={{key: 'mastercard', label: 'Mastercard', scope: 'global'} as PaymentMethod} />
                                    <MethodCard method={{key: 'wise', label: 'Wise', scope: 'global'} as PaymentMethod} />
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

export default GuestHero;
