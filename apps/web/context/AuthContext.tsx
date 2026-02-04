import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { KYCStatus } from '../types';
import { COUNTRIES } from '../constants/countries';
import { Currency } from './CurrencyContext';
import { authService, TokenManager } from '../services';

interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  kycStatus: KYCStatus;
  countryCode: string; // e.g. 'SA', 'LY', 'US'
  preferredCurrency: Currency;
  preferredLanguage: string; // 'ar', 'en', etc.
  hasSecurityQuestions?: boolean;
  isEmailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isBiometricEnabled: boolean;
  setupBiometrics: () => void;
  login: (phone: string, password: string) => Promise<'direct' | 'otp' | null>;
  loginWithSocial: (provider: 'google' | 'apple', token: string) => Promise<boolean>;
  requestRegistrationOtp: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  verifyLoginOtp: (otp: string) => Promise<boolean>;
  verifyRegistrationAndLogin: (otp: string) => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  updateKycStatus: (status: KYCStatus) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'usdt_wallet_user_session';
const STORAGE_KEY_BIO = 'usdt_wallet_biometric_enabled';
const STORAGE_KEY_SECURE_ENCLAVE = 'usdt_wallet_secure_enclave_user_blob';
const STORAGE_KEY_PENDING_PHONE = 'usdt_wallet_pending_phone';

const safeLocalStorageSet = (key: string, value: string): boolean => {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
};

// Keys to clear on logout to ensure data privacy between sessions
const SENSITIVE_KEYS = [
    'usdt_wallet_wallets',
    'usdt_wallet_transactions',
    'usdt_wallet_funding_wallets',
    'usdt_wallet_active_trades',
    'usdt_wallet_p2p_offers',
    'usdt_wallet_address_book',
    'usdt_wallet_notifications'
];

// Helper to derive user context from phone number
const deriveUserContext = (phone: string) => {
    const country = COUNTRIES.slice().sort((a, b) => b.dial_code.length - a.dial_code.length).find(c => phone.startsWith(c.dial_code));
    
    const countryCode = country ? country.code : 'GLOBAL';
    // Default currency logic: Use the country's currency if available, else USD
    let preferredCurrency: Currency = (country?.currency as Currency) || 'USD';
    let preferredLanguage = 'en';

    if (country) {
         // Default language based on region (simplified logic)
         const arabCountries = ['SA', 'AE', 'EG', 'LY', 'TN', 'QA', 'BH', 'KW', 'OM', 'IQ', 'JO', 'LB', 'YE', 'SD', 'DZ', 'MA'];
         if (arabCountries.includes(country.code)) {
             preferredLanguage = 'ar';
         }
    }

    return { countryCode, preferredCurrency, preferredLanguage };
};

const mapKycStatus = (status?: string): KYCStatus => {
    switch (status) {
        case 'VERIFIED':
        case KYCStatus.VERIFIED:
            return KYCStatus.VERIFIED;
        case 'PENDING':
        case KYCStatus.PENDING:
            return KYCStatus.PENDING;
        case 'REJECTED':
        case KYCStatus.REJECTED:
            return KYCStatus.REJECTED;
        default:
            return KYCStatus.NOT_VERIFIED;
    }
};

const buildUserFromApi = (userData: any, fallbackPhone?: string): User => {
    const phone = userData?.phone || fallbackPhone || '';
    const { countryCode, preferredCurrency, preferredLanguage } = deriveUserContext(phone);

    return {
        id: userData.id,
        name: userData.name || 'User',
        email: userData.email || '',
        phoneNumber: phone,
        avatarUrl: userData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random`,
        kycStatus: mapKycStatus(userData.kycStatus),
        countryCode: userData.countryCode || countryCode,
        preferredCurrency: (userData.preferredCurrency as Currency) || preferredCurrency,
        preferredLanguage: userData.preferredLanguage || preferredLanguage,
        hasSecurityQuestions: false,
        isEmailVerified: Boolean(userData.isEmailVerified ?? userData.email),
    };
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize from Local Storage
  const [user, setUser] = useState<User | null>(() => {
      try {
          const saved = localStorage.getItem(STORAGE_KEY_USER);
          return saved ? JSON.parse(saved) : null;
      } catch {
          return null;
      }
  });

  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(() => {
      return localStorage.getItem(STORAGE_KEY_BIO) === 'true';
  });

  // Persist User State
  useEffect(() => {
      if (user) {
          safeLocalStorageSet(STORAGE_KEY_USER, JSON.stringify(user));

          if (isBiometricEnabled) {
              const saved = safeLocalStorageSet(STORAGE_KEY_SECURE_ENCLAVE, JSON.stringify(user));
              if (!saved) {
                  localStorage.removeItem(STORAGE_KEY_SECURE_ENCLAVE);
              }
          } else {
              localStorage.removeItem(STORAGE_KEY_SECURE_ENCLAVE);
          }
      } else {
          localStorage.removeItem(STORAGE_KEY_USER);
          localStorage.removeItem(STORAGE_KEY_SECURE_ENCLAVE);
      }
  }, [user, isBiometricEnabled]);

  // Persist Biometric State
  useEffect(() => {
      safeLocalStorageSet(STORAGE_KEY_BIO, String(isBiometricEnabled));
  }, [isBiometricEnabled]);

  // LOGIN
  const login = useCallback(async (phone: string, password: string): Promise<'direct' | 'otp' | null> => {
    try {
      const response = await authService.login({ phone, password });
      const anyData = response.data as any;
      if (response.success && anyData?.accessToken && anyData?.user) {
        setUser(buildUserFromApi(anyData.user, phone));
        localStorage.removeItem(STORAGE_KEY_PENDING_PHONE);
        return 'direct';
      }

      if (response.success) {
        localStorage.setItem(STORAGE_KEY_PENDING_PHONE, phone);
        return 'otp';
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // SOCIAL LOGIN
  const loginWithSocial = useCallback(async (provider: 'google' | 'apple', token: string): Promise<boolean> => {
    try {
      const response = await authService.socialLogin(provider, token);
      if (response.success && response.data) {
        setUser(buildUserFromApi(response.data.user));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // REGISTRATION
  const requestRegistrationOtp = useCallback(async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.register({ name, email, phone, password });
      if (response.success) {
        localStorage.setItem(STORAGE_KEY_PENDING_PHONE, phone);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // VERIFY LOGIN OTP
  const verifyLoginOtp = useCallback(async (otp: string): Promise<boolean> => {
    const phone = localStorage.getItem(STORAGE_KEY_PENDING_PHONE) || '';

    try {
      const response = await authService.verifyOtp({ phone, otp, type: 'login' });
      if (response.success && response.data) {
        setUser(buildUserFromApi(response.data.user, phone));
        localStorage.removeItem(STORAGE_KEY_PENDING_PHONE);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);
  
  // VERIFY REGISTRATION OTP
  const verifyRegistrationAndLogin = useCallback(async (otp: string): Promise<boolean> => {
    const phone = localStorage.getItem(STORAGE_KEY_PENDING_PHONE) || '';

    try {
      const response = await authService.verifyOtp({ phone, otp, type: 'register' });
      if (response.success && response.data) {
        setUser(buildUserFromApi(response.data.user, phone));
        localStorage.removeItem(STORAGE_KEY_PENDING_PHONE);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const setupBiometrics = () => {
    setIsBiometricEnabled(prev => !prev);
  };

  const loginWithBiometrics = async (): Promise<boolean> => {
    if (!isBiometricEnabled) {
      return false;
    }

    return new Promise(resolve => {
        setTimeout(() => {
            if (user) {
                resolve(true);
                return;
            }

            const secureBlob = localStorage.getItem(STORAGE_KEY_SECURE_ENCLAVE);
            if (secureBlob) {
                try {
                    const savedUser = JSON.parse(secureBlob);
                    if (savedUser && savedUser.id) {
                        setUser(savedUser);
                        resolve(true);
                        return;
                    }
                } catch {
                    resolve(false);
                    return;
                }
            }

            resolve(false);
        }, 1000);
    });
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prevUser => {
        if (!prevUser) return null;
        return { ...prevUser, ...data };
    });
  };

  const updateKycStatus = (status: KYCStatus) => {
    setUser(prevUser => {
        if (!prevUser) return null;
        return { ...prevUser, kycStatus: status };
    });
  };

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout failures
    }

    setUser(null);
    TokenManager.clearTokens();
    
    SENSITIVE_KEYS.forEach(key => localStorage.removeItem(key));
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_PENDING_PHONE);
    
    window.location.reload();
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isBiometricEnabled,
    setupBiometrics,
    login,
    loginWithSocial,
    requestRegistrationOtp,
    verifyLoginOtp,
    verifyRegistrationAndLogin,
    loginWithBiometrics,
    logout,
    updateUser,
    updateKycStatus,
  }), [user, isBiometricEnabled]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
