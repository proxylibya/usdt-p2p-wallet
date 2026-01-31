
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Globe, LockOpen, Zap, X, ArrowRight, ArrowLeft, Percent } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const OnboardingFlow: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState(0);
    const { primaryColor } = useTheme();
    const { t, language } = useLanguage();

    useEffect(() => {
        // v4 key to reset state for user testing
        const hasSeen = localStorage.getItem('usdt_wallet_onboarding_seen_v4');
        if (!hasSeen) {
            const timer = setTimeout(() => setIsVisible(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('usdt_wallet_onboarding_seen_v4', 'true');
    };

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(prev => prev + 1);
        } else {
            handleDismiss();
        }
    };

    const steps = [
        {
            icon: Globe,
            title: t('onboarding_title_1'),
            description: t('onboarding_desc_1'),
            iconColor: 'text-blue-400',
            glowColor: 'bg-blue-500/20'
        },
        {
            icon: LockOpen,
            title: t('onboarding_title_2'),
            description: t('onboarding_desc_2'),
            iconColor: 'text-success',
            glowColor: 'bg-success/20'
        },
        {
            icon: Percent, 
            title: t('onboarding_title_3'),
            description: t('onboarding_desc_3'),
            iconColor: `text-${primaryColor}`,
            glowColor: `bg-${primaryColor}/20`
        }
    ];

    if (!isVisible) return null;

    const CurrentStep = steps[step];
    const Icon = CurrentStep.icon;
    const isRTL = language === 'ar';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
            {/* Main Card - Ultra Compact & Premium */}
            <div className="w-full max-w-xs relative bg-[#1E2026]/90 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col animate-fadeInUp ring-1 ring-white/5">
                
                {/* Decorative Background Blob - Subtle */}
                <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 ${CurrentStep.glowColor} rounded-full blur-[60px] transition-colors duration-700 pointer-events-none opacity-40`}></div>

                {/* Dismiss Button */}
                <button 
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 z-20 p-1.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-white/5 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Content Area */}
                <div className="px-6 pt-6 pb-2 flex flex-col items-center text-center flex-1 relative z-10">
                    
                    {/* Animated Icon Container - Compact */}
                    <div className="mb-3 relative group">
                        <div className={`absolute inset-0 ${CurrentStep.glowColor} rounded-2xl blur-md animate-pulse opacity-50`}></div>
                        <div className="relative w-12 h-12 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/5 shadow-lg transform transition-transform duration-500 group-hover:scale-105">
                            <Icon className={`w-6 h-6 transition-all duration-500 transform ${CurrentStep.iconColor}`} strokeWidth={2.5} />
                        </div>
                    </div>

                    {/* Text Content - Very Tight Spacing */}
                    <div className="space-y-1 mb-4 flex flex-col justify-center min-h-[60px]">
                        <h2 key={step + '-title'} className="text-base font-black text-text-primary leading-tight tracking-tight animate-fadeInDown">
                            {CurrentStep.title}
                        </h2>
                        <p key={step + '-desc'} className="text-[11px] text-text-secondary leading-snug font-medium animate-fadeInUp px-1 opacity-90">
                            {CurrentStep.description}
                        </p>
                    </div>

                    {/* Dash Indicators */}
                    <div className="flex gap-1.5 mb-2">
                        {steps.map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1 rounded-full transition-all duration-500 ${i === step ? `w-5 bg-${primaryColor}` : 'w-1.5 bg-white/10'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Bottom Action Area */}
                <div className="p-4 pt-0 pb-4 bg-transparent relative z-10">
                    <button 
                        onClick={handleNext}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs text-background-primary bg-${primaryColor} flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg hover:brightness-110 group relative overflow-hidden`}
                    >
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
                        <span className="relative z-10 uppercase tracking-wider">{step === steps.length - 1 ? t('get_started') : t('next')}</span>
                        {isRTL ? (
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform relative z-10" />
                        ) : (
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform relative z-10" />
                        )}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};
