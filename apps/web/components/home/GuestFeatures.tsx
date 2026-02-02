/**
 * ✨ Guest Features Section - Feature highlights for non-authenticated users
 * Extracted from HomeScreen.tsx for better maintainability
 */

import React from 'react';
import { Smartphone, Globe, Layers, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export const GuestFeatures: React.FC = () => {
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

export default GuestFeatures;
