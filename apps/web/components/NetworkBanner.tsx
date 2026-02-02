import React from 'react';
import { AlertTriangle, Shield, Info, X } from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';

interface NetworkBannerProps {
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const NetworkBanner: React.FC<NetworkBannerProps> = ({ 
  dismissible = false, 
  onDismiss 
}) => {
  const { status, showBanner, isTestnet } = useNetwork();

  if (!showBanner || !status) {
    return null;
  }

  return (
    <div 
      className="w-full py-2 px-4 flex items-center justify-center gap-2 text-xs font-medium relative"
      style={{ 
        backgroundColor: `${status.warningColor}15`,
        borderBottom: `2px solid ${status.borderColor}`,
      }}
    >
      <AlertTriangle 
        className="w-4 h-4 flex-shrink-0" 
        style={{ color: status.warningColor }} 
      />
      <span style={{ color: status.warningColor }}>
        <strong className="uppercase">{status.displayName}</strong>
        <span className="mx-1">-</span>
        <span className="opacity-90">بيئة اختبار • Test Environment</span>
      </span>
      
      {dismissible && onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute right-2 p-1 rounded hover:bg-white/10 transition-colors"
          style={{ color: status.warningColor }}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export const NetworkStatusIndicator: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { status, isMainnet, isTestnet, loading } = useNetwork();

  if (loading || !status) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-[#2B3139] rounded-lg">
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
        {!compact && <span className="text-xs text-[#848E9C]">Loading...</span>}
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
        isMainnet 
          ? 'bg-[#0ECB81]/10 border-[#0ECB81]/30' 
          : 'bg-[#FF6B35]/10 border-[#FF6B35]/30'
      }`}
    >
      {isMainnet ? (
        <Shield className="w-3 h-3 text-[#0ECB81]" />
      ) : (
        <AlertTriangle className="w-3 h-3 text-[#FF6B35]" />
      )}
      
      {!compact && (
        <span 
          className="text-xs font-semibold"
          style={{ color: isMainnet ? '#0ECB81' : '#FF6B35' }}
        >
          {status.displayName}
        </span>
      )}
      
      <div 
        className={`w-1.5 h-1.5 rounded-full ${
          isMainnet ? 'bg-[#0ECB81]' : 'bg-[#FF6B35] animate-pulse'
        }`}
      />
    </div>
  );
};

export const NetworkWatermark: React.FC = () => {
  const { status, isTestnet } = useNetwork();

  if (!status?.showWatermark || !isTestnet) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.03]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="text-[200px] font-black rotate-[-30deg] whitespace-nowrap select-none"
          style={{ color: status.warningColor }}
        >
          TESTNET • TESTNET • TESTNET
        </div>
      </div>
    </div>
  );
};

export const NetworkFeatureGate: React.FC<{
  feature: 'deposits' | 'withdrawals' | 'p2p' | 'swap' | 'staking';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ feature, children, fallback }) => {
  const { status } = useNetwork();

  if (!status) {
    return null;
  }

  const isEnabled = status.features[feature];

  if (!isEnabled) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Info className="w-12 h-12 text-[#848E9C] mb-4" />
        <h3 className="text-lg font-semibold text-[#FEFEFE] mb-2">
          Feature Unavailable
        </h3>
        <p className="text-sm text-[#848E9C]">
          This feature is currently disabled in {status.displayName} mode.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default NetworkBanner;
