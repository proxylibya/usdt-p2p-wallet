/**
 * 📱 PhoneDisplay Component
 * مكون لعرض رقم الهاتف مع علم الدولة والمفتاح
 */

import React from 'react';
import { parsePhone, type NormalizedPhone } from '../utils/countries';

interface PhoneDisplayProps {
  phone: string;
  defaultCountry?: string;
  showFlag?: boolean;
  showDialCode?: boolean;
  showCountryName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  direction?: 'ltr' | 'rtl';
  className?: string;
}

const PhoneDisplay: React.FC<PhoneDisplayProps> = ({
  phone,
  defaultCountry = 'LY',
  showFlag = true,
  showDialCode = true,
  showCountryName = false,
  size = 'md',
  direction = 'ltr',
  className = '',
}) => {
  const parsed = parsePhone(phone, defaultCountry);
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  const flagSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (!parsed.full) {
    return <span className="text-text-secondary">-</span>;
  }

  return (
    <div 
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} ${className}`}
      dir={direction}
    >
      {showFlag && (
        <span className={`${flagSizes[size]} leading-none`} title={parsed.countryName}>
          {parsed.flag}
        </span>
      )}
      <span className="font-mono text-text-primary whitespace-nowrap">
        {showDialCode ? parsed.display : parsed.local}
      </span>
      {showCountryName && parsed.country && (
        <span className="text-text-secondary text-xs">
          ({parsed.countryName})
        </span>
      )}
    </div>
  );
};

/**
 * 📊 PhoneCell Component for Tables
 * مكون مخصص للجداول يعرض الهاتف مع العلم والدولة
 */
interface PhoneCellProps {
  phone: string;
  defaultCountry?: string;
}

export const PhoneCell: React.FC<PhoneCellProps> = ({ phone, defaultCountry = 'LY' }) => {
  const parsed = parsePhone(phone, defaultCountry);
  
  if (!parsed.full) {
    return <span className="text-text-secondary">-</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg" title={`${parsed.countryName} (${parsed.countryNameAr})`}>
        {parsed.flag}
      </span>
      <div className="flex flex-col">
        <span className="font-mono text-text-primary text-sm">
          {parsed.display}
        </span>
        <span className="text-xs text-text-secondary">
          {parsed.countryName}
        </span>
      </div>
    </div>
  );
};

/**
 * 🏷️ PhoneBadge Component
 * شارة صغيرة لعرض الهاتف
 */
interface PhoneBadgeProps {
  phone: string;
  defaultCountry?: string;
}

export const PhoneBadge: React.FC<PhoneBadgeProps> = ({ phone, defaultCountry = 'LY' }) => {
  const parsed = parsePhone(phone, defaultCountry);
  
  if (!parsed.full) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-background-tertiary rounded-lg text-xs">
      <span>{parsed.flag}</span>
      <span className="font-mono">{parsed.dialCode}</span>
    </span>
  );
};

/**
 * 🌍 CountryFlag Component
 * مكون لعرض علم الدولة فقط
 */
interface CountryFlagProps {
  countryCode: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTooltip?: boolean;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ 
  countryCode, 
  size = 'md',
  showTooltip = true 
}) => {
  const { getCountryByCode } = require('../utils/countries');
  const country = getCountryByCode(countryCode);
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  if (!country) {
    return <span className={sizeClasses[size]}>🏳️</span>;
  }

  return (
    <span 
      className={sizeClasses[size]} 
      title={showTooltip ? `${country.name} (${country.nameAr})` : undefined}
    >
      {country.flag}
    </span>
  );
};

export default PhoneDisplay;
