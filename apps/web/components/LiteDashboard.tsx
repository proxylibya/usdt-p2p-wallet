

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useLiveData } from '../context/LiveDataContext';
import { useNavigate } from 'react-router-dom';
import { ArrowUpFromLine, ArrowDownToLine, Users, LogOut, Wallet } from 'lucide-react';
import { assetIcons } from './icons/CryptoIcons';

export const LiteDashboard: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { wallets } = useLiveData();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const totalBalance = wallets.reduce((acc, w) => acc + w.usdValue, 0);
    const usdtBalance = wallets.find(w => w.symbol === 'USDT')?.balance || 0;

    const ActionButton = ({ icon: Icon, label, onClick, color }: any) => (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-3 w-full aspect-square rounded-3xl ${color} shadow-lg transition-transform active:scale-95`}
        >
            <Icon className="w-10 h-10" />
            <span className="font-bold text-lg">{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-background-primary p-6 space-y-8">
            <div className="text-center space-y-2 mt-4">
                <p className="text-text-secondary text-lg font-medium">{t('total_balance')}</p>
                <h1 className="text-5xl font-black text-text-primary tracking-tight">
                    ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h1>
                <p className="text-text-secondary text-sm">
                    ≈ {usdtBalance.toFixed(2)} USDT
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <ActionButton 
                    icon={ArrowDownToLine} 
                    label={t('deposit')} 
                    onClick={() => navigate('/deposit')}
                    color={`bg-${primaryColor} text-background-primary`} 
                />
                <ActionButton 
                    icon={ArrowUpFromLine} 
                    label={t('withdraw')} 
                    onClick={() => navigate('/withdraw')}
                    color="bg-background-tertiary text-text-primary" 
                />
                <ActionButton 
                    icon={Users} 
                    label={t('p2p')} 
                    onClick={() => navigate('/p2p')}
                    color="bg-background-tertiary text-text-primary" 
                />
                <ActionButton 
                    icon={Wallet} 
                    label={t('wallet')} 
                    onClick={() => navigate('/wallet')}
                    color="bg-background-tertiary text-text-primary" 
                />
            </div>

            <div className="mt-auto">
                <button onClick={() => navigate('/settings')} className="w-full py-4 text-text-secondary font-bold text-sm bg-background-secondary rounded-xl hover:bg-background-tertiary mb-3">
                    {t('settings')}
                </button>
                <button onClick={logout} className="w-full py-4 text-error font-bold text-sm bg-background-secondary rounded-xl hover:bg-error/10 flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4 rtl:scale-x-[-1]" />
                    {t('logout')}
                </button>
            </div>
        </div>
    );
};
