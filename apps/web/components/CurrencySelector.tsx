
import React, { useState, useMemo } from 'react';
import { useCurrency, Currency } from '../context/CurrencyContext';
import { DollarSign, Search, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Modal } from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { SettingsItem } from './SettingsItem';

const currencies: { code: Currency; name: string }[] = [
    { code: 'USD', name: 'United States Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'AED', name: 'United Arab Emirates Dirham' },
    { code: 'SAR', name: 'Saudi Riyal' },
    { code: 'QAR', name: 'Qatari Riyal' },
    { code: 'KWD', name: 'Kuwaiti Dinar' },
    { code: 'BHD', name: 'Bahraini Dinar' },
    { code: 'OMR', name: 'Omani Rial' },
    { code: 'JOD', name: 'Jordanian Dinar' },
    { code: 'LYD', name: 'Libyan Dinar' },
    { code: 'EGP', name: 'Egyptian Pound' },
    { code: 'TND', name: 'Tunisian Dinar' },
    { code: 'DZD', name: 'Algerian Dinar' },
    { code: 'MAD', name: 'Moroccan Dirham' },
    { code: 'IQD', name: 'Iraqi Dinar' },
    { code: 'TRY', name: 'Turkish Lira' },
    { code: 'INR', name: 'Indian Rupee' },
];

export const CurrencySelector: React.FC = () => {
    const { currency, setCurrency } = useCurrency();
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { updateUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCurrencies = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return currencies.filter(c => 
            c.name.toLowerCase().includes(term) || 
            c.code.toLowerCase().includes(term)
        );
    }, [searchTerm]);

    const handleSelect = (code: Currency) => {
        setCurrency(code);
        updateUser({ preferredCurrency: code });
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <>
            <SettingsItem 
                icon={DollarSign}
                label={t('currency')}
                value={currency}
                onClick={() => setIsOpen(true)}
            />

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={t('currency')}>
                <div className="flex flex-col h-[60vh]">
                    <div className="relative mb-4 flex-shrink-0">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search currency..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 ps-10 focus:outline-none focus:border-brand-yellow transition-colors"
                            style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                        />
                    </div>
                    
                    <div className="flex-grow overflow-y-auto space-y-2">
                        {filteredCurrencies.length > 0 ? (
                            filteredCurrencies.map((curr) => (
                                <button
                                    key={curr.code}
                                    onClick={() => handleSelect(curr.code)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors border ${currency === curr.code ? `bg-${primaryColor}/10 border-${primaryColor}` : 'bg-background-tertiary border-transparent hover:bg-border-divider'}`}
                                >
                                    <div className="flex flex-col text-start">
                                        <span className={`font-bold text-base ${currency === curr.code ? `text-${primaryColor}` : 'text-text-primary'}`}>
                                            {curr.code}
                                        </span>
                                        <span className="text-xs text-text-secondary">{curr.name}</span>
                                    </div>
                                    {currency === curr.code && (
                                        <div className={`w-6 h-6 rounded-full bg-${primaryColor} flex items-center justify-center text-background-primary`}>
                                            <Check className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-8 text-text-secondary">
                                No currencies found
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
};
