import { useState, useEffect } from 'react';
import { 
  Globe, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  History, 
  Lock, 
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  Zap,
  Layers,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface NetworkConfig {
  id: string;
  networkMode: 'MAINNET' | 'TESTNET';
  displayName: string;
  displayNameAr: string;
  description: string | null;
  descriptionAr: string | null;
  primaryColor: string;
  warningColor: string;
  badgeColor: string;
  borderColor: string;
  showGlobalBanner: boolean;
  showWatermark: boolean;
  requireConfirmation: boolean;
  enableDeposits: boolean;
  enableWithdrawals: boolean;
  enableP2P: boolean;
  enableSwap: boolean;
  enableStaking: boolean;
  maxTransactionAmount: number;
  dailyLimit: number;
  blockchainConfig: Record<string, any>;
  lastModeChangeAt: string | null;
  lastModeChangeBy: string | null;
  modeChangeReason: string | null;
}

interface ModeHistory {
  id: string;
  previousMode: 'MAINNET' | 'TESTNET';
  newMode: 'MAINNET' | 'TESTNET';
  changedBy: string;
  changedByName: string | null;
  reason: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function NetworkConfigPage() {
  const { success, error } = useToast();
  const [config, setConfig] = useState<NetworkConfig | null>(null);
  const [history, setHistory] = useState<ModeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'features' | 'blockchain' | 'history'>('config');
  
  // Mode switch modal
  const [showModeModal, setShowModeModal] = useState(false);
  const [targetMode, setTargetMode] = useState<'MAINNET' | 'TESTNET'>('TESTNET');
  const [confirmCode, setConfirmCode] = useState('');
  const [switchReason, setSwitchReason] = useState('');
  
  // Confirmation code modal
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [currentCode, setCurrentCode] = useState('');
  const [showNewCode, setShowNewCode] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchHistory();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/network/config`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      error('Failed to fetch network config');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/network/history?limit=20`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history');
    }
  };

  const handleSwitchMode = async () => {
    if (targetMode === 'MAINNET' && !confirmCode) {
      error('Confirmation code is required for Mainnet');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/network/mode`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          networkMode: targetMode,
          confirmationCode: confirmCode,
          reason: switchReason,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        success(`Successfully switched to ${targetMode}`);
        setShowModeModal(false);
        setConfirmCode('');
        setSwitchReason('');
        fetchHistory();
      } else {
        const errData = await res.json();
        error(errData.message || 'Failed to switch mode');
      }
    } catch (err) {
      error('Failed to switch network mode');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConfig = async (updates: Partial<NetworkConfig>) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/network/config`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        success('Configuration updated successfully');
      } else {
        error('Failed to update configuration');
      }
    } catch (err) {
      error('Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSetConfirmationCode = async () => {
    if (!newCode || newCode.length < 6) {
      error('Code must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/network/confirmation-code`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          code: newCode,
          currentCode: currentCode || undefined,
        }),
      });

      if (res.ok) {
        success('Confirmation code set successfully');
        setShowCodeModal(false);
        setNewCode('');
        setCurrentCode('');
      } else {
        const errData = await res.json();
        error(errData.message || 'Failed to set code');
      }
    } catch (err) {
      error('Failed to set confirmation code');
    } finally {
      setSaving(false);
    }
  };

  const openSwitchModal = (mode: 'MAINNET' | 'TESTNET') => {
    setTargetMode(mode);
    setShowModeModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-yellow" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-status-error mb-4" />
        <p className="text-text-secondary">Failed to load network configuration</p>
      </div>
    );
  }

  const isMainnet = config.networkMode === 'MAINNET';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Globe className="w-8 h-8 text-brand-yellow" />
            Network Configuration
          </h1>
          <p className="text-text-secondary mt-1">
            Manage network mode, blockchain settings, and feature flags
          </p>
        </div>

        {/* Current Status Badge */}
        <div 
          className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 ${
            isMainnet 
              ? 'bg-status-success/10 border-status-success text-status-success' 
              : 'bg-orange-500/10 border-orange-500 text-orange-500'
          }`}
        >
          {isMainnet ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <AlertTriangle className="w-6 h-6" />
          )}
          <div>
            <p className="font-bold text-lg">{config.displayName}</p>
            <p className="text-xs opacity-75">{config.displayNameAr}</p>
          </div>
        </div>
      </div>

      {/* Warning Banner for Testnet */}
      {!isMainnet && config.showGlobalBanner && (
        <div className="bg-orange-500/20 border border-orange-500 rounded-xl p-4 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-400">Testnet Mode Active</p>
            <p className="text-sm text-orange-300/80 mt-1">
              The platform is currently running in test mode. All transactions use test funds and are not real.
              This banner is visible to all users.
            </p>
          </div>
        </div>
      )}

      {/* Mainnet Warning */}
      {isMainnet && (
        <div className="bg-status-success/20 border border-status-success rounded-xl p-4 flex items-start gap-4">
          <Shield className="w-6 h-6 text-status-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-status-success">Production Mode Active</p>
            <p className="text-sm text-status-success/80 mt-1">
              The platform is running in production mode. All transactions are real and involve actual funds.
              Proceed with caution when making changes.
            </p>
          </div>
        </div>
      )}

      {/* Mode Switch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Testnet Card */}
        <div 
          className={`relative p-6 rounded-2xl border-2 transition-all ${
            !isMainnet 
              ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/30' 
              : 'bg-background-secondary border-border-divider hover:border-orange-500/50'
          }`}
        >
          {!isMainnet && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                ACTIVE
              </span>
            </div>
          )}
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-orange-500/20">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">Testnet</h3>
              <p className="text-text-secondary text-sm">شبكة الاختبار</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-4">
            Safe testing environment with test funds. Ideal for development and QA testing.
          </p>
          <ul className="space-y-2 text-sm text-text-secondary mb-6">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-status-success" />
              No real funds at risk
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-status-success" />
              Safe for testing features
            </li>
            <li className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Shows warning banners
            </li>
          </ul>
          {isMainnet && (
            <button
              onClick={() => openSwitchModal('TESTNET')}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
            >
              Switch to Testnet
            </button>
          )}
        </div>

        {/* Mainnet Card */}
        <div 
          className={`relative p-6 rounded-2xl border-2 transition-all ${
            isMainnet 
              ? 'bg-status-success/10 border-status-success ring-2 ring-status-success/30' 
              : 'bg-background-secondary border-border-divider hover:border-status-success/50'
          }`}
        >
          {isMainnet && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-status-success text-white text-xs font-bold rounded-full">
                ACTIVE
              </span>
            </div>
          )}
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-status-success/20">
              <Shield className="w-8 h-8 text-status-success" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">Mainnet</h3>
              <p className="text-text-secondary text-sm">الشبكة الرئيسية</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-4">
            Production environment with real funds. Use only when fully tested and ready.
          </p>
          <ul className="space-y-2 text-sm text-text-secondary mb-6">
            <li className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-status-error" />
              Real funds - proceed with caution
            </li>
            <li className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-yellow" />
              Requires confirmation code
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-status-success" />
              Clean UI without warnings
            </li>
          </ul>
          {!isMainnet && (
            <button
              onClick={() => openSwitchModal('MAINNET')}
              className="w-full py-3 rounded-xl bg-status-success hover:brightness-110 text-white font-semibold transition-all"
            >
              Switch to Mainnet
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-divider">
        {[
          { key: 'config', label: 'Display Settings', icon: Settings },
          { key: 'features', label: 'Feature Flags', icon: Zap },
          { key: 'blockchain', label: 'Blockchain', icon: Layers },
          { key: 'history', label: 'Change History', icon: History },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-brand-yellow text-brand-yellow'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-background-secondary rounded-xl p-6 border border-border-divider">
        {activeTab === 'config' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Display Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Display Name (English)
                </label>
                <input
                  type="text"
                  value={config.displayName}
                  onChange={(e) => setConfig({ ...config, displayName: e.target.value })}
                  className="w-full px-4 py-3 bg-background-tertiary border border-border-divider rounded-xl text-text-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Display Name (Arabic)
                </label>
                <input
                  type="text"
                  value={config.displayNameAr}
                  onChange={(e) => setConfig({ ...config, displayNameAr: e.target.value })}
                  className="w-full px-4 py-3 bg-background-tertiary border border-border-divider rounded-xl text-text-primary"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'primaryColor', label: 'Primary Color' },
                { key: 'warningColor', label: 'Warning Color' },
                { key: 'badgeColor', label: 'Badge Color' },
                { key: 'borderColor', label: 'Border Color' },
              ].map(color => (
                <div key={color.key}>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {color.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={(config as any)[color.key]}
                      onChange={(e) => setConfig({ ...config, [color.key]: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={(config as any)[color.key]}
                      onChange={(e) => setConfig({ ...config, [color.key]: e.target.value })}
                      className="flex-1 px-3 py-2 bg-background-tertiary border border-border-divider rounded-lg text-text-primary text-sm font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-4 bg-background-tertiary rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showGlobalBanner}
                  onChange={(e) => setConfig({ ...config, showGlobalBanner: e.target.checked })}
                  className="w-5 h-5 rounded border-border-divider"
                />
                <div>
                  <p className="font-medium text-text-primary">Show Global Banner</p>
                  <p className="text-xs text-text-secondary">Display warning in header</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-background-tertiary rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showWatermark}
                  onChange={(e) => setConfig({ ...config, showWatermark: e.target.checked })}
                  className="w-5 h-5 rounded border-border-divider"
                />
                <div>
                  <p className="font-medium text-text-primary">Show Watermark</p>
                  <p className="text-xs text-text-secondary">Display watermark on screens</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-background-tertiary rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.requireConfirmation}
                  onChange={(e) => setConfig({ ...config, requireConfirmation: e.target.checked })}
                  className="w-5 h-5 rounded border-border-divider"
                />
                <div>
                  <p className="font-medium text-text-primary">Require Confirmation</p>
                  <p className="text-xs text-text-secondary">Code required for mainnet</p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border-divider">
              <button
                onClick={() => setShowCodeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-background-tertiary hover:bg-brand-yellow/10 text-text-primary rounded-xl transition-colors"
              >
                <Lock className="w-4 h-4" />
                Set Confirmation Code
              </button>

              <button
                onClick={() => handleUpdateConfig({
                  displayName: config.displayName,
                  displayNameAr: config.displayNameAr,
                  primaryColor: config.primaryColor,
                  warningColor: config.warningColor,
                  badgeColor: config.badgeColor,
                  borderColor: config.borderColor,
                  showGlobalBanner: config.showGlobalBanner,
                  showWatermark: config.showWatermark,
                  requireConfirmation: config.requireConfirmation,
                })}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-brand-yellow hover:brightness-110 text-black font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Feature Flags</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'enableDeposits', label: 'Deposits', desc: 'Allow crypto deposits' },
                { key: 'enableWithdrawals', label: 'Withdrawals', desc: 'Allow crypto withdrawals' },
                { key: 'enableP2P', label: 'P2P Trading', desc: 'Allow P2P offers and trades' },
                { key: 'enableSwap', label: 'Swap', desc: 'Allow token swaps' },
                { key: 'enableStaking', label: 'Staking', desc: 'Allow staking features' },
              ].map(feature => (
                <label 
                  key={feature.key}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    (config as any)[feature.key]
                      ? 'bg-status-success/10 border-status-success'
                      : 'bg-background-tertiary border-border-divider'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={(config as any)[feature.key]}
                    onChange={(e) => setConfig({ ...config, [feature.key]: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-12 h-7 rounded-full relative transition-colors ${
                    (config as any)[feature.key] ? 'bg-status-success' : 'bg-border-divider'
                  }`}>
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      (config as any)[feature.key] ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{feature.label}</p>
                    <p className="text-xs text-text-secondary">{feature.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Max Transaction Amount (USD)
                </label>
                <input
                  type="number"
                  value={config.maxTransactionAmount}
                  onChange={(e) => setConfig({ ...config, maxTransactionAmount: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-background-tertiary border border-border-divider rounded-xl text-text-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Daily Limit (USD)
                </label>
                <input
                  type="number"
                  value={config.dailyLimit}
                  onChange={(e) => setConfig({ ...config, dailyLimit: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-background-tertiary border border-border-divider rounded-xl text-text-primary"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border-divider">
              <button
                onClick={() => handleUpdateConfig({
                  enableDeposits: config.enableDeposits,
                  enableWithdrawals: config.enableWithdrawals,
                  enableP2P: config.enableP2P,
                  enableSwap: config.enableSwap,
                  enableStaking: config.enableStaking,
                  maxTransactionAmount: config.maxTransactionAmount,
                  dailyLimit: config.dailyLimit,
                })}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-brand-yellow hover:brightness-110 text-black font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Features'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'blockchain' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Blockchain Configuration</h3>
            
            <div className="bg-background-tertiary rounded-xl p-4">
              <pre className="text-sm text-text-secondary overflow-auto max-h-96">
                {JSON.stringify(config.blockchainConfig, null, 2)}
              </pre>
            </div>

            <p className="text-sm text-text-secondary">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Blockchain configuration is automatically managed based on network mode.
              Contact development team for manual changes.
            </p>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Mode Change History</h3>
            
            {history.length === 0 ? (
              <p className="text-center py-8 text-text-secondary">No history records yet</p>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div 
                    key={record.id}
                    className="flex items-center gap-4 p-4 bg-background-tertiary rounded-xl"
                  >
                    <div className={`p-2 rounded-lg ${
                      record.newMode === 'MAINNET' 
                        ? 'bg-status-success/20 text-status-success' 
                        : 'bg-orange-500/20 text-orange-500'
                    }`}>
                      {record.newMode === 'MAINNET' ? (
                        <Shield className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">
                        {record.previousMode} → {record.newMode}
                      </p>
                      {record.reason && (
                        <p className="text-sm text-text-secondary">{record.reason}</p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-text-primary">{record.changedByName || 'Admin'}</p>
                      <p className="text-text-secondary">
                        {new Date(record.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mode Switch Modal */}
      {showModeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-2xl p-6 max-w-md w-full border border-border-divider">
            <div className={`p-4 rounded-xl mb-6 ${
              targetMode === 'MAINNET' 
                ? 'bg-status-error/20 border border-status-error' 
                : 'bg-orange-500/20 border border-orange-500'
            }`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-8 h-8 ${
                  targetMode === 'MAINNET' ? 'text-status-error' : 'text-orange-500'
                }`} />
                <div>
                  <h3 className="font-bold text-lg text-text-primary">
                    Switch to {targetMode}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {targetMode === 'MAINNET' 
                      ? 'This will enable real transactions with real funds!'
                      : 'This will switch to test mode with test funds.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {targetMode === 'MAINNET' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Confirmation Code *
                </label>
                <input
                  type="password"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  placeholder="Enter confirmation code"
                  className="w-full px-4 py-3 bg-background-tertiary border border-border-divider rounded-xl text-text-primary"
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Reason for Change
              </label>
              <textarea
                value={switchReason}
                onChange={(e) => setSwitchReason(e.target.value)}
                placeholder="Optional: Explain why you're switching..."
                rows={3}
                className="w-full px-4 py-3 bg-background-tertiary border border-border-divider rounded-xl text-text-primary resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModeModal(false);
                  setConfirmCode('');
                  setSwitchReason('');
                }}
                className="flex-1 py-3 rounded-xl bg-background-tertiary text-text-primary font-semibold hover:bg-border-divider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSwitchMode}
                disabled={saving || (targetMode === 'MAINNET' && !confirmCode)}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 ${
                  targetMode === 'MAINNET'
                    ? 'bg-status-error hover:brightness-110 text-white'
                    : 'bg-orange-500 hover:brightness-110 text-white'
                }`}
              >
                {saving ? 'Switching...' : `Switch to ${targetMode}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Confirmation Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-2xl p-6 max-w-md w-full border border-border-divider">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-brand-yellow/20">
                <Lock className="w-6 h-6 text-brand-yellow" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-primary">Set Confirmation Code</h3>
                <p className="text-sm text-text-secondary">This code is required to switch to Mainnet</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Current Code (if set)
                </label>
                <input
                  type="password"
                  value={currentCode}
                  onChange={(e) => setCurrentCode(e.target.value)}
                  placeholder="Enter current code"
                  className="w-full px-4 py-3 bg-background-tertiary border border-border-divider rounded-xl text-text-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  New Confirmation Code *
                </label>
                <div className="relative">
                  <input
                    type={showNewCode ? 'text' : 'password'}
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-3 bg-background-tertiary border border-border-divider rounded-xl text-text-primary pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewCode(!showNewCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    {showNewCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  setNewCode('');
                  setCurrentCode('');
                }}
                className="flex-1 py-3 rounded-xl bg-background-tertiary text-text-primary font-semibold hover:bg-border-divider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetConfirmationCode}
                disabled={saving || newCode.length < 6}
                className="flex-1 py-3 rounded-xl bg-brand-yellow hover:brightness-110 text-black font-semibold transition-all disabled:opacity-50"
              >
                {saving ? 'Setting...' : 'Set Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
