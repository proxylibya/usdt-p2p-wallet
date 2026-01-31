
import React from 'react';
import { Smartphone, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface AuthMethodTabsProps {
    activeMethod: 'phone' | 'email';
    onChange: (method: 'phone' | 'email') => void;
}

export const AuthMethodTabs: React.FC<AuthMethodTabsProps> = ({ activeMethod, onChange }) => {
    const { primaryColor } = useTheme();
    const { t } = useLanguage();

    return (
        <div className="flex bg-background-secondary p-1 rounded-xl mb-6 border border-border-divider/50">
            <button 
                type="button"
                onClick={() => onChange('phone')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${activeMethod === 'phone' ? `bg-background-tertiary text-${primaryColor} shadow-sm` : 'text-text-secondary hover:text-text-primary'}`}
            >
                <Smartphone className="w-4 h-4" />
                {t('phone')}
            </button>
            <button 
                type="button"
                onClick={() => onChange('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${activeMethod === 'email' ? `bg-background-tertiary text-${primaryColor} shadow-sm` : 'text-text-secondary hover:text-text-primary'}`}
            >
                <Mail className="w-4 h-4" />
                {t('email')}
            </button>
        </div>
    );
};
