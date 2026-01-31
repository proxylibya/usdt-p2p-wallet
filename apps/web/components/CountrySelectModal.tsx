
import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Country, COUNTRIES } from '../constants/countries';
import { Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Flag } from './Flag';

interface CountrySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
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

export const CountrySelectModal: React.FC<CountrySelectModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useLanguage();

    const filteredCountries = useMemo(() => {
        const normalizedSearch = normalizeText(searchTerm);
        return COUNTRIES.filter(country =>
            normalizeText(country.name).includes(normalizedSearch) ||
            normalizeText(country.name_ar).includes(normalizedSearch) ||
            country.dial_code.includes(normalizedSearch)
        );
    }, [searchTerm]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('select_country')}>
            <div className="flex flex-col h-[50vh]">
                <div className="relative mb-4">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                        type="text"
                        placeholder={t('search_country_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 ps-10 focus:outline-none text-text-primary"
                    />
                </div>
                <div className="flex-grow overflow-y-auto">
                    {filteredCountries.length > 0 ? (
                        <div className="space-y-1">
                            {filteredCountries.map(country => (
                                <button key={country.code} onClick={() => onSelect(country)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-background-tertiary transition-colors text-start">
                                    <Flag code={country.code} className="w-8 h-6 rounded-sm object-cover flex-shrink-0 shadow-sm" />
                                    <span className="font-medium text-text-primary flex-grow">
                                        {country.name_ar} - {country.name}
                                    </span>
                                    <span className="text-text-secondary font-mono" dir="ltr">{country.dial_code}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-text-secondary">
                            <p>{t('no_countries_found')}</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
