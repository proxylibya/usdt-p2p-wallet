
import React, { useState } from 'react';
import { useLanguage, Language } from '../context/LanguageContext';
import { Globe, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Modal } from './Modal';
import { useAuth } from '../context/AuthContext';
import { SettingsItem } from './SettingsItem';
import { Flag } from './Flag';

const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'tr', name: 'Turkish', native: 'Türkçe' },
];

const LANG_FLAGS: Record<string, string> = {
    en: 'US',
    ar: 'SA',
    fr: 'FR',
    es: 'ES',
    tr: 'TR',
};

export const LanguageSelector: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const { primaryColor } = useTheme();
    const { updateUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const selectedLang = languages.find(l => l.code === language) || languages[0];

    const handleSelect = (code: string) => {
        const newLang = code as Language;
        setLanguage(newLang);
        updateUser({ preferredLanguage: newLang });
        setIsOpen(false);
    };

    return (
        <>
            <SettingsItem 
                icon={Globe}
                label={t('language')}
                value={selectedLang.native}
                onClick={() => setIsOpen(true)}
            />

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={t('language')}>
                <div className="space-y-3">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleSelect(lang.code)}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 border ${language === lang.code ? `bg-${primaryColor}/10 border-${primaryColor}/50 shadow-sm` : 'bg-background-tertiary/50 border-transparent hover:bg-background-tertiary'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-border-divider/50 shadow-sm shrink-0">
                                    <Flag code={LANG_FLAGS[lang.code] || 'US'} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className={`font-bold text-sm ${language === lang.code ? `text-${primaryColor}` : 'text-text-primary'}`}>
                                        {lang.native}
                                    </span>
                                    <span className="text-xs text-text-secondary font-medium">{lang.name}</span>
                                </div>
                            </div>
                            
                            {language === lang.code && (
                                <div className={`w-6 h-6 rounded-full bg-${primaryColor} flex items-center justify-center text-background-primary shadow-md`}>
                                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </Modal>
        </>
    );
};
