
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { enTranslations, arTranslations } from '../constants/translations';

export type Language = 'en' | 'ar' | 'fr' | 'es' | 'tr';
export type Direction = 'ltr' | 'rtl';

const translations: Record<Language, typeof enTranslations> = {
    en: enTranslations,
    ar: arTranslations,
    fr: enTranslations,
    es: enTranslations,
    tr: enTranslations,
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof enTranslations, params?: Record<string, string | number>) => string;
    direction: Direction;
    detectedCountry: string | null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('language') as Language;
        if (saved && ['en', 'ar', 'fr', 'es', 'tr'].includes(saved)) {
            return saved;
        }
        return 'ar'; // Default fallback to Arabic
    });
    
    const [detectedCountry, setDetectedCountry] = useState<string | null>(localStorage.getItem('user_country'));

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const direction = useMemo((): Direction => {
        return language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    useEffect(() => {
        // Set the lang and dir attributes on the html tag.
        // Font switching is handled purely by CSS in index.html based on [lang="ar"]
        document.documentElement.dir = direction;
        document.documentElement.lang = language;
    }, [language, direction]);

    useEffect(() => {
        const savedCountry = localStorage.getItem('user_country');
        if (!savedCountry) {
            const fetchLocation = async () => {
                try {
                    let response = await fetch('https://ipapi.co/json/').catch(() => null);
                    let data = response && response.ok ? await response.json() : null;

                    if (!data || !data.country_code) {
                        response = await fetch('https://ipwho.is/').catch(() => null);
                        data = response && response.ok ? await response.json() : null;
                    }

                    if (data && data.country_code) {
                        const countryCode = data.country_code;
                        localStorage.setItem('user_country', countryCode);
                        setDetectedCountry(countryCode);
                        
                        if (!localStorage.getItem('language')) {
                            const arabCountries = ['SA', 'AE', 'EG', 'LY', 'TN', 'QA', 'BH', 'KW', 'OM', 'IQ', 'JO', 'LB', 'YE', 'SD', 'DZ', 'MA'];
                            if (arabCountries.includes(countryCode)) {
                                setLanguage('ar');
                            }
                        }
                    }
                } catch (error) {
                    console.debug("Geolocation detection unavailable.");
                }
            };
            fetchLocation();
        }
    }, []);

    const value = useMemo(() => {
        const t = (key: keyof typeof enTranslations, params?: Record<string, string | number>): string => {
            const currentDict = translations[language] || translations.en;
            let text = currentDict[key];

            if (!text) {
                text = translations.en[key] || key;
            }
            
            if (params) {
                Object.entries(params).forEach(([k, v]) => {
                    text = text.replace(`{{${k}}}`, String(v));
                });
            }
            return text;
        };

        return { language, setLanguage, t, direction, detectedCountry };
    }, [language, direction, detectedCountry]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
