import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PaymentMethodConfig {
  key: string;
  label: string;
  labelAr: string | null;
  iconUrl: string | null;
  scope: string;
  countryCode: string | null;
}

interface CurrencyConfig {
  symbol: string;
  name: string;
  nameAr: string | null;
  iconUrl: string | null;
  networks: string[];
}

interface BannerConfig {
  id: string;
  title: string;
  titleAr: string | null;
  subtitle: string | null;
  subtitleAr: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkType: string;
  position: string;
}

interface SiteConfig {
  appName: string;
  appTagline: string;
  appTaglineAr: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  heroTitle: string;
  heroTitleAr: string;
  heroSubtitle: string;
  heroSubtitleAr: string;
  heroImageUrl: string | null;
  features: any[];
  currencies: string[];
  socialLinks: Record<string, string>;
  supportEmail: string;
  supportPhone: string | null;
  telegramUrl: string | null;
  whatsappUrl: string | null;
  androidAppUrl: string | null;
  iosAppUrl: string | null;
  footerText: string;
  footerTextAr: string;
  metaTitle: string;
  metaDescription: string;
  paymentMethods: PaymentMethodConfig[];
  currencyConfigs: CurrencyConfig[];
  banners: BannerConfig[];
}

interface SiteConfigContextType {
  config: SiteConfig | null;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  getPaymentMethodsByCountry: (countryCode: string) => PaymentMethodConfig[];
  getBannersByPosition: (position: string) => BannerConfig[];
}

const defaultConfig: SiteConfig = {
  appName: 'UbinPay',
  appTagline: 'The Global P2P USDT Platform',
  appTaglineAr: 'المنصة العالمية الرائدة لتداول USDT P2P',
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#F0B90B',
  secondaryColor: '#0ECB81',
  heroTitle: 'USDT',
  heroTitleAr: 'USDT',
  heroSubtitle: 'Buy & Sell USDT with local payment methods',
  heroSubtitleAr: 'شراء وبيع USDT بوسائل الدفع المحلية',
  heroImageUrl: null,
  features: [],
  currencies: ['USDT', 'USDC', 'BUSD', 'DAI'],
  socialLinks: {},
  supportEmail: 'support@ubinpay.com',
  supportPhone: null,
  telegramUrl: null,
  whatsappUrl: null,
  androidAppUrl: null,
  iosAppUrl: null,
  footerText: '© 2024 UbinPay. All rights reserved.',
  footerTextAr: '© 2024 UbinPay. جميع الحقوق محفوظة.',
  metaTitle: 'UbinPay - P2P USDT Trading',
  metaDescription: 'Buy and sell USDT securely with local payment methods',
  paymentMethods: [],
  currencyConfigs: [],
  banners: [],
};

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export const SiteConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig | null>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchConfig = async () => {
    if (hasFetched) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_URL}/admin/public/config`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to fetch site configuration');
      }
      
      const data = await response.json();
      
      setConfig({
        ...defaultConfig,
        ...data,
        paymentMethods: data.paymentMethods || [],
        currencyConfigs: data.currencies || [],
        banners: data.banners || [],
      });
      
      setHasFetched(true);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Site config fetch timeout - using default configuration');
      } else {
        console.warn('Could not fetch site config - using default configuration');
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
    await fetchConfig();
  };

  const getPaymentMethodsByCountry = (countryCode: string): PaymentMethodConfig[] => {
    if (!config?.paymentMethods) return [];
    
    // Get local methods for the country + global methods
    const localMethods = config.paymentMethods.filter(
      m => m.countryCode === countryCode && m.scope === 'local'
    );
    const globalMethods = config.paymentMethods.filter(m => m.scope === 'global');
    
    // If no local methods found, return only global
    if (localMethods.length === 0) {
      return globalMethods;
    }
    
    return [...localMethods, ...globalMethods];
  };

  const getBannersByPosition = (position: string): BannerConfig[] => {
    if (!config?.banners) return [];
    return config.banners.filter(b => b.position === position);
  };

  return (
    <SiteConfigContext.Provider
      value={{
        config,
        isLoading,
        error,
        refreshConfig,
        getPaymentMethodsByCountry,
        getBannersByPosition,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = (): SiteConfigContextType => {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
};

export type { SiteConfig, PaymentMethodConfig, CurrencyConfig, BannerConfig };
