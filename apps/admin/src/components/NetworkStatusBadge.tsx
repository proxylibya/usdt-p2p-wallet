import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NetworkStatus {
  networkMode: 'MAINNET' | 'TESTNET';
  displayName: string;
  displayNameAr: string;
  primaryColor: string;
  warningColor: string;
  badgeColor: string;
  borderColor: string;
  showGlobalBanner: boolean;
  isMainnet: boolean;
  isTestnet: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const NetworkStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/network/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch network status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-background-tertiary rounded-lg">
        <RefreshCw className="w-4 h-4 animate-spin text-text-secondary" />
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const isMainnet = status.networkMode === 'MAINNET';

  return (
    <div className="relative">
      <button
        onClick={() => navigate('/network-config')}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all hover:scale-105 ${
          isMainnet
            ? 'bg-status-success/20 border-status-success text-status-success'
            : 'bg-orange-500/20 border-orange-500 text-orange-500 animate-pulse'
        }`}
      >
        {isMainnet ? (
          <Shield className="w-4 h-4" />
        ) : (
          <AlertTriangle className="w-4 h-4" />
        )}
        <span className="font-bold text-sm">{status.displayName}</span>
        <div 
          className={`w-2 h-2 rounded-full ${
            isMainnet ? 'bg-status-success' : 'bg-orange-500'
          }`}
        />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full mt-2 right-0 z-50 w-64 p-4 bg-background-secondary border border-border-divider rounded-xl shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            {isMainnet ? (
              <div className="p-2 rounded-lg bg-status-success/20">
                <Shield className="w-5 h-5 text-status-success" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-orange-500/20">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
            )}
            <div>
              <p className="font-bold text-text-primary">{status.displayName}</p>
              <p className="text-xs text-text-secondary">{status.displayNameAr}</p>
            </div>
          </div>

          <div className={`p-3 rounded-lg text-sm ${
            isMainnet 
              ? 'bg-status-success/10 text-status-success' 
              : 'bg-orange-500/10 text-orange-400'
          }`}>
            {isMainnet ? (
              <p>🟢 Production mode active. Real transactions.</p>
            ) : (
              <p>🟠 Test mode active. No real funds at risk.</p>
            )}
          </div>

          <p className="mt-3 text-xs text-text-secondary text-center">
            Click to manage network settings
          </p>
        </div>
      )}
    </div>
  );
};

export const NetworkBanner: React.FC = () => {
  const [status, setStatus] = useState<NetworkStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/network/status`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch network status');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status || !status.showGlobalBanner || status.isMainnet) {
    return null;
  }

  return (
    <div 
      className="w-full py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium"
      style={{ 
        backgroundColor: `${status.warningColor}20`,
        borderBottom: `2px solid ${status.borderColor}`,
        color: status.warningColor,
      }}
    >
      <AlertTriangle className="w-4 h-4" />
      <span>
        <strong>TESTNET MODE</strong> - This is a test environment. Transactions are not real.
      </span>
      <span className="mx-2">|</span>
      <span className="text-xs opacity-75">{status.displayNameAr}</span>
    </div>
  );
};

export default NetworkStatusBadge;
