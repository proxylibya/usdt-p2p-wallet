/**
 * 📋 Guest Steps Section - How it works section for non-authenticated users
 * Extracted from HomeScreen.tsx for better maintainability
 */

import React from 'react';
import { CreditCard, ArrowRightLeft, Smartphone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export const GuestSteps: React.FC = () => {
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

export default GuestSteps;
