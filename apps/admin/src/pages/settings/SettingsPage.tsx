import { useState, useEffect } from 'react';
import { Save, Globe, Bell, Shield, Percent, DollarSign, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';

const SettingsPage: React.FC = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'fees' | 'limits' | 'security' | 'notifications'>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    platformName: 'USDT P2P Platform',
    supportEmail: 'support@usdtp2p.com',
    maintenanceMode: false,
    registrationEnabled: true,
    kycRequired: true,
    
    tradingFee: 0.1,
    withdrawalFee: 1.0,
    p2pFee: 0.1,
    
    minWithdrawal: 10,
    maxWithdrawal: 50000,
    dailyWithdrawalLimit: 100000,
    minP2PTrade: 10,
    maxP2PTrade: 10000,
    
    twoFactorRequired: false,
    passwordMinLength: 8,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<typeof settings>('/admin/settings');
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch {
      error('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiClient.put('/admin/settings', settings);
      if (response.success) {
        success('Settings Saved', 'Your changes have been saved successfully');
      } else {
        error('Error', 'Failed to save settings');
      }
    } catch {
      error('Error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Globe className="w-4 h-4" /> },
    { id: 'fees', label: 'Fees', icon: <Percent className="w-4 h-4" /> },
    { id: 'limits', label: 'Limits', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Platform Settings</h1>
          <p className="text-text-secondary mt-1">Configure platform behavior and policies</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-divider overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-brand-yellow border-b-2 border-brand-yellow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Platform Name</label>
              <input type="text" value={settings.platformName} onChange={(e) => setSettings({...settings, platformName: e.target.value})} className="input-field max-w-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Support Email</label>
              <input type="email" value={settings.supportEmail} onChange={(e) => setSettings({...settings, supportEmail: e.target.value})} className="input-field max-w-md" />
            </div>
            <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg max-w-md">
              <div>
                <p className="font-medium text-text-primary">Maintenance Mode</p>
                <p className="text-sm text-text-secondary">Disable platform access temporarily</p>
              </div>
              <button onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} className={`w-12 h-6 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-status-error' : 'bg-background-primary'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg max-w-md">
              <div>
                <p className="font-medium text-text-primary">User Registration</p>
                <p className="text-sm text-text-secondary">Allow new user registrations</p>
              </div>
              <button onClick={() => setSettings({...settings, registrationEnabled: !settings.registrationEnabled})} className={`w-12 h-6 rounded-full transition-colors ${settings.registrationEnabled ? 'bg-status-success' : 'bg-background-primary'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.registrationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg max-w-md">
              <div>
                <p className="font-medium text-text-primary">KYC Required</p>
                <p className="text-sm text-text-secondary">Require identity verification for trading</p>
              </div>
              <button onClick={() => setSettings({...settings, kycRequired: !settings.kycRequired})} className={`w-12 h-6 rounded-full transition-colors ${settings.kycRequired ? 'bg-status-success' : 'bg-background-primary'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.kycRequired ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Trading Fee (%)</label>
              <input type="number" step="0.01" value={settings.tradingFee} onChange={(e) => setSettings({...settings, tradingFee: parseFloat(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Withdrawal Fee (USDT)</label>
              <input type="number" step="0.1" value={settings.withdrawalFee} onChange={(e) => setSettings({...settings, withdrawalFee: parseFloat(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">P2P Fee (%)</label>
              <input type="number" step="0.01" value={settings.p2pFee} onChange={(e) => setSettings({...settings, p2pFee: parseFloat(e.target.value)})} className="input-field" />
            </div>
          </div>
        )}

        {activeTab === 'limits' && (
          <div className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Min Withdrawal (USDT)</label>
              <input type="number" value={settings.minWithdrawal} onChange={(e) => setSettings({...settings, minWithdrawal: parseFloat(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Max Withdrawal (USDT)</label>
              <input type="number" value={settings.maxWithdrawal} onChange={(e) => setSettings({...settings, maxWithdrawal: parseFloat(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Daily Withdrawal Limit (USDT)</label>
              <input type="number" value={settings.dailyWithdrawalLimit} onChange={(e) => setSettings({...settings, dailyWithdrawalLimit: parseFloat(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Min P2P Trade (USDT)</label>
              <input type="number" value={settings.minP2PTrade} onChange={(e) => setSettings({...settings, minP2PTrade: parseFloat(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Max P2P Trade (USDT)</label>
              <input type="number" value={settings.maxP2PTrade} onChange={(e) => setSettings({...settings, maxP2PTrade: parseFloat(e.target.value)})} className="input-field" />
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 max-w-md">
            <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
              <div>
                <p className="font-medium text-text-primary">Require 2FA for Admin</p>
                <p className="text-sm text-text-secondary">Force two-factor authentication</p>
              </div>
              <button onClick={() => setSettings({...settings, twoFactorRequired: !settings.twoFactorRequired})} className={`w-12 h-6 rounded-full transition-colors ${settings.twoFactorRequired ? 'bg-status-success' : 'bg-background-primary'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.twoFactorRequired ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Min Password Length</label>
              <input type="number" value={settings.passwordMinLength} onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Session Timeout (minutes)</label>
              <input type="number" value={settings.sessionTimeout} onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Max Login Attempts</label>
              <input type="number" value={settings.maxLoginAttempts} onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})} className="input-field" />
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-md">
            <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
              <div>
                <p className="font-medium text-text-primary">Email Notifications</p>
                <p className="text-sm text-text-secondary">Send email alerts for important events</p>
              </div>
              <button onClick={() => setSettings({...settings, emailNotifications: !settings.emailNotifications})} className={`w-12 h-6 rounded-full transition-colors ${settings.emailNotifications ? 'bg-status-success' : 'bg-background-primary'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
              <div>
                <p className="font-medium text-text-primary">Push Notifications</p>
                <p className="text-sm text-text-secondary">Browser push notifications</p>
              </div>
              <button onClick={() => setSettings({...settings, pushNotifications: !settings.pushNotifications})} className={`w-12 h-6 rounded-full transition-colors ${settings.pushNotifications ? 'bg-status-success' : 'bg-background-primary'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
              <div>
                <p className="font-medium text-text-primary">SMS Notifications</p>
                <p className="text-sm text-text-secondary">Send SMS for critical alerts</p>
              </div>
              <button onClick={() => setSettings({...settings, smsNotifications: !settings.smsNotifications})} className={`w-12 h-6 rounded-full transition-colors ${settings.smsNotifications ? 'bg-status-success' : 'bg-background-primary'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.smsNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
