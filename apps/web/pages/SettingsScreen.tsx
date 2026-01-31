
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useAppSettings } from '../context/SettingsContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { CurrencySelector } from '../components/CurrencySelector';
import PageLayout from '../components/PageLayout';
import { SettingsItem } from '../components/SettingsItem';
import { 
    Moon, 
    Bell, 
    Zap, 
    HelpCircle, 
    Info, 
    Trash2,
    CheckCircle,
    Shield,
    LogOut,
    Terminal,
    Layout
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SettingsSectionProps {
    title?: string;
    children?: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <div className="mb-6">
    {title && <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-4">{title}</h3>}
    <div className="bg-background-secondary border-y border-border-divider sm:border sm:rounded-xl overflow-hidden">
      {children}
    </div>
  </div>
);

const SettingsScreen: React.FC = () => {
  const { theme, setTheme, primaryColor } = useTheme();
  const { t } = useLanguage();
  const { isPushSubscribed, togglePushSubscription, addNotification } = useNotifications();
  const { settings, updateSettings } = useAppSettings();
  const { logout } = useAuth();
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClearCache = () => {
      // Actually clear specific non-critical data
      const nonCriticalKeys = [
          'usdt_wallet_transactions', // Clear transaction history cache
          'usdt_wallet_notifications', // Clear old notifications
          'usdt_wallet_active_trades', // Clear trades (forces refresh)
          'usdt_wallet_p2p_offers', // Clear cached offers
          'usdt_wallet_funding_wallets', // Clear cached funding wallets
          'usdt_wallet_wallets' // Clear cached wallets
      ];
      
      nonCriticalKeys.forEach(key => localStorage.removeItem(key));
      
      setCacheCleared(true);
      setTimeout(() => {
          setCacheCleared(false);
          addNotification({ icon: 'success', title: 'Success', message: 'Cache cleared successfully' });
          // Optional: Reload to fetch fresh data if strictly necessary, but context usually handles refresh on mount
          // window.location.reload();
      }, 1500);
  };

  return (
    <PageLayout title={t('settings')} noPadding>
      <div className="bg-background-primary min-h-full pb-10 pt-4">
        
        <SettingsSection title={t('preferences')}>
            <LanguageSelector />
            <CurrencySelector />
            
            <SettingsItem 
                icon={Moon} 
                label={t('theme')} 
                value={theme === 'gold' ? 'Gold' : 'Green'} 
                onClick={() => setTheme(theme === 'gold' ? 'green' : 'gold')} 
                iconColor="text-brand-yellow"
            />
            
            <SettingsItem 
                icon={Layout} 
                label={settings.viewMode === 'lite' ? t('switch_to_pro') : t('switch_to_lite')} 
                value={settings.viewMode === 'lite' ? 'Lite' : 'Pro'} 
                onClick={() => updateSettings({ viewMode: settings.viewMode === 'lite' ? 'pro' : 'lite' })}
                iconColor="text-blue-500"
            />
        </SettingsSection>

        <SettingsSection title={t('security')}>
             <SettingsItem 
                icon={Shield} 
                label={t('security')} 
                subLabel="2FA, Password, Devices"
                to="/security"
                iconColor="text-success"
            />
        </SettingsSection>

        <SettingsSection title="Notifications & Feeds">
            <SettingsItem 
                icon={Bell} 
                label={t('push_notifications')} 
                isSwitch 
                switchState={isPushSubscribed} 
                onSwitchChange={togglePushSubscription} 
            />
            <SettingsItem 
                icon={Zap} 
                label={t('live_data_updates')}
                subLabel={t('live_data_updates_desc')}
                isSwitch 
                switchState={settings.liveData.enabled} 
                onSwitchChange={() => updateSettings({ liveData: { enabled: !settings.liveData.enabled } })} 
                iconColor="text-brand-yellow"
            />
        </SettingsSection>

        <SettingsSection title={t('system')}>
            <SettingsItem 
                icon={cacheCleared ? CheckCircle : Trash2} 
                label={cacheCleared ? "Cache Cleared" : "Clear Cache"}
                subLabel="Frees up storage space & refreshes data"
                onClick={handleClearCache} 
                value={cacheCleared ? "" : "24 MB"}
                iconColor={cacheCleared ? "text-success" : "text-text-secondary"}
            />
        </SettingsSection>

        <SettingsSection title={t('about')}>
            <SettingsItem icon={HelpCircle} label={t('help_support')} to="/support" />
            <SettingsItem icon={Info} label={t('about_us')} to="/about" value="v2.4.0" />
        </SettingsSection>

        <div className="px-4 mt-8">
            <button 
                onClick={logout}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-error bg-background-secondary border border-border-divider hover:bg-error/10 transition-colors flex items-center justify-center gap-2"
            >
                <LogOut className="w-4 h-4 rtl:scale-x-100" />
                {t('logout')}
            </button>
            
            <div className="text-center mt-6">
                <Link to="/admin/login" className="inline-flex items-center gap-1 text-[10px] text-text-secondary/30 font-mono hover:text-text-primary transition-colors">
                    <Terminal className="w-3 h-3" />
                    <span>UID: 8291023 • Build 892</span>
                </Link>
            </div>
        </div>

      </div>
    </PageLayout>
  );
};

export default SettingsScreen;
