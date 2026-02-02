import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export interface NetworkStatus {
  networkMode: 'MAINNET' | 'TESTNET';
  displayName: string;
  displayNameAr: string;
  primaryColor: string;
  warningColor: string;
  badgeColor: string;
  borderColor: string;
  showGlobalBanner: boolean;
  showWatermark: boolean;
  isMainnet: boolean;
  isTestnet: boolean;
  features: {
    deposits: boolean;
    withdrawals: boolean;
    p2p: boolean;
    swap: boolean;
    staking: boolean;
  };
  limits: {
    maxTransactionAmount: number;
    dailyLimit: number;
  };
}

interface NetworkContextType {
  status: NetworkStatus | null;
  loading: boolean;
  isMainnet: boolean;
  isTestnet: boolean;
  showBanner: boolean;
  refreshStatus: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const defaultStatus: NetworkStatus = {
  networkMode: 'TESTNET',
  displayName: 'Testnet',
  displayNameAr: 'شبكة الاختبار',
  primaryColor: '#F0B90B',
  warningColor: '#F6465D',
  badgeColor: '#FF6B35',
  borderColor: '#FF6B35',
  showGlobalBanner: true,
  showWatermark: true,
  isMainnet: false,
  isTestnet: true,
  features: {
    deposits: true,
    withdrawals: true,
    p2p: true,
    swap: true,
    staking: true,
  },
  limits: {
    maxTransactionAmount: 10000,
    dailyLimit: 50000,
  },
};

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/network/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        setStatus(defaultStatus);
      }
    } catch (error) {
      console.error('Failed to fetch network status:', error);
      setStatus(defaultStatus);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const refreshStatus = async () => {
    setLoading(true);
    await fetchStatus();
  };

  const value: NetworkContextType = {
    status,
    loading,
    isMainnet: status?.networkMode === 'MAINNET',
    isTestnet: status?.networkMode === 'TESTNET',
    showBanner: Boolean(status?.showGlobalBanner && status?.networkMode === 'TESTNET'),
    refreshStatus,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export default NetworkContext;
