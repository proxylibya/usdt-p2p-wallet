/**
 * 🌍 Universal Phone Number Utility - Backend
 * نظام موحد عالمي لمعالجة أرقام الهاتف
 * يدعم جميع دول العالم مع كشف وتطبيع الأرقام تلقائياً
 */

export interface Country {
  code: string;           // ISO 3166-1 alpha-2 (LY, EG, SA)
  dialCode: string;       // International dial code (+218)
  minLength: number;      // Min digits after dial code
  maxLength: number;      // Max digits after dial code
  localPrefixes: string[]; // Local prefixes to strip (0, 00)
}

/**
 * 🌐 Complete Countries Database - Sorted by dial code length for matching
 */
const COUNTRIES: Country[] = [
  // Middle East & North Africa
  { code: 'LY', dialCode: '+218', minLength: 9, maxLength: 10, localPrefixes: ['0'] },
  { code: 'EG', dialCode: '+20', minLength: 10, maxLength: 11, localPrefixes: ['0'] },
  { code: 'SA', dialCode: '+966', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'AE', dialCode: '+971', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'KW', dialCode: '+965', minLength: 8, maxLength: 8, localPrefixes: [] },
  { code: 'QA', dialCode: '+974', minLength: 8, maxLength: 8, localPrefixes: [] },
  { code: 'BH', dialCode: '+973', minLength: 8, maxLength: 8, localPrefixes: [] },
  { code: 'OM', dialCode: '+968', minLength: 8, maxLength: 8, localPrefixes: [] },
  { code: 'JO', dialCode: '+962', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'LB', dialCode: '+961', minLength: 7, maxLength: 8, localPrefixes: ['0'] },
  { code: 'SY', dialCode: '+963', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'IQ', dialCode: '+964', minLength: 10, maxLength: 10, localPrefixes: ['0'] },
  { code: 'YE', dialCode: '+967', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'PS', dialCode: '+970', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'MA', dialCode: '+212', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'DZ', dialCode: '+213', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'TN', dialCode: '+216', minLength: 8, maxLength: 8, localPrefixes: [] },
  { code: 'SD', dialCode: '+249', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'MR', dialCode: '+222', minLength: 8, maxLength: 8, localPrefixes: [] },
  // Europe
  { code: 'GB', dialCode: '+44', minLength: 10, maxLength: 10, localPrefixes: ['0'] },
  { code: 'DE', dialCode: '+49', minLength: 10, maxLength: 11, localPrefixes: ['0'] },
  { code: 'FR', dialCode: '+33', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'IT', dialCode: '+39', minLength: 9, maxLength: 10, localPrefixes: [] },
  { code: 'ES', dialCode: '+34', minLength: 9, maxLength: 9, localPrefixes: [] },
  { code: 'NL', dialCode: '+31', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'BE', dialCode: '+32', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'CH', dialCode: '+41', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'AT', dialCode: '+43', minLength: 10, maxLength: 11, localPrefixes: ['0'] },
  { code: 'SE', dialCode: '+46', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'NO', dialCode: '+47', minLength: 8, maxLength: 8, localPrefixes: [] },
  { code: 'DK', dialCode: '+45', minLength: 8, maxLength: 8, localPrefixes: [] },
  { code: 'PL', dialCode: '+48', minLength: 9, maxLength: 9, localPrefixes: [] },
  { code: 'RU', dialCode: '+7', minLength: 10, maxLength: 10, localPrefixes: ['8'] },
  { code: 'TR', dialCode: '+90', minLength: 10, maxLength: 10, localPrefixes: ['0'] },
  { code: 'GR', dialCode: '+30', minLength: 10, maxLength: 10, localPrefixes: [] },
  { code: 'PT', dialCode: '+351', minLength: 9, maxLength: 9, localPrefixes: [] },
  // Americas
  { code: 'US', dialCode: '+1', minLength: 10, maxLength: 10, localPrefixes: ['1'] },
  { code: 'CA', dialCode: '+1', minLength: 10, maxLength: 10, localPrefixes: ['1'] },
  { code: 'MX', dialCode: '+52', minLength: 10, maxLength: 10, localPrefixes: ['01', '044', '045'] },
  { code: 'BR', dialCode: '+55', minLength: 10, maxLength: 11, localPrefixes: ['0'] },
  { code: 'AR', dialCode: '+54', minLength: 10, maxLength: 10, localPrefixes: ['0'] },
  // Asia
  { code: 'CN', dialCode: '+86', minLength: 11, maxLength: 11, localPrefixes: ['0'] },
  { code: 'IN', dialCode: '+91', minLength: 10, maxLength: 10, localPrefixes: ['0'] },
  { code: 'JP', dialCode: '+81', minLength: 10, maxLength: 10, localPrefixes: ['0'] },
  { code: 'KR', dialCode: '+82', minLength: 9, maxLength: 10, localPrefixes: ['0'] },
  { code: 'PK', dialCode: '+92', minLength: 10, maxLength: 10, localPrefixes: ['0'] },
  { code: 'BD', dialCode: '+880', minLength: 10, maxLength: 10, localPrefixes: ['0'] },
  { code: 'ID', dialCode: '+62', minLength: 9, maxLength: 12, localPrefixes: ['0'] },
  { code: 'MY', dialCode: '+60', minLength: 9, maxLength: 10, localPrefixes: ['0'] },
  { code: 'PH', dialCode: '+63', minLength: 10, maxLength: 10, localPrefixes: ['0'] },
  { code: 'TH', dialCode: '+66', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'VN', dialCode: '+84', minLength: 9, maxLength: 10, localPrefixes: ['0'] },
  { code: 'SG', dialCode: '+65', minLength: 8, maxLength: 8, localPrefixes: [] },
  // Africa
  { code: 'NG', dialCode: '+234', minLength: 10, maxLength: 10, localPrefixes: ['0'] },
  { code: 'ZA', dialCode: '+27', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'KE', dialCode: '+254', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'GH', dialCode: '+233', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  // Oceania
  { code: 'AU', dialCode: '+61', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
  { code: 'NZ', dialCode: '+64', minLength: 8, maxLength: 10, localPrefixes: ['0'] },
  // Default fallback
  { code: 'AF', dialCode: '+93', minLength: 9, maxLength: 9, localPrefixes: ['0'] },
];

export interface NormalizedPhone {
  full: string;
  dialCode: string;
  local: string;
  countryCode: string;
  isValid: boolean;
}

/**
 * تنظيف الرقم من كل الرموز غير الرقمية
 */
export const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
};

/**
 * استخراج الأرقام فقط
 */
export const digitsOnly = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

/**
 * الحصول على الدولة من كود الدولة
 */
export const getCountryByCode = (code: string): Country | null => {
  return COUNTRIES.find(c => c.code === code) || null;
};

/**
 * الحصول على الدولة من مفتاح الدولة
 */
export const getCountryByDialCode = (dialCode: string): Country | null => {
  const clean = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  // Sort by dial code length (longest first) for accurate matching
  return COUNTRIES
    .slice()
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find(c => clean.startsWith(c.dialCode)) || null;
};

/**
 * 🎯 الدالة الرئيسية: تطبيع رقم الهاتف
 * يحول أي صيغة إلى الصيغة الدولية الموحدة
 * مثال: 092XXXXXXX أو 0092XXXXXXX أو +21892XXXXXXX → +21892XXXXXXX
 */
export const normalizePhoneNumber = (
  phone: string,
  defaultCountryCode: string = 'LY'
): NormalizedPhone => {
  // Get default country (fallback to Libya)
  const defaultCountry = defaultCountryCode === 'GLOBAL' 
    ? null
    : (COUNTRIES.find(c => c.code === defaultCountryCode) || COUNTRIES.find(c => c.code === 'LY')!);

  const emptyResult: NormalizedPhone = {
    full: '',
    dialCode: defaultCountry?.dialCode || '',
    local: '',
    countryCode: defaultCountry?.code || 'UNKNOWN',
    isValid: false,
  };

  if (!phone || phone.trim() === '') return emptyResult;

  let cleaned = cleanPhoneNumber(phone.trim());

  // تحويل 00 إلى +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }

  // إذا يبدأ بـ + فهو رقم دولي
  if (cleaned.startsWith('+')) {
    const country = getCountryByDialCode(cleaned);
    
    if (country) {
      let local = cleaned.substring(country.dialCode.length);
      
      // Remove local prefixes (like leading 0)
      for (const prefix of country.localPrefixes) {
        if (local.startsWith(prefix)) {
          local = local.substring(prefix.length);
          break;
        }
      }
      
      const isValid = local.length >= country.minLength && local.length <= country.maxLength;
      
      return {
        full: country.dialCode + local,
        dialCode: country.dialCode,
        local,
        countryCode: country.code,
        isValid,
      };
    }
    
    // Unknown country - just clean it
    const digits = digitsOnly(cleaned);
    return {
      full: '+' + digits,
      dialCode: '',
      local: digits,
      countryCode: 'UNKNOWN',
      isValid: digits.length >= 7,
    };
  }

  // رقم محلي - استخدم الدولة الافتراضية
  if (!defaultCountry) {
    // GLOBAL mode but no country code provided
    return {
      ...emptyResult,
      full: cleaned,
      local: cleaned,
      isValid: false,
    };
  }

  let localNumber = digitsOnly(cleaned);
  
  // Remove local prefixes
  for (const prefix of defaultCountry.localPrefixes) {
    if (localNumber.startsWith(prefix)) {
      localNumber = localNumber.substring(prefix.length);
      break;
    }
  }

  const isValid = localNumber.length >= defaultCountry.minLength && 
                  localNumber.length <= defaultCountry.maxLength;

  return {
    full: defaultCountry.dialCode + localNumber,
    dialCode: defaultCountry.dialCode,
    local: localNumber,
    countryCode: defaultCountry.code,
    isValid,
  };
};

/**
 * مقارنة رقمين هاتف
 */
export const comparePhoneNumbers = (phone1: string, phone2: string): boolean => {
  const n1 = normalizePhoneNumber(phone1);
  const n2 = normalizePhoneNumber(phone2);
  return n1.full === n2.full;
};

/**
 * التحقق من صحة رقم الهاتف
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const normalized = normalizePhoneNumber(phone);
  return normalized.isValid;
};

export default {
  normalizePhoneNumber,
  cleanPhoneNumber,
  digitsOnly,
  comparePhoneNumbers,
  isValidPhoneNumber,
  getCountryByDialCode,
};
