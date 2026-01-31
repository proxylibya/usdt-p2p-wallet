
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PageLayout from '../../components/PageLayout';
import { SettingsItem } from '../../components/SettingsItem';
import { ShieldCheck, Smartphone, Lock, KeyRound, History, AlertTriangle, Fingerprint, Mail, CheckCircle, ShieldAlert, ScanFace, Grid, FileQuestion, BookUser } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../../components/Modal';

// Animated Gauge Component
const SecurityScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const { t } = useLanguage();
    const [displayScore, setDisplayScore] = useState(0);
    const radius = 42; // Larger radius for better visibility
    const circumference = 2 * Math.PI * radius;
    
    // Animation Logic
    useEffect(() => {
        const duration = 1500; // 1.5s animation
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic function for smooth deceleration
            const ease = 1 - Math.pow(1 - progress, 3);
            
            const currentVal = Math.floor(ease * score);
            setDisplayScore(currentVal);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }, [score]);

    const strokeDashoffset = circumference - (displayScore / 100) * circumference;

    // Determine colors based on score
    const isHigh = score >= 80;
    const isMedium = score >= 60;
    
    const colorStart = isHigh ? '#0ECB81' : isMedium ? '#F0B90B' : '#F6465D';
    const colorEnd = isHigh ? '#098a56' : isMedium ? '#b88d05' : '#c71f37';
    const textColorClass = isHigh ? 'text-success' : isMedium ? 'text-brand-yellow' : 'text-error';
    
    const gradientId = `gauge-gradient-${score}`;

    return (
        <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
            {/* Background Track */}
            <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={colorStart} />
                        <stop offset="100%" stopColor={colorEnd} />
                    </linearGradient>
                </defs>
                
                {/* Track Circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-background-tertiary/40"
                />
                
                {/* Progress Arc */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={`url(#${gradientId})`}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            
            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-1">
                <span className={`text-4xl font-black ${textColorClass} tracking-tighter`}>
                    {displayScore}
                </span>
                <span className="text-[10px] uppercase font-bold text-text-secondary/70 tracking-widest mt-0.5">{t('security_score')}</span>
            </div>
        </div>
    );
};

const SecurityScreen: React.FC = () => {
    const { t } = useLanguage();
    const { isBiometricEnabled, setupBiometrics, user } = useAuth();
    const { primaryColor } = useTheme();
    const { addNotification } = useNotifications();
    
    // States for interactive features
    const [isPhishingModalOpen, setIsPhishingModalOpen] = useState(false);
    const [phishingCode, setPhishingCode] = useState(() => localStorage.getItem('anti_phishing_code') || '');
    const [newPhishingCode, setNewPhishingCode] = useState('');
    const [isWhitelistEnabled, setIsWhitelistEnabled] = useState(() => localStorage.getItem('withdrawal_whitelist_enabled') === 'true');
    
    const isAppLockEnabled = localStorage.getItem('usdt_wallet_app_lock') === 'true';
    const hasSecurityQuestions = user?.hasSecurityQuestions;

    // Simulated Security Score Calculation
    let score = 30; 
    if (isBiometricEnabled) score += 20;
    if (isAppLockEnabled) score += 10;
    if (hasSecurityQuestions) score += 10;
    if (phishingCode) score += 10;
    if (isWhitelistEnabled) score += 20;
    // score += 20; // Assuming password/email set (baseline)
    
    // Determine Status Text
    let statusText = t('status_weak');
    let statusColor = "text-error";
    let RecommendationIcon = ShieldAlert;
    
    if (score >= 80) {
        statusText = t('status_strong');
        statusColor = "text-success";
        RecommendationIcon = ShieldCheck;
    } else if (score >= 60) {
        statusText = t('status_medium');
        statusColor = "text-brand-yellow";
        RecommendationIcon = AlertTriangle;
    }

    const StatusBadge = ({ verified }: { verified: boolean }) => (
        verified ? <CheckCircle className="w-4 h-4 text-success" /> : <AlertTriangle className="w-4 h-4 text-brand-yellow" />
    );

    const RecommendedBadge = () => (
        <span className="text-[10px] bg-brand-yellow/10 text-brand-yellow px-2 py-1 rounded font-bold border border-brand-yellow/20 whitespace-nowrap">{t('recommended')}</span>
    );

    const AppLockBadge = ({ enabled }: { enabled: boolean }) => (
        <span className={`text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap ${enabled ? 'bg-success/10 text-success' : 'bg-background-tertiary text-text-secondary'}`}>{enabled ? t('on') : t('off')}</span>
    );

    const SetBadge = ({ isSet }: { isSet?: boolean }) => (
        <span className={`text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap ${isSet ? 'bg-success/10 text-success' : 'bg-brand-yellow/10 text-brand-yellow'}`}>{isSet ? t('set') : t('not_set')}</span>
    );

    const handleSavePhishingCode = () => {
        if (newPhishingCode.length < 4 || newPhishingCode.length > 20) {
            addNotification({ icon: 'error', title: 'Invalid Code', message: 'Code must be between 4 and 20 characters.' });
            return;
        }
        localStorage.setItem('anti_phishing_code', newPhishingCode);
        setPhishingCode(newPhishingCode);
        setIsPhishingModalOpen(false);
        addNotification({ icon: 'success', title: t('success'), message: 'Anti-Phishing Code updated.' });
    };

    const toggleWhitelist = () => {
        const newValue = !isWhitelistEnabled;
        setIsWhitelistEnabled(newValue);
        localStorage.setItem('withdrawal_whitelist_enabled', String(newValue));
        addNotification({ 
            icon: newValue ? 'success' : 'info', 
            title: newValue ? 'Whitelist Enabled' : 'Whitelist Disabled', 
            message: newValue ? 'Withdrawals are now restricted to address book.' : 'You can withdraw to any address.' 
        });
    };

    return (
        <PageLayout title={t('security')}>
            <div className="flex flex-col gap-8 pb-32 px-4 pt-6">
                {/* Security Score Header */}
                <div className="bg-background-secondary p-6 rounded-3xl border border-border-divider flex flex-col sm:flex-row items-center gap-6 shadow-lg relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-48 h-48 bg-${score >= 80 ? 'success' : 'brand-yellow'}/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none`}></div>
                    
                    <SecurityScoreGauge score={score} />
                    
                    <div className="z-10 min-w-0 flex-1 text-center sm:text-start">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 flex-wrap">
                            <RecommendationIcon className={`w-6 h-6 ${statusColor} flex-shrink-0`} />
                            <h2 className="text-xl font-bold text-text-primary whitespace-nowrap">{t('status')}: <span className={statusColor}>{statusText}</span></h2>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed break-words whitespace-normal">
                            {score < 100 
                                ? t('security_score_desc')
                                : "Great job! Your account security is fully optimized."}
                        </p>
                    </div>
                </div>

                {/* 2FA Section */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider px-2">{t('two_factor_auth')}</h3>
                    <div className="rounded-2xl overflow-hidden border border-border-divider/50 bg-background-secondary shadow-sm">
                        <SettingsItem 
                            icon={isBiometricEnabled ? Fingerprint : ScanFace} 
                            label={t('biometric_auth')} 
                            subLabel={t('enable_biometrics_for_login')}
                            onSwitchChange={setupBiometrics}
                            isSwitch
                            switchState={isBiometricEnabled}
                        />
                        <SettingsItem 
                            icon={Smartphone} 
                            label={t('authenticator_app')} 
                            subLabel={t('google_auth_authy')}
                            to="/security/2fa"
                            value={<RecommendedBadge />}
                        />
                        <SettingsItem 
                            icon={Mail} 
                            label={t('email_verification')} 
                            subLabel={t('email_verification')}
                            value={<StatusBadge verified={true} />}
                        />
                    </div>
                </div>

                {/* Access Control */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider px-2">{t('password_and_access')}</h3>
                    <div className="rounded-2xl overflow-hidden border border-border-divider/50 bg-background-secondary shadow-sm">
                        <SettingsItem 
                            icon={Lock} 
                            label={t('change_password')} 
                            to="/security/password" 
                        />
                        <SettingsItem 
                            icon={Grid} 
                            label={t('app_lock')} 
                            subLabel={t('pin_code_pattern')}
                            to="/security/passcode" 
                            value={<AppLockBadge enabled={isAppLockEnabled} />}
                        />
                        <SettingsItem 
                            icon={History} 
                            label={t('device_management')} 
                            subLabel="Manage active sessions"
                            to="/security/devices" 
                        />
                    </div>
                </div>

                {/* Advanced Security */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider px-2">{t('advanced_security')}</h3>
                    <div className="rounded-2xl overflow-hidden border border-border-divider/50 bg-background-secondary shadow-sm">
                        <SettingsItem 
                            icon={BookUser}
                            label={t('withdrawal_whitelist')}
                            subLabel={t('restrict_withdrawals')}
                            onSwitchChange={toggleWhitelist}
                            isSwitch
                            switchState={isWhitelistEnabled}
                        />
                        <SettingsItem 
                            icon={FileQuestion}
                            label={t('security_questions')}
                            subLabel={t('for_account_recovery')}
                            to="/security/questions"
                            value={<SetBadge isSet={hasSecurityQuestions} />}
                        />
                        <SettingsItem 
                            icon={KeyRound} 
                            label={t('anti_phishing_code')} 
                            subLabel={t('protect_against_fake_emails')}
                            onClick={() => { setNewPhishingCode(phishingCode); setIsPhishingModalOpen(true); }}
                            value={<SetBadge isSet={!!phishingCode} />}
                        />
                         <SettingsItem 
                            icon={ShieldAlert} 
                            label={t('account_activity')} 
                            subLabel={t('login_logs')}
                            to="/security/activity"
                        />
                    </div>
                </div>
            </div>

            {/* Anti-Phishing Modal */}
            <Modal isOpen={isPhishingModalOpen} onClose={() => setIsPhishingModalOpen(false)} title={t('anti_phishing_code')}>
                <div className="space-y-6">
                    <div className="bg-background-tertiary p-4 rounded-xl border border-border-divider">
                        <p className="text-sm text-text-secondary leading-relaxed">
                            An Anti-Phishing Code is a unique code that you set. It will appear in all genuine emails from us, helping you distinguish real emails from fake ones.
                        </p>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-text-secondary mb-2 block uppercase tracking-wide">{t('set')} Code</label>
                        <input 
                            type="text"
                            value={newPhishingCode}
                            onChange={(e) => setNewPhishingCode(e.target.value)}
                            placeholder="e.g. MySecret123"
                            className="w-full bg-background-secondary border border-border-divider rounded-xl p-3 focus:outline-none focus:border-brand-yellow transition-colors text-text-primary"
                        />
                        <p className="text-xs text-text-secondary mt-2">4 to 20 characters. Do not share this with anyone.</p>
                    </div>

                    <button 
                        onClick={handleSavePhishingCode}
                        className={`w-full p-4 rounded-xl font-bold text-background-primary bg-${primaryColor} transition-transform active:scale-[0.98]`}
                    >
                        {t('save')} Code
                    </button>
                </div>
            </Modal>
        </PageLayout>
    );
};

export default SecurityScreen;
