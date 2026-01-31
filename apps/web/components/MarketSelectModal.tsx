
import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Country, COUNTRIES } from '../constants/countries';
import { Search, Globe, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Flag } from './Flag';

interface MarketSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (country: Country | null) => void; // null = Global
    currentCode: string;
}

// Helper for robust Arabic search
const normalizeText = (text: string) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[\u0622\u0623\u0625\u0671\u0672\u0673\u0675]/g, 'ا') // Normalizing Alef variations to bare Alef
        .replace(/[\u0629]/g, 'ه') // Normalizing Taa Marbuta to Ha
        .replace(/[\u0649]/g, 'ي'); // Normalizing Alef Maqsura to Ya
};

export const MarketSelectModal: React.FC<MarketSelectModalProps> = ({ isOpen, onClose, onSelect, currentCode }) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const { primaryColor } = useTheme();

    const filteredCountries = useMemo(() => {
        const normalizedSearch = normalizeText(searchTerm);
        return COUNTRIES.filter(c => 
            normalizeText(c.name).includes(normalizedSearch) || 
            normalizeText(c.name_ar).includes(normalizedSearch) || 
            c.currency.toLowerCase().includes(normalizedSearch)
        );
    }, [searchTerm]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('select_country')}>
            <div className="flex flex-col max-h-[50vh] h-auto min-h-[300px]">
                 <div className="relative mb-4 flex-shrink-0">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                        type="text"
                        placeholder={t('search_country_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 ps-10 focus:outline-none text-text-primary"
                    />
                </div>

                <div className="flex-grow overflow-y-auto space-y-1">
                    {/* Global Option */}
                    <button 
                        onClick={() => onSelect(null)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-background-tertiary transition-colors ${currentCode === 'GLOBAL' ? 'bg-background-tertiary' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <Globe className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="text-start">
                                <p className="font-bold text-text-primary">Global Market</p>
                                <p className="text-xs text-text-secondary">USD (Universal)</p>
                            </div>
                        </div>
                        {currentCode === 'GLOBAL' && <Check className={`w-5 h-5 ${primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'}`} />}
                    </button>
                    
                    <hr className="border-border-divider/50 my-1" />

                    {filteredCountries.length > 0 ? filteredCountries.map(country => (
                         <button 
                            key={country.code} 
                            onClick={() => onSelect(country)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-background-tertiary transition-colors ${currentCode === country.code ? 'bg-background-tertiary' : ''}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Flag code={country.code} className="w-8 h-6 rounded-sm object-cover shadow-sm flex-shrink-0" />
                                <div className="text-start truncate">
                                    <p className="font-bold text-text-primary truncate">
                                        {country.name_ar} - {country.name}
                                    </p>
                                    <p className="text-xs text-text-secondary">{country.currency} ({country.code})</p>
                                </div>
                            </div>
                            {currentCode === country.code && <Check className={`w-5 h-5 flex-shrink-0 ${primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'}`} />}
                        </button>
                    )) : (
                        <div className="text-center py-4 text-text-secondary text-sm">
                            {t('no_countries_found')}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
