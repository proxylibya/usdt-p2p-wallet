
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency, Currency } from '../context/CurrencyContext';

export const UserPreferenceSync: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const { language, setLanguage } = useLanguage();
    const { currency, setCurrency } = useCurrency();

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.preferredLanguage && user.preferredLanguage !== language) {
                setLanguage(user.preferredLanguage as any);
            }
            if (user.preferredCurrency && user.preferredCurrency !== currency) {
                setCurrency(user.preferredCurrency as Currency);
            }
        }
    }, [isAuthenticated, user?.preferredLanguage, user?.preferredCurrency]);

    return null;
};
