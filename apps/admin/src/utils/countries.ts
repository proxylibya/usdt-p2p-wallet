/**
 * 🌍 Universal Countries & Phone System
 * نظام موحد عالمي للدول وأرقام الهاتف
 * يدعم جميع دول العالم مع الأعلام والمفاتيح وشركات الاتصال
 */

export interface Country {
  code: string;           // ISO 3166-1 alpha-2 (LY, EG, SA)
  name: string;           // English name
  nameAr: string;         // Arabic name
  dialCode: string;       // International dial code (+218)
  flag: string;           // Emoji flag 🇱🇾
  format: string;         // Phone format pattern
  minLength: number;      // Min digits after dial code
  maxLength: number;      // Max digits after dial code
  localPrefixes: string[]; // Local prefixes to strip (0, 00)
  mobileStartsWith: string[]; // Mobile number prefixes
}

/**
 * 🌐 Complete Countries Database
 * قاعدة بيانات شاملة للدول
 */
export const COUNTRIES: Country[] = [
  // ==================== Middle East & North Africa ====================
  {
    code: 'LY',
    name: 'Libya',
    nameAr: 'ليبيا',
    dialCode: '+218',
    flag: '🇱🇾',
    format: '+218 XX XXX XXXX',
    minLength: 9,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['91', '92', '93', '94', '95'],
  },
  {
    code: 'EG',
    name: 'Egypt',
    nameAr: 'مصر',
    dialCode: '+20',
    flag: '🇪🇬',
    format: '+20 XXX XXX XXXX',
    minLength: 10,
    maxLength: 11,
    localPrefixes: ['0'],
    mobileStartsWith: ['10', '11', '12', '15'],
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    nameAr: 'السعودية',
    dialCode: '+966',
    flag: '🇸🇦',
    format: '+966 5X XXX XXXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['50', '53', '54', '55', '56', '57', '58', '59'],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    nameAr: 'الإمارات',
    dialCode: '+971',
    flag: '🇦🇪',
    format: '+971 5X XXX XXXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['50', '52', '54', '55', '56', '58'],
  },
  {
    code: 'KW',
    name: 'Kuwait',
    nameAr: 'الكويت',
    dialCode: '+965',
    flag: '🇰🇼',
    format: '+965 XXXX XXXX',
    minLength: 8,
    maxLength: 8,
    localPrefixes: [],
    mobileStartsWith: ['5', '6', '9'],
  },
  {
    code: 'QA',
    name: 'Qatar',
    nameAr: 'قطر',
    dialCode: '+974',
    flag: '🇶🇦',
    format: '+974 XXXX XXXX',
    minLength: 8,
    maxLength: 8,
    localPrefixes: [],
    mobileStartsWith: ['3', '5', '6', '7'],
  },
  {
    code: 'BH',
    name: 'Bahrain',
    nameAr: 'البحرين',
    dialCode: '+973',
    flag: '🇧🇭',
    format: '+973 XXXX XXXX',
    minLength: 8,
    maxLength: 8,
    localPrefixes: [],
    mobileStartsWith: ['3', '6'],
  },
  {
    code: 'OM',
    name: 'Oman',
    nameAr: 'عُمان',
    dialCode: '+968',
    flag: '🇴🇲',
    format: '+968 XXXX XXXX',
    minLength: 8,
    maxLength: 8,
    localPrefixes: [],
    mobileStartsWith: ['9', '7'],
  },
  {
    code: 'JO',
    name: 'Jordan',
    nameAr: 'الأردن',
    dialCode: '+962',
    flag: '🇯🇴',
    format: '+962 7X XXX XXXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['77', '78', '79'],
  },
  {
    code: 'LB',
    name: 'Lebanon',
    nameAr: 'لبنان',
    dialCode: '+961',
    flag: '🇱🇧',
    format: '+961 XX XXX XXX',
    minLength: 7,
    maxLength: 8,
    localPrefixes: ['0'],
    mobileStartsWith: ['3', '70', '71', '76', '78', '79', '81'],
  },
  {
    code: 'SY',
    name: 'Syria',
    nameAr: 'سوريا',
    dialCode: '+963',
    flag: '🇸🇾',
    format: '+963 9XX XXX XXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['93', '94', '95', '96', '98', '99'],
  },
  {
    code: 'IQ',
    name: 'Iraq',
    nameAr: 'العراق',
    dialCode: '+964',
    flag: '🇮🇶',
    format: '+964 7XX XXX XXXX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['75', '77', '78', '79'],
  },
  {
    code: 'YE',
    name: 'Yemen',
    nameAr: 'اليمن',
    dialCode: '+967',
    flag: '🇾🇪',
    format: '+967 7XX XXX XXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['70', '71', '73', '77', '78'],
  },
  {
    code: 'PS',
    name: 'Palestine',
    nameAr: 'فلسطين',
    dialCode: '+970',
    flag: '🇵🇸',
    format: '+970 5X XXX XXXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['59'],
  },
  {
    code: 'MA',
    name: 'Morocco',
    nameAr: 'المغرب',
    dialCode: '+212',
    flag: '🇲🇦',
    format: '+212 6XX XXX XXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['6', '7'],
  },
  {
    code: 'DZ',
    name: 'Algeria',
    nameAr: 'الجزائر',
    dialCode: '+213',
    flag: '🇩🇿',
    format: '+213 XXX XX XX XX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['5', '6', '7'],
  },
  {
    code: 'TN',
    name: 'Tunisia',
    nameAr: 'تونس',
    dialCode: '+216',
    flag: '🇹🇳',
    format: '+216 XX XXX XXX',
    minLength: 8,
    maxLength: 8,
    localPrefixes: [],
    mobileStartsWith: ['2', '5', '9'],
  },
  {
    code: 'SD',
    name: 'Sudan',
    nameAr: 'السودان',
    dialCode: '+249',
    flag: '🇸🇩',
    format: '+249 9X XXX XXXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['91', '92', '93', '99'],
  },
  {
    code: 'MR',
    name: 'Mauritania',
    nameAr: 'موريتانيا',
    dialCode: '+222',
    flag: '🇲🇷',
    format: '+222 XX XX XX XX',
    minLength: 8,
    maxLength: 8,
    localPrefixes: [],
    mobileStartsWith: ['2', '3', '4'],
  },

  // ==================== Europe ====================
  {
    code: 'GB',
    name: 'United Kingdom',
    nameAr: 'المملكة المتحدة',
    dialCode: '+44',
    flag: '🇬🇧',
    format: '+44 7XXX XXX XXX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['7'],
  },
  {
    code: 'DE',
    name: 'Germany',
    nameAr: 'ألمانيا',
    dialCode: '+49',
    flag: '🇩🇪',
    format: '+49 1XX XXXX XXXX',
    minLength: 10,
    maxLength: 11,
    localPrefixes: ['0'],
    mobileStartsWith: ['15', '16', '17'],
  },
  {
    code: 'FR',
    name: 'France',
    nameAr: 'فرنسا',
    dialCode: '+33',
    flag: '🇫🇷',
    format: '+33 6 XX XX XX XX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['6', '7'],
  },
  {
    code: 'IT',
    name: 'Italy',
    nameAr: 'إيطاليا',
    dialCode: '+39',
    flag: '🇮🇹',
    format: '+39 3XX XXX XXXX',
    minLength: 9,
    maxLength: 10,
    localPrefixes: [],
    mobileStartsWith: ['3'],
  },
  {
    code: 'ES',
    name: 'Spain',
    nameAr: 'إسبانيا',
    dialCode: '+34',
    flag: '🇪🇸',
    format: '+34 6XX XXX XXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: [],
    mobileStartsWith: ['6', '7'],
  },
  {
    code: 'NL',
    name: 'Netherlands',
    nameAr: 'هولندا',
    dialCode: '+31',
    flag: '🇳🇱',
    format: '+31 6 XXXX XXXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['6'],
  },
  {
    code: 'BE',
    name: 'Belgium',
    nameAr: 'بلجيكا',
    dialCode: '+32',
    flag: '🇧🇪',
    format: '+32 4XX XX XX XX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['4'],
  },
  {
    code: 'CH',
    name: 'Switzerland',
    nameAr: 'سويسرا',
    dialCode: '+41',
    flag: '🇨🇭',
    format: '+41 7X XXX XX XX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['7'],
  },
  {
    code: 'AT',
    name: 'Austria',
    nameAr: 'النمسا',
    dialCode: '+43',
    flag: '🇦🇹',
    format: '+43 6XX XXX XXXX',
    minLength: 10,
    maxLength: 11,
    localPrefixes: ['0'],
    mobileStartsWith: ['6'],
  },
  {
    code: 'SE',
    name: 'Sweden',
    nameAr: 'السويد',
    dialCode: '+46',
    flag: '🇸🇪',
    format: '+46 7X XXX XX XX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['7'],
  },
  {
    code: 'NO',
    name: 'Norway',
    nameAr: 'النرويج',
    dialCode: '+47',
    flag: '🇳🇴',
    format: '+47 XXX XX XXX',
    minLength: 8,
    maxLength: 8,
    localPrefixes: [],
    mobileStartsWith: ['4', '9'],
  },
  {
    code: 'DK',
    name: 'Denmark',
    nameAr: 'الدنمارك',
    dialCode: '+45',
    flag: '🇩🇰',
    format: '+45 XX XX XX XX',
    minLength: 8,
    maxLength: 8,
    localPrefixes: [],
    mobileStartsWith: ['2', '3', '4', '5', '6', '7', '8', '9'],
  },
  {
    code: 'PL',
    name: 'Poland',
    nameAr: 'بولندا',
    dialCode: '+48',
    flag: '🇵🇱',
    format: '+48 XXX XXX XXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: [],
    mobileStartsWith: ['5', '6', '7', '8'],
  },
  {
    code: 'RU',
    name: 'Russia',
    nameAr: 'روسيا',
    dialCode: '+7',
    flag: '🇷🇺',
    format: '+7 9XX XXX XX XX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: ['8'],
    mobileStartsWith: ['9'],
  },
  {
    code: 'TR',
    name: 'Turkey',
    nameAr: 'تركيا',
    dialCode: '+90',
    flag: '🇹🇷',
    format: '+90 5XX XXX XX XX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['5'],
  },
  {
    code: 'GR',
    name: 'Greece',
    nameAr: 'اليونان',
    dialCode: '+30',
    flag: '🇬🇷',
    format: '+30 6XX XXX XXXX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: [],
    mobileStartsWith: ['6'],
  },
  {
    code: 'PT',
    name: 'Portugal',
    nameAr: 'البرتغال',
    dialCode: '+351',
    flag: '🇵🇹',
    format: '+351 9XX XXX XXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: [],
    mobileStartsWith: ['9'],
  },

  // ==================== Americas ====================
  {
    code: 'US',
    name: 'United States',
    nameAr: 'الولايات المتحدة',
    dialCode: '+1',
    flag: '🇺🇸',
    format: '+1 (XXX) XXX-XXXX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: ['1'],
    mobileStartsWith: ['2', '3', '4', '5', '6', '7', '8', '9'],
  },
  {
    code: 'CA',
    name: 'Canada',
    nameAr: 'كندا',
    dialCode: '+1',
    flag: '🇨🇦',
    format: '+1 (XXX) XXX-XXXX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: ['1'],
    mobileStartsWith: ['2', '3', '4', '5', '6', '7', '8', '9'],
  },
  {
    code: 'MX',
    name: 'Mexico',
    nameAr: 'المكسيك',
    dialCode: '+52',
    flag: '🇲🇽',
    format: '+52 1 XXX XXX XXXX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: ['01', '044', '045'],
    mobileStartsWith: ['1'],
  },
  {
    code: 'BR',
    name: 'Brazil',
    nameAr: 'البرازيل',
    dialCode: '+55',
    flag: '🇧🇷',
    format: '+55 XX 9XXXX XXXX',
    minLength: 10,
    maxLength: 11,
    localPrefixes: ['0'],
    mobileStartsWith: ['9'],
  },
  {
    code: 'AR',
    name: 'Argentina',
    nameAr: 'الأرجنتين',
    dialCode: '+54',
    flag: '🇦🇷',
    format: '+54 9 XX XXXX XXXX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['9'],
  },

  // ==================== Asia ====================
  {
    code: 'CN',
    name: 'China',
    nameAr: 'الصين',
    dialCode: '+86',
    flag: '🇨🇳',
    format: '+86 1XX XXXX XXXX',
    minLength: 11,
    maxLength: 11,
    localPrefixes: ['0'],
    mobileStartsWith: ['13', '14', '15', '16', '17', '18', '19'],
  },
  {
    code: 'IN',
    name: 'India',
    nameAr: 'الهند',
    dialCode: '+91',
    flag: '🇮🇳',
    format: '+91 XXXXX XXXXX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['6', '7', '8', '9'],
  },
  {
    code: 'JP',
    name: 'Japan',
    nameAr: 'اليابان',
    dialCode: '+81',
    flag: '🇯🇵',
    format: '+81 XX XXXX XXXX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['70', '80', '90'],
  },
  {
    code: 'KR',
    name: 'South Korea',
    nameAr: 'كوريا الجنوبية',
    dialCode: '+82',
    flag: '🇰🇷',
    format: '+82 1X XXXX XXXX',
    minLength: 9,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['10', '11', '16', '17', '18', '19'],
  },
  {
    code: 'PK',
    name: 'Pakistan',
    nameAr: 'باكستان',
    dialCode: '+92',
    flag: '🇵🇰',
    format: '+92 3XX XXX XXXX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['3'],
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    nameAr: 'بنغلاديش',
    dialCode: '+880',
    flag: '🇧🇩',
    format: '+880 1XXX XXX XXX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['1'],
  },
  {
    code: 'ID',
    name: 'Indonesia',
    nameAr: 'إندونيسيا',
    dialCode: '+62',
    flag: '🇮🇩',
    format: '+62 8XX XXX XXXX',
    minLength: 9,
    maxLength: 12,
    localPrefixes: ['0'],
    mobileStartsWith: ['8'],
  },
  {
    code: 'MY',
    name: 'Malaysia',
    nameAr: 'ماليزيا',
    dialCode: '+60',
    flag: '🇲🇾',
    format: '+60 1X XXX XXXX',
    minLength: 9,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['1'],
  },
  {
    code: 'PH',
    name: 'Philippines',
    nameAr: 'الفلبين',
    dialCode: '+63',
    flag: '🇵🇭',
    format: '+63 9XX XXX XXXX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['9'],
  },
  {
    code: 'TH',
    name: 'Thailand',
    nameAr: 'تايلاند',
    dialCode: '+66',
    flag: '🇹🇭',
    format: '+66 X XXXX XXXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['6', '8', '9'],
  },
  {
    code: 'VN',
    name: 'Vietnam',
    nameAr: 'فيتنام',
    dialCode: '+84',
    flag: '🇻🇳',
    format: '+84 XXX XXX XXX',
    minLength: 9,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['3', '5', '7', '8', '9'],
  },
  {
    code: 'SG',
    name: 'Singapore',
    nameAr: 'سنغافورة',
    dialCode: '+65',
    flag: '🇸🇬',
    format: '+65 XXXX XXXX',
    minLength: 8,
    maxLength: 8,
    localPrefixes: [],
    mobileStartsWith: ['8', '9'],
  },

  // ==================== Africa ====================
  {
    code: 'NG',
    name: 'Nigeria',
    nameAr: 'نيجيريا',
    dialCode: '+234',
    flag: '🇳🇬',
    format: '+234 XXX XXX XXXX',
    minLength: 10,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['70', '80', '81', '90', '91'],
  },
  {
    code: 'ZA',
    name: 'South Africa',
    nameAr: 'جنوب أفريقيا',
    dialCode: '+27',
    flag: '🇿🇦',
    format: '+27 XX XXX XXXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['6', '7', '8'],
  },
  {
    code: 'KE',
    name: 'Kenya',
    nameAr: 'كينيا',
    dialCode: '+254',
    flag: '🇰🇪',
    format: '+254 7XX XXX XXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['7', '1'],
  },
  {
    code: 'GH',
    name: 'Ghana',
    nameAr: 'غانا',
    dialCode: '+233',
    flag: '🇬🇭',
    format: '+233 XX XXX XXXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['2', '5'],
  },

  // ==================== Oceania ====================
  {
    code: 'AU',
    name: 'Australia',
    nameAr: 'أستراليا',
    dialCode: '+61',
    flag: '🇦🇺',
    format: '+61 4XX XXX XXX',
    minLength: 9,
    maxLength: 9,
    localPrefixes: ['0'],
    mobileStartsWith: ['4'],
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    nameAr: 'نيوزيلندا',
    dialCode: '+64',
    flag: '🇳🇿',
    format: '+64 2X XXX XXXX',
    minLength: 8,
    maxLength: 10,
    localPrefixes: ['0'],
    mobileStartsWith: ['2'],
  },
];

/**
 * 🔍 Get country by ISO code
 */
export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(c => c.code.toUpperCase() === code.toUpperCase());
};

/**
 * 🔍 Get country by dial code
 */
export const getCountryByDialCode = (dialCode: string): Country | undefined => {
  const normalized = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  // Sort by dialCode length descending to match longer codes first (e.g., +218 before +21)
  return COUNTRIES
    .slice()
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find(c => normalized.startsWith(c.dialCode));
};

/**
 * 🔍 Search countries by name
 */
export const searchCountries = (query: string): Country[] => {
  const q = query.toLowerCase().trim();
  if (!q) return COUNTRIES;
  return COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(q) ||
    c.nameAr.includes(q) ||
    c.code.toLowerCase().includes(q) ||
    c.dialCode.includes(q)
  );
};

/**
 * 📱 Normalize phone number
 * Handles all edge cases: 092, 92, +21892, 0021892, etc.
 */
export interface NormalizedPhone {
  full: string;           // Full international format: +218912345678
  display: string;        // Display format: +218 91 234 5678
  dialCode: string;       // Dial code: +218
  local: string;          // Local number without dial code: 912345678
  countryCode: string;    // ISO country code: LY
  country: Country | null; // Full country object
  isValid: boolean;       // Whether the number is valid
}

export const normalizePhoneNumber = (
  phone: string,
  defaultCountryCode: string = 'LY'
): NormalizedPhone => {
  const emptyResult: NormalizedPhone = {
    full: '',
    display: '',
    dialCode: '',
    local: '',
    countryCode: '',
    country: null,
    isValid: false,
  };

  if (!phone || phone.trim() === '') return emptyResult;

  // Clean the number
  let cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');
  
  // Convert 00 to +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }

  // If starts with +, it's international
  if (cleaned.startsWith('+')) {
    const country = getCountryByDialCode(cleaned);
    
    if (country) {
      let local = cleaned.substring(country.dialCode.length);
      
      // Remove leading zeros from local part
      while (local.startsWith('0')) {
        local = local.substring(1);
      }
      
      const full = country.dialCode + local;
      const isValid = local.length >= country.minLength && local.length <= country.maxLength;
      
      return {
        full,
        display: formatPhoneDisplay(country.dialCode, local),
        dialCode: country.dialCode,
        local,
        countryCode: country.code,
        country,
        isValid,
      };
    }
    
    // Unknown country
    const digits = cleaned.replace(/\D/g, '');
    return {
      ...emptyResult,
      full: '+' + digits,
      display: '+' + digits,
      local: digits,
    };
  }

  // Local number - use default country
  const defaultCountry = getCountryByCode(defaultCountryCode) || getCountryByCode('LY')!;
  let localNumber = cleaned.replace(/\D/g, '');
  
  // Remove local prefixes (like leading 0)
  for (const prefix of defaultCountry.localPrefixes) {
    if (localNumber.startsWith(prefix)) {
      localNumber = localNumber.substring(prefix.length);
      break;
    }
  }
  
  const full = defaultCountry.dialCode + localNumber;
  const isValid = localNumber.length >= defaultCountry.minLength && localNumber.length <= defaultCountry.maxLength;

  return {
    full,
    display: formatPhoneDisplay(defaultCountry.dialCode, localNumber),
    dialCode: defaultCountry.dialCode,
    local: localNumber,
    countryCode: defaultCountry.code,
    country: defaultCountry,
    isValid,
  };
};

/**
 * 📞 Format phone for display
 */
export const formatPhoneDisplay = (dialCode: string, local: string): string => {
  if (!local) return dialCode;
  
  // Simple formatting: split local into groups
  const groups: string[] = [];
  let remaining = local;
  
  // First group: 2-3 digits
  if (remaining.length > 0) {
    groups.push(remaining.substring(0, Math.min(2, remaining.length)));
    remaining = remaining.substring(Math.min(2, remaining.length));
  }
  
  // Remaining: groups of 3
  while (remaining.length > 0) {
    groups.push(remaining.substring(0, Math.min(3, remaining.length)));
    remaining = remaining.substring(Math.min(3, remaining.length));
  }
  
  return `${dialCode} ${groups.join(' ')}`;
};

/**
 * 🔄 Compare two phone numbers (handles duplicates like 092 vs 92)
 */
export const comparePhoneNumbers = (phone1: string, phone2: string, defaultCountry: string = 'LY'): boolean => {
  const n1 = normalizePhoneNumber(phone1, defaultCountry);
  const n2 = normalizePhoneNumber(phone2, defaultCountry);
  return n1.full === n2.full;
};

/**
 * ✅ Validate phone number
 */
export const isValidPhoneNumber = (phone: string, defaultCountry: string = 'LY'): boolean => {
  return normalizePhoneNumber(phone, defaultCountry).isValid;
};

/**
 * 🏳️ Get flag emoji for country code
 */
export const getCountryFlag = (countryCode: string): string => {
  const country = getCountryByCode(countryCode);
  return country?.flag || '🏳️';
};

/**
 * 📱 Parse phone and get country info
 */
export const parsePhone = (phone: string, defaultCountry: string = 'LY') => {
  const normalized = normalizePhoneNumber(phone, defaultCountry);
  return {
    ...normalized,
    flag: normalized.country?.flag || '🏳️',
    countryName: normalized.country?.name || 'Unknown',
    countryNameAr: normalized.country?.nameAr || 'غير معروف',
  };
};

export default {
  COUNTRIES,
  getCountryByCode,
  getCountryByDialCode,
  searchCountries,
  normalizePhoneNumber,
  formatPhoneDisplay,
  comparePhoneNumbers,
  isValidPhoneNumber,
  getCountryFlag,
  parsePhone,
};
