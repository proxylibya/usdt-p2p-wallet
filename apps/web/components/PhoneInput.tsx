import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Country, COUNTRIES } from '../constants/countries';
import { CountrySelectModal } from './CountrySelectModal';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Flag } from './Flag';
import { normalizePhoneNumber, digitsOnly } from '../utils/phoneUtils';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    defaultCountry?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ 
    value, 
    onChange,
    defaultCountry = 'LY'
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [localInput, setLocalInput] = useState('');
    const { primaryColor } = useTheme();
    const { language } = useLanguage();
    const isRtl = language === 'ar';

    // تطبيع القيمة الواردة واستخراج الدولة
    const normalized = useMemo(() => {
        return normalizePhoneNumber(value, defaultCountry);
    }, [value, defaultCountry]);

    const selectedCountry = useMemo(() => {
        return normalized.country || COUNTRIES.find(c => c.code === defaultCountry)!;
    }, [normalized.country, defaultCountry]);

    // مزامنة الإدخال المحلي مع القيمة
    useEffect(() => {
        setLocalInput(normalized.local);
    }, [normalized.local]);

    const handleSelectCountry = useCallback((country: Country) => {
        const newFull = country.dial_code + normalized.local;
        onChange(newFull);
        setIsModalOpen(false);
    }, [normalized.local, onChange]);

    // معالجة الإدخال الذكية
    const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const rawInput = e.target.value;
        
        // إذا لصق المستخدم رقم كامل مع مفتاح دولة
        if (rawInput.includes('+') || rawInput.startsWith('00')) {
            const norm = normalizePhoneNumber(rawInput, defaultCountry);
            setLocalInput(norm.local);
            onChange(norm.full);
            return;
        }

        // إدخال عادي - استخراج الأرقام فقط
        let digits = digitsOnly(rawInput);
        
        // إزالة الصفر البادئ تلقائياً
        if (digits.startsWith('0')) {
            digits = digits.substring(1);
        }

        setLocalInput(digits);
        onChange(selectedCountry.dial_code + digits);
    }, [selectedCountry.dial_code, defaultCountry, onChange]);

    // معالجة اللصق
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasted = e.clipboardData.getData('text');
        
        // إذا كان النص الملصق يحتوي على مفتاح دولة
        if (pasted.includes('+') || pasted.startsWith('00') || pasted.startsWith('0')) {
            e.preventDefault();
            const norm = normalizePhoneNumber(pasted, defaultCountry);
            setLocalInput(norm.local);
            onChange(norm.full);
        }
    }, [defaultCountry, onChange]);

    return (
        <>
            <div
                className="relative flex items-center w-full bg-background-secondary border border-border-divider rounded-xl focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-background-primary transition-shadow overflow-hidden"
                style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                dir="ltr" 
            >
                {/* 
                   We intentionally keep the container LTR because phone numbers 
                   format is universally LTR (e.g. +218 91...). 
                   For Arabic UI, users expect the country code on the left 
                   followed by the number to the right.
                */}
                
                {/* Country Selector */}
                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 p-4 flex-shrink-0 hover:bg-background-tertiary/50 transition-colors min-w-fit ps-4 pe-2"
                >
                    <Flag code={selectedCountry.code} className="w-6 h-4 rounded-sm object-cover shadow-sm" />
                    <span className="text-text-secondary font-medium text-sm">{selectedCountry.dial_code}</span>
                    <ChevronDown className="w-4 h-4 text-text-secondary" />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-border-divider self-center flex-shrink-0"></div>

                {/* Input Field */}
                <input
                    type="tel"
                    placeholder="9X XXX XXXX"
                    value={localInput}
                    onChange={handleNumberChange}
                    onPaste={handlePaste}
                    // Always LTR text for phone numbers to prevent cursor jumping issues
                    className={`bg-transparent w-full p-4 focus:outline-none text-text-primary font-medium h-full flex-grow ${isRtl ? 'text-right placeholder:text-right' : 'text-left placeholder:text-left'} text-sm`}
                />
            </div>
            <CountrySelectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleSelectCountry}
            />
        </>
    );
};
