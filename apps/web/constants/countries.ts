
export interface Country {
    name: string;
    name_ar: string;
    dial_code: string;
    code: string; // ISO 3166-1 alpha-2 code
    currency: string;
}

export const COUNTRIES: Country[] = [
    { name: 'Afghanistan', name_ar: 'أفغانستان', dial_code: '+93', code: 'AF', currency: 'AFN' },
    { name: 'Algeria', name_ar: 'الجزائر', dial_code: '+213', code: 'DZ', currency: 'DZD' },
    { name: 'Argentina', name_ar: 'الأرجنتين', dial_code: '+54', code: 'AR', currency: 'ARS' },
    { name: 'Australia', name_ar: 'أستراليا', dial_code: '+61', code: 'AU', currency: 'AUD' },
    { name: 'Austria', name_ar: 'النمسا', dial_code: '+43', code: 'AT', currency: 'EUR' },
    { name: 'Bahrain', name_ar: 'البحرين', dial_code: '+973', code: 'BH', currency: 'BHD' },
    { name: 'Belgium', name_ar: 'بلجيكا', dial_code: '+32', code: 'BE', currency: 'EUR' },
    { name: 'Brazil', name_ar: 'البرازيل', dial_code: '+55', code: 'BR', currency: 'BRL' },
    { name: 'Canada', name_ar: 'كندا', dial_code: '+1', code: 'CA', currency: 'CAD' },
    { name: 'China', name_ar: 'الصين', dial_code: '+86', code: 'CN', currency: 'CNY' },
    { name: 'Egypt', name_ar: 'مصر', dial_code: '+20', code: 'EG', currency: 'EGP' },
    { name: 'France', name_ar: 'فرنسا', dial_code: '+33', code: 'FR', currency: 'EUR' },
    { name: 'Germany', name_ar: 'ألمانيا', dial_code: '+49', code: 'DE', currency: 'EUR' },
    { name: 'India', name_ar: 'الهند', dial_code: '+91', code: 'IN', currency: 'INR' },
    { name: 'Iraq', name_ar: 'العراق', dial_code: '+964', code: 'IQ', currency: 'IQD' },
    { name: 'Italy', name_ar: 'إيطاليا', dial_code: '+39', code: 'IT', currency: 'EUR' },
    { name: 'Japan', name_ar: 'اليابان', dial_code: '+81', code: 'JP', currency: 'JPY' },
    { name: 'Jordan', name_ar: 'الأردن', dial_code: '+962', code: 'JO', currency: 'JOD' },
    { name: 'Kuwait', name_ar: 'الكويت', dial_code: '+965', code: 'KW', currency: 'KWD' },
    { name: 'Lebanon', name_ar: 'لبنان', dial_code: '+961', code: 'LB', currency: 'LBP' },
    { name: 'Libya', name_ar: 'ليبيا', dial_code: '+218', code: 'LY', currency: 'LYD' },
    { name: 'Morocco', name_ar: 'المغرب', dial_code: '+212', code: 'MA', currency: 'MAD' },
    { name: 'Netherlands', name_ar: 'هولندا', dial_code: '+31', code: 'NL', currency: 'EUR' },
    { name: 'Nigeria', name_ar: 'نيجيريا', dial_code: '+234', code: 'NG', currency: 'NGN' },
    { name: 'Oman', name_ar: 'سلطنة عمان', dial_code: '+968', code: 'OM', currency: 'OMR' },
    { name: 'Qatar', name_ar: 'قطر', dial_code: '+974', code: 'QA', currency: 'QAR' },
    { name: 'Russia', name_ar: 'روسيا', dial_code: '+7', code: 'RU', currency: 'RUB' },
    { name: 'Saudi Arabia', name_ar: 'المملكة العربية السعودية', dial_code: '+966', code: 'SA', currency: 'SAR' },
    { name: 'South Africa', name_ar: 'جنوب أفريقيا', dial_code: '+27', code: 'ZA', currency: 'ZAR' },
    { name: 'Spain', name_ar: 'إسبانيا', dial_code: '+34', code: 'ES', currency: 'EUR' },
    { name: 'Sudan', name_ar: 'السودان', dial_code: '+249', code: 'SD', currency: 'SDG' },
    { name: 'Switzerland', name_ar: 'سويسرا', dial_code: '+41', code: 'CH', currency: 'CHF' },
    { name: 'Syrian Arab Republic', name_ar: 'سوريا', dial_code: '+963', code: 'SY', currency: 'SYP' },
    { name: 'Tunisia', name_ar: 'تونس', dial_code: '+216', code: 'TN', currency: 'TND' },
    { name: 'Turkey', name_ar: 'تركيا', dial_code: '+90', code: 'TR', currency: 'TRY' },
    { name: 'United Arab Emirates', name_ar: 'الإمارات العربية المتحدة', dial_code: '+971', code: 'AE', currency: 'AED' },
    { name: 'United Kingdom', name_ar: 'المملكة المتحدة', dial_code: '+44', code: 'GB', currency: 'GBP' },
    { name: 'United States', name_ar: 'الولايات المتحدة', dial_code: '+1', code: 'US', currency: 'USD' },
    { name: 'Yemen', name_ar: 'اليمن', dial_code: '+967', code: 'YE', currency: 'YER' },
];
