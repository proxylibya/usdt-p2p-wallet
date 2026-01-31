/**
 * 🌍 Universal Phone Number Utility
 * نظام موحد عالمي لمعالجة أرقام الهاتف
 * 
 * يقبل الصيغ التالية:
 * - +218912345678 (مع مفتاح الدولة)
 * - 00218912345678 (مع 00)
 * - 0912345678 (محلي مع صفر)
 * - 912345678 (محلي بدون صفر)
 * - 091 234 5678 (مع مسافات)
 * - 091-234-5678 (مع شرطات)
 * - (091) 234-5678 (مع أقواس)
 */

import { COUNTRIES, Country } from '../constants/countries';

export interface NormalizedPhone {
  /** الرقم الكامل بالصيغة الدولية: +218912345678 */
  full: string;
  /** مفتاح الدولة: +218 */
  dialCode: string;
  /** الرقم المحلي بدون مفتاح وبدون صفر: 912345678 */
  local: string;
  /** كود الدولة ISO: LY */
  countryCode: string;
  /** هل الرقم صالح */
  isValid: boolean;
  /** الدولة المكتشفة */
  country: Country | null;
}

/**
 * تنظيف الرقم من كل الرموز غير الرقمية
 */
export const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  // إزالة كل شيء عدا الأرقام وعلامة +
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
export const getCountryByDialCode = (dialCode: string): Country | null => {
  const clean = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return COUNTRIES
    .slice()
    .sort((a, b) => b.dial_code.length - a.dial_code.length)
    .find(c => clean.startsWith(c.dial_code)) || null;
};

/**
 * الحصول على الدولة من كود ISO
 */
export const getCountryByCode = (code: string): Country | null => {
  return COUNTRIES.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
};

/**
 * 🎯 الدالة الرئيسية: تطبيع رقم الهاتف
 * تحول أي صيغة إلى الصيغة الدولية الموحدة
 * 
 * @param phone - الرقم بأي صيغة
 * @param defaultCountryCode - كود الدولة الافتراضي (مثل 'LY')
 */
export const normalizePhoneNumber = (
  phone: string,
  defaultCountryCode: string = 'LY'
): NormalizedPhone => {
  const defaultCountry = getCountryByCode(defaultCountryCode) || COUNTRIES.find(c => c.code === 'LY')!;
  
  // نتيجة فارغة
  const emptyResult: NormalizedPhone = {
    full: '',
    dialCode: defaultCountry.dial_code,
    local: '',
    countryCode: defaultCountry.code,
    isValid: false,
    country: defaultCountry,
  };

  if (!phone || phone.trim() === '') return emptyResult;

  // تنظيف الرقم
  let cleaned = cleanPhoneNumber(phone.trim());

  // التعامل مع 00 في البداية (تحويل إلى +)
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }

  // إذا يبدأ بـ + فهو رقم دولي
  if (cleaned.startsWith('+')) {
    const country = getCountryByDialCode(cleaned);
    
    if (country) {
      const local = cleaned.substring(country.dial_code.length);
      // إزالة الصفر البادئ إن وجد
      const localClean = local.startsWith('0') ? local.substring(1) : local;
      
      return {
        full: country.dial_code + localClean,
        dialCode: country.dial_code,
        local: localClean,
        countryCode: country.code,
        isValid: localClean.length >= 7 && localClean.length <= 15,
        country,
      };
    }
    
    // مفتاح غير معروف
    const digits = digitsOnly(cleaned);
    return {
      full: '+' + digits,
      dialCode: '',
      local: digits,
      countryCode: 'UNKNOWN',
      isValid: false,
      country: null,
    };
  }

  // رقم محلي (بدون +)
  let localNumber = digitsOnly(cleaned);
  
  // إزالة الصفر البادئ
  if (localNumber.startsWith('0')) {
    localNumber = localNumber.substring(1);
  }

  // استخدام الدولة الافتراضية
  return {
    full: defaultCountry.dial_code + localNumber,
    dialCode: defaultCountry.dial_code,
    local: localNumber,
    countryCode: defaultCountry.code,
    isValid: localNumber.length >= 7 && localNumber.length <= 15,
    country: defaultCountry,
  };
};

/**
 * تنسيق الرقم للعرض
 * @param phone - الرقم
 * @param format - صيغة العرض
 */
export const formatPhoneDisplay = (
  phone: string,
  format: 'international' | 'local' | 'spaced' = 'international'
): string => {
  const normalized = normalizePhoneNumber(phone);
  
  if (!normalized.isValid) return phone;

  switch (format) {
    case 'local':
      return '0' + normalized.local;
    case 'spaced':
      // تنسيق مع مسافات: +218 91 234 5678
      const local = normalized.local;
      if (local.length >= 9) {
        return `${normalized.dialCode} ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
      }
      return `${normalized.dialCode} ${local}`;
    case 'international':
    default:
      return normalized.full;
  }
};

/**
 * مقارنة رقمين هاتف (بغض النظر عن الصيغة)
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

/**
 * استخراج معلومات الدولة من الرقم
 */
export const detectCountryFromPhone = (phone: string): Country | null => {
  const normalized = normalizePhoneNumber(phone);
  return normalized.country;
};

export default {
  normalizePhoneNumber,
  cleanPhoneNumber,
  digitsOnly,
  formatPhoneDisplay,
  comparePhoneNumbers,
  isValidPhoneNumber,
  detectCountryFromPhone,
  getCountryByDialCode,
  getCountryByCode,
};
