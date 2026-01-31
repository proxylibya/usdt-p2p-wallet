
import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';

export type Currency = 'USD' | 'EUR' | 'JPY' | 'GBP' | 'AED' | 'LYD' | 'SAR' | 'EGP' | 'TND' | 'DZD' | 'MAD' | 'IQD' | 'JOD' | 'KWD' | 'QAR' | 'BHD' | 'OMR' | 'TRY' | 'CNY' | 'INR';

// Fallback conversion rates relative to USD
// Can be enhanced with live rates from /market/parallel-rates API
const conversionRates: Record<string, number> = {
    USD: 1,
    EUR: 0.93,
    JPY: 157.25,
    GBP: 0.79,
    AED: 3.67,
    LYD: 7.12, // Black market rate simulation
    SAR: 3.75,
    EGP: 48.50,
    TND: 3.15,
    DZD: 134.5,
    MAD: 10.1,
    IQD: 1310,
    JOD: 0.71,
    KWD: 0.31,
    QAR: 3.64,
    BHD: 0.38,
    OMR: 0.38,
    TRY: 32.5,
    CNY: 7.24,
    INR: 83.5,
};

const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    JPY: '¥',
    GBP: '£',
    AED: 'د.إ',
    LYD: 'ل.د',
    SAR: 'ر.س',
    EGP: 'ج.م',
    TND: 'د.ت',
    DZD: 'د.ج',
    MAD: 'د.م',
    IQD: 'ع.د',
    JOD: 'د.ا',
    KWD: 'د.ك',
    QAR: 'ر.ق',
    BHD: 'د.ب',
    OMR: 'ر.ع',
    TRY: '₺',
    CNY: '¥',
    INR: '₹',
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (usdValue: number) => string;
  symbol: string;
  convertUsdToSelectedCurrency: (usdValue: number) => number;
  convertSelectedCurrencyToUsd: (value: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currency, setCurrency] = useState<Currency>('USD');

    const formatCurrency = useMemo(() => {
        return (usdValue: number) => {
            const rate = conversionRates[currency] || 1;
            const convertedValue = usdValue * rate;
            const symbol = currencySymbols[currency] || currency;
            
            try {
                return new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(convertedValue);
            } catch (e) {
                // Fallback for currencies not supported by Intl (or if generic)
                const formattedValue = convertedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                // RTL friendly formatting for Arab currencies
                if (['AED', 'LYD', 'SAR', 'EGP', 'TND', 'DZD', 'MAD', 'IQD', 'JOD', 'KWD', 'QAR', 'BHD', 'OMR'].includes(currency)) {
                    return `${formattedValue} ${symbol}`;
                }
                return `${symbol}${formattedValue}`;
            }
        };
    }, [currency]);
    
    const convertUsdToSelectedCurrency = (usdValue: number): number => {
        const rate = conversionRates[currency] || 1;
        return usdValue * rate;
    };

    const convertSelectedCurrencyToUsd = (value: number): number => {
        const rate = conversionRates[currency] || 1;
        return value / rate;
    };

    const value = useMemo(() => ({
        currency,
        setCurrency,
        formatCurrency,
        symbol: currencySymbols[currency] || '$',
        convertUsdToSelectedCurrency,
        convertSelectedCurrencyToUsd,
    }), [currency, formatCurrency, convertUsdToSelectedCurrency, convertSelectedCurrencyToUsd]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = (): CurrencyContextType => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
