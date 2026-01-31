/**
 * 🌍 Universal Phone Number Utility - Backend
 * نظام موحد عالمي لمعالجة أرقام الهاتف
 */

interface CountryDialCode {
  code: string;
  dialCode: string;
}

const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { code: 'AF', dialCode: '+93' },
  { code: 'DZ', dialCode: '+213' },
  { code: 'AR', dialCode: '+54' },
  { code: 'AU', dialCode: '+61' },
  { code: 'AT', dialCode: '+43' },
  { code: 'BH', dialCode: '+973' },
  { code: 'BE', dialCode: '+32' },
  { code: 'BR', dialCode: '+55' },
  { code: 'CA', dialCode: '+1' },
  { code: 'CN', dialCode: '+86' },
  { code: 'EG', dialCode: '+20' },
  { code: 'FR', dialCode: '+33' },
  { code: 'DE', dialCode: '+49' },
  { code: 'IN', dialCode: '+91' },
  { code: 'IQ', dialCode: '+964' },
  { code: 'IT', dialCode: '+39' },
  { code: 'JP', dialCode: '+81' },
  { code: 'JO', dialCode: '+962' },
  { code: 'KW', dialCode: '+965' },
  { code: 'LB', dialCode: '+961' },
  { code: 'LY', dialCode: '+218' },
  { code: 'MA', dialCode: '+212' },
  { code: 'NL', dialCode: '+31' },
  { code: 'NG', dialCode: '+234' },
  { code: 'OM', dialCode: '+968' },
  { code: 'QA', dialCode: '+974' },
  { code: 'RU', dialCode: '+7' },
  { code: 'SA', dialCode: '+966' },
  { code: 'ZA', dialCode: '+27' },
  { code: 'ES', dialCode: '+34' },
  { code: 'SD', dialCode: '+249' },
  { code: 'CH', dialCode: '+41' },
  { code: 'SY', dialCode: '+963' },
  { code: 'TN', dialCode: '+216' },
  { code: 'TR', dialCode: '+90' },
  { code: 'AE', dialCode: '+971' },
  { code: 'GB', dialCode: '+44' },
  { code: 'US', dialCode: '+1' },
  { code: 'YE', dialCode: '+967' },
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
 * الحصول على الدولة من مفتاح الدولة
 */
export const getCountryByDialCode = (dialCode: string): CountryDialCode | null => {
  const clean = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return COUNTRY_DIAL_CODES
    .slice()
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find(c => clean.startsWith(c.dialCode)) || null;
};

/**
 * 🎯 الدالة الرئيسية: تطبيع رقم الهاتف
 */
export const normalizePhoneNumber = (
  phone: string,
  defaultCountryCode: string = 'LY'
): NormalizedPhone => {
  const defaultCountry = COUNTRY_DIAL_CODES.find(c => c.code === defaultCountryCode) 
    || COUNTRY_DIAL_CODES.find(c => c.code === 'LY')!;

  const emptyResult: NormalizedPhone = {
    full: '',
    dialCode: defaultCountry.dialCode,
    local: '',
    countryCode: defaultCountry.code,
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
      if (local.startsWith('0')) {
        local = local.substring(1);
      }
      
      return {
        full: country.dialCode + local,
        dialCode: country.dialCode,
        local,
        countryCode: country.code,
        isValid: local.length >= 7 && local.length <= 15,
      };
    }
    
    const digits = digitsOnly(cleaned);
    return {
      full: '+' + digits,
      dialCode: '',
      local: digits,
      countryCode: 'UNKNOWN',
      isValid: false,
    };
  }

  // رقم محلي
  let localNumber = digitsOnly(cleaned);
  
  if (localNumber.startsWith('0')) {
    localNumber = localNumber.substring(1);
  }

  return {
    full: defaultCountry.dialCode + localNumber,
    dialCode: defaultCountry.dialCode,
    local: localNumber,
    countryCode: defaultCountry.code,
    isValid: localNumber.length >= 7 && localNumber.length <= 15,
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
