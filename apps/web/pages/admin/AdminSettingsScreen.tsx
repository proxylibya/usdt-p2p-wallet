import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAppSettings } from '../../context/SettingsContext';
import { WALLETS } from '../../constants';

const AdminSettingsScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { settings, updateSettings } = useAppSettings();

    const handleAiAssistantToggle = () => {
        updateSettings({
            aiAssistant: {
                enabled: !settings.aiAssistant.enabled,
            },
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">{t('admin_settings')}</h1>
                <p className="text-text-secondary mt-1">{t('admin_settings_subtitle')}</p>
            </div>

            <SettingsCard title={t('general_settings')}>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-text-primary">{t('maintenance_mode')}</h4>
                            <p className="text-sm text-text-secondary">{t('maintenance_mode_desc')}</p>
                        </div>
                        <button className="px-4 py-2 text-sm font-bold bg-error text-white rounded-lg">{t('enable')}</button>
                    </div>
                </div>
            </SettingsCard>
            
            <SettingsCard title={t('ai_assistant_settings')}>
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-text-primary">{t('enable_ai_assistant')}</h4>
                        <p className="text-sm text-text-secondary">{t('enable_ai_assistant_desc')}</p>
                    </div>
                    <button
                        onClick={handleAiAssistantToggle}
                        role="switch"
                        aria-checked={settings.aiAssistant.enabled}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-secondary ${settings.aiAssistant.enabled ? 'bg-brand-yellow' : 'bg-background-tertiary'}`}
                        style={{'--tw-ring-color': 'var(--tw-color-brand-yellow)'} as React.CSSProperties}
                    >
                        <span
                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.aiAssistant.enabled ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>
            </SettingsCard>

            <SettingsCard title={t('fees')}>
                 <div className="space-y-4">
                    <FeeInput label="Swap Fee (%)" defaultValue="0.1" />
                    <FeeInput label="P2P Trade Fee (%)" defaultValue="0.05" />
                    <FeeInput label="USDT (TRC20) Withdrawal Fee" defaultValue="1.00" />
                    <FeeInput label="ETH (ERC20) Withdrawal Fee" defaultValue="0.005" />
                 </div>
            </SettingsCard>

             <SettingsCard title={t('assets')}>
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-secondary uppercase">
                        <tr>
                            <th className="py-2">{t('asset')}</th>
                            <th className="py-2 text-center">{t('deposit')}</th>
                            <th className="py-2 text-center">{t('withdraw')}</th>
                            <th className="py-2 text-center">{t('swap')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {WALLETS.map(w => (
                            <tr key={w.id} className="border-t border-border-divider">
                                <td className="py-3 font-semibold text-text-primary">{w.name} ({w.symbol})</td>
                                <td className="py-3 text-center"><StatusToggle enabled={true} /></td>
                                <td className="py-3 text-center"><StatusToggle enabled={true} /></td>
                                <td className="py-3 text-center"><StatusToggle enabled={w.symbol !== 'DAI'} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </SettingsCard>
        </div>
    );
};

const SettingsCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-background-secondary p-6 rounded-lg">
        <h2 className="text-xl font-bold text-text-primary border-b border-border-divider pb-4 mb-4">{title}</h2>
        {children}
    </div>
);

const FeeInput: React.FC<{ label: string, defaultValue: string }> = ({ label, defaultValue }) => {
     const { primaryColor } = useTheme();
     const { t } = useLanguage();
     return(
        <div className="flex justify-between items-center">
            <label className="text-text-secondary">{label}</label>
            <div className="flex items-center gap-2">
                 <input
                    type="number"
                    defaultValue={defaultValue}
                    className="w-24 bg-background-tertiary border border-border-divider rounded-lg p-2 text-sm text-left focus:outline-none"
                    dir="ltr"
                 />
                 <button className="px-4 py-2 text-sm font-bold bg-brand-yellow text-background-primary rounded-lg">{t('save')}</button>
            </div>
        </div>
     );
};


const StatusToggle: React.FC<{ enabled: boolean }> = ({ enabled }) => {
    const { t } = useLanguage();
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${enabled ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
            {t(enabled ? 'enabled_adj' : 'disabled_adj')}
        </span>
    );
};


export default AdminSettingsScreen;