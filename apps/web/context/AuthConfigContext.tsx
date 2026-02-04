import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthConfig {
  // Registration Methods
  enablePhoneRegistration: boolean;
  phoneRequired: boolean;
  phoneVerificationRequired: boolean;
  enableEmailRegistration: boolean;
  emailRequired: boolean;
  emailVerificationRequired: boolean;
  
  // Social Login
  enableGoogleLogin: boolean;
  enableAppleLogin: boolean;
  enableFacebookLogin: boolean;
  
  // Login Settings
  enableDirectLogin: boolean;
  enableOtpLogin: boolean;
  
  // Password Policy
  minPasswordLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  
  // Security
  enableTwoFactor: boolean;
  enableBiometric: boolean;
  
  // Registration Fields
  requireName: boolean;
  requireAvatar: boolean;
  defaultCountryCode: string;
  defaultCurrency: string;
  defaultLanguage: string;
  
  // Terms & Privacy
  termsUrl: string | null;
  termsUrlAr: string | null;
  privacyUrl: string | null;
  privacyUrlAr: string | null;
  requireTermsAcceptance: boolean;
  
  // UI Customization
  loginScreenTitle: string;
  loginScreenTitleAr: string;
  registerScreenTitle: string;
  registerScreenTitleAr: string;
  loginBackgroundUrl: string | null;
  registerBackgroundUrl: string | null;
}

interface AuthConfigContextType {
  config: AuthConfig;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  
  // Helper methods
  validatePassword: (password: string) => { valid: boolean; errors: string[] };
  getPasswordRequirements: () => string[];
  shouldShowGoogleLogin: () => boolean;
  shouldShowAppleLogin: () => boolean;
  shouldShowFacebookLogin: () => boolean;
  shouldShowPhoneField: () => boolean;
  shouldShowEmailField: () => boolean;
}

const defaultConfig: AuthConfig = {
  // Registration Methods
  enablePhoneRegistration: true,
  phoneRequired: true,
  phoneVerificationRequired: false,
  enableEmailRegistration: false,
  emailRequired: false,
  emailVerificationRequired: false,
  
  // Social Login
  enableGoogleLogin: false,
  enableAppleLogin: false,
  enableFacebookLogin: false,
  
  // Login Settings
  enableDirectLogin: true,
  enableOtpLogin: false,
  
  // Password Policy
  minPasswordLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  
  // Security
  enableTwoFactor: false,
  enableBiometric: true,
  
  // Registration Fields
  requireName: true,
  requireAvatar: false,
  defaultCountryCode: 'GLOBAL',
  defaultCurrency: 'USD',
  defaultLanguage: 'en',
  
  // Terms & Privacy
  termsUrl: null,
  termsUrlAr: null,
  privacyUrl: null,
  privacyUrlAr: null,
  requireTermsAcceptance: true,
  
  // UI Customization
  loginScreenTitle: 'Welcome Back',
  loginScreenTitleAr: 'مرحباً بعودتك',
  registerScreenTitle: 'Create Account',
  registerScreenTitleAr: 'إنشاء حساب',
  loginBackgroundUrl: null,
  registerBackgroundUrl: null,
};

const AuthConfigContext = createContext<AuthConfigContextType | undefined>(undefined);

export const AuthConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AuthConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchConfig = async () => {
    if (hasFetched) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_URL}/admin/public/auth-config`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to fetch auth configuration');
      }
      
      const data = await response.json();
      
      setConfig({
        ...defaultConfig,
        ...data,
      });
      
      setHasFetched(true);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Auth config fetch timeout - using default configuration');
      } else {
        console.warn('Could not fetch auth config - using default configuration');
      }
      setError(err instanceof Error ? err.message : 'Unknown error');
      setConfig(defaultConfig);
      setHasFetched(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const refreshConfig = async () => {
    setHasFetched(false);
    await fetchConfig();
  };

  // Password validation helper
  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < config.minPasswordLength) {
      errors.push(`Password must be at least ${config.minPasswordLength} characters`);
    }
    
    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (config.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  };

  // Get password requirements as array of strings
  const getPasswordRequirements = (): string[] => {
    const requirements: string[] = [];
    
    requirements.push(`At least ${config.minPasswordLength} characters`);
    
    if (config.requireUppercase) {
      requirements.push('One uppercase letter (A-Z)');
    }
    
    if (config.requireLowercase) {
      requirements.push('One lowercase letter (a-z)');
    }
    
    if (config.requireNumbers) {
      requirements.push('One number (0-9)');
    }
    
    if (config.requireSpecialChars) {
      requirements.push('One special character (!@#$%^&*)');
    }
    
    return requirements;
  };

  // Social login visibility helpers
  const shouldShowGoogleLogin = () => config.enableGoogleLogin;
  const shouldShowAppleLogin = () => config.enableAppleLogin;
  const shouldShowFacebookLogin = () => config.enableFacebookLogin;
  
  // Field visibility helpers
  const shouldShowPhoneField = () => config.enablePhoneRegistration;
  const shouldShowEmailField = () => config.enableEmailRegistration;

  return (
    <AuthConfigContext.Provider
      value={{
        config,
        isLoading,
        error,
        refreshConfig,
        validatePassword,
        getPasswordRequirements,
        shouldShowGoogleLogin,
        shouldShowAppleLogin,
        shouldShowFacebookLogin,
        shouldShowPhoneField,
        shouldShowEmailField,
      }}
    >
      {children}
    </AuthConfigContext.Provider>
  );
};

export const useAuthConfig = (): AuthConfigContextType => {
  const context = useContext(AuthConfigContext);
  if (context === undefined) {
    throw new Error('useAuthConfig must be used within an AuthConfigProvider');
  }
  return context;
};

export type { AuthConfig };
