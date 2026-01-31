
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
    User, 
    Copy, 
    Shield, 
    CreditCard, 
    BookUser, 
    LogOut,
    Gift,
    Settings,
    Headset,
    Share2,
    Crown,
    FileText,
    Mail,
    Phone
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { useNotifications } from '../context/NotificationContext';
import { SettingsItem } from '../components/SettingsItem';
import { KYCBadge } from '../components/KYCBadge';

const ProfileScreen: React.FC = () => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();

    if (!user) return null;

    const handleCopyId = () => {
        navigator.clipboard.writeText(user.id);
        addNotification({ icon: 'success', title: t('copied'), message: 'User ID copied' });
    };

    const handleShareApp = async () => {
        const shareData = {
            title: 'USDT Wallet',
            text: 'Check out the best crypto wallet!',
            url: window.location.origin
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
            }
        }

        navigator.clipboard.writeText(window.location.origin);
        addNotification({ icon: 'success', title: t('copied'), message: 'App link copied to clipboard' });
    };

    const VipBadge = () => (
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-brand-yellow to-yellow-300 text-background-primary text-[10px] font-extrabold uppercase tracking-tight shadow-sm">
            <Crown className="w-3 h-3 fill-current" />
            <span>VIP 0</span>
        </div>
    );

    const SectionHeader = ({ title, className = 'px-4 mt-8 mb-3' }: { title: string; className?: string }) => (
        <div className={`flex items-center gap-3 ${className}`}>
            <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">{title}</h3>
            <div className="h-px flex-1 bg-border-divider/60" />
        </div>
    );

    const GridAction = ({ icon: Icon, label, color, bgColor, borderColor, onClick }: any) => (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-2.5 group w-full rounded-2xl border border-border-divider/50 bg-background-secondary/60 px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
        >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all shadow-sm ${bgColor || 'bg-background-secondary'} ${borderColor || 'border-border-divider'} group-hover:brightness-110`}>
                <Icon className={`w-5.5 h-5.5 ${color}`} />
            </div>
            <span className="text-[11px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors text-center leading-tight max-w-[80px]">{label}</span>
        </button>
    );

    return (
        <PageLayout title="" noPadding>
            <div className="flex flex-col min-h-full pb-10 bg-background-primary">
                
                {/* Header Section */}
                <div className="px-4 pt-4 pb-6 bg-background-primary space-y-4">
                    <div className="relative overflow-hidden rounded-2xl border border-border-divider/60 bg-gradient-to-br from-background-secondary/95 via-background-secondary/85 to-background-tertiary/90 p-5 sm:p-6 shadow-[0_20px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
                        <div className="absolute -top-16 -end-12 w-32 h-32 rounded-full bg-brand-yellow/20 blur-3xl" />
                        <div className="absolute -bottom-20 -start-16 w-40 h-40 rounded-full bg-brand-green/10 blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex flex-col gap-5 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                                <div className="flex items-center gap-5 min-w-0">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-2xl bg-background-tertiary/90 border border-border-divider/60 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.1)]">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <User className="w-8 h-8 text-text-secondary" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => navigate('/profile/edit')}
                                            className="absolute -bottom-2 -end-2 bg-background-primary/95 rounded-full p-2 border border-border-divider/60 text-text-secondary hover:text-brand-yellow shadow-lg hover:scale-105 transition-transform"
                                        >
                                            <Settings className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-[26px] font-bold text-text-primary tracking-tight truncate max-w-[240px] sm:max-w-none">{user.name}</h2>
                                        <div className="mt-3 flex flex-wrap items-center gap-3">
                                            {user.email && (
                                                <div className="flex items-center gap-1.5 text-[11px] text-text-secondary bg-background-primary/20 border border-border-divider/50 h-8 px-3 rounded-full backdrop-blur-sm">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    <span className="truncate max-w-[190px]">{user.email}</span>
                                                </div>
                                            )}
                                            {user.phoneNumber && (
                                                <div className="flex items-center gap-1.5 text-[11px] text-text-secondary bg-background-primary/20 border border-border-divider/50 h-8 px-3 rounded-full backdrop-blur-sm">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    <span className="truncate max-w-[150px]" dir="ltr">{user.phoneNumber}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-[11px] text-text-secondary bg-background-primary/20 border border-border-divider/50 h-8 px-3 rounded-full backdrop-blur-sm">
                                                <span className="font-mono">ID: <span dir="ltr">{user.id.split('-')[0]}</span></span>
                                                <button onClick={handleCopyId} className="hover:text-text-primary hover:bg-background-primary/30 rounded p-0.5 transition-colors">
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-row flex-wrap items-center gap-2.5 sm:flex-col sm:items-end sm:justify-self-end sm:self-start">
                                    <KYCBadge status={user.kycStatus} onClick={() => navigate('/profile/kyc')} />
                                    <VipBadge />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border-divider/60 bg-background-secondary/80 p-5 shadow-sm">
                        <SectionHeader title="Quick Actions" className="px-0 mt-0 mb-5" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <GridAction 
                                icon={Gift} 
                                label="Referral" 
                                color="text-brand-yellow" 
                                bgColor="bg-brand-yellow/10" 
                                borderColor="border-brand-yellow/20"
                                onClick={() => navigate('/referral')} 
                            />
                            <GridAction 
                                icon={CreditCard} 
                                label={t('pay_btn')} 
                                color="text-emerald-500" 
                                bgColor="bg-emerald-500/10" 
                                borderColor="border-emerald-500/20"
                                onClick={() => navigate('/send')} 
                            />
                            <GridAction 
                                icon={BookUser} 
                                label="Addresses" 
                                color="text-blue-500" 
                                bgColor="bg-blue-500/10" 
                                borderColor="border-blue-500/20"
                                onClick={() => navigate('/security/address-book')} 
                            />
                            <GridAction 
                                icon={Headset} 
                                label="Support" 
                                color="text-sky-400" 
                                bgColor="bg-sky-400/10" 
                                borderColor="border-sky-400/20"
                                onClick={() => navigate('/support')} 
                            />
                        </div>
                    </div>

                    <div 
                        onClick={() => navigate('/referral')}
                        className="relative overflow-hidden w-full bg-gradient-to-r from-brand-yellow/20 via-background-secondary to-background-tertiary rounded-2xl p-4 flex items-center justify-between cursor-pointer border border-border-divider/40 group"
                    >
                        <div className="absolute -end-6 -top-8 w-28 h-28 rounded-full bg-brand-yellow/20 blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-brand-yellow text-background-primary text-[10px] font-bold px-2 py-0.5 rounded-full">HOT</span>
                                <span className="text-sm font-bold text-text-primary">Invite Friends</span>
                            </div>
                            <p className="text-xs text-text-secondary">Earn up to 40% commission</p>
                        </div>
                        <Gift className="w-14 h-14 text-brand-yellow/50 absolute -end-1 -bottom-6 rotate-12" />
                    </div>
                </div>

                {/* Settings List */}
                <div className="bg-background-primary">
                    <SectionHeader title={t('security')} />
                    <div className="bg-background-secondary/80 border border-border-divider/60 rounded-2xl overflow-hidden mx-4 shadow-sm">
                        <SettingsItem 
                            icon={Shield} 
                            label={t('security')} 
                            subLabel="2FA, Password" 
                            to="/security" 
                            iconColor="text-success" 
                            iconBgColor="bg-success/10"
                        />
                        <SettingsItem 
                            icon={Settings} 
                            label={t('settings')} 
                            to="/settings" 
                            iconColor="text-text-secondary"
                        />
                    </div>

                    <SectionHeader title="Finance" />
                    <div className="bg-background-secondary/80 border border-border-divider/60 rounded-2xl overflow-hidden mx-4 shadow-sm">
                        <SettingsItem 
                            icon={CreditCard} 
                            label={t('payment_methods')} 
                            subLabel="P2P & Withdrawal" 
                            to="/profile/payment-methods" 
                            iconColor="text-brand-yellow"
                            iconBgColor="bg-brand-yellow/10"
                        />
                    </div>

                    <SectionHeader title="Others" />
                    <div className="bg-background-secondary/80 border border-border-divider/60 rounded-2xl overflow-hidden mx-4 shadow-sm">
                        <SettingsItem icon={Share2} label={t('share_app')} onClick={handleShareApp} />
                        <SettingsItem icon={FileText} label={t('about_us')} to="/about" />
                    </div>

                    <div className="px-4 mt-8">
                        <button 
                            onClick={logout}
                            className="w-full py-3.5 rounded-2xl text-sm font-bold text-text-secondary bg-gradient-to-r from-background-secondary to-background-tertiary border border-border-divider/60 hover:text-error hover:border-error/40 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
                        >
                            <LogOut className="w-4 h-4 rtl:scale-x-[-1]" />
                            {t('logout')}
                        </button>
                        <div className="text-center pt-6 pb-2">
                            <p className="text-[10px] text-text-secondary/40 font-mono">v2.4.0 (Build 892)</p>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default ProfileScreen;
