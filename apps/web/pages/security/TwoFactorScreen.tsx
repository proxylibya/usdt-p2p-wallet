
import React, { useEffect, useState } from 'react';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { QrCode, Copy, Check, ArrowRight, Download, Key } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { OTPInput } from '../../components/OTPInput';
import { userService } from '../../services';

const TwoFactorScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { addNotification } = useNotifications();
    const [step, setStep] = useState(1); // 1: Intro, 2: Key, 3: Verify
    const [otp, setOtp] = useState('');
    const [isEnabled, setIsEnabled] = useState(false);
    const [secretKey, setSecretKey] = useState('');
    const [otpAuthUrl, setOtpAuthUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSetup = async () => {
            setIsLoading(true);
            const response = await userService.setup2FA();
            if (response.success && response.data) {
                setSecretKey(response.data.secret);
                setOtpAuthUrl(response.data.otpauthUrl);
            } else {
                addNotification({ icon: 'error', title: t('error'), message: response.error || 'Failed to setup 2FA' });
            }
            setIsLoading(false);
        };

        fetchSetup();
    }, [addNotification, t]);

    const handleCopy = () => {
        if (!secretKey) return;
        navigator.clipboard.writeText(secretKey);
        addNotification({ icon: 'success', title: 'Copied', message: 'Key copied to clipboard' });
    };

    const handleVerify = async () => {
        if (otp.length !== 6) {
            addNotification({ icon: 'error', title: 'Error', message: 'Invalid code' });
            return;
        }

        setIsSaving(true);
        const response = await userService.verify2FA(otp);
        if (response.success) {
            setIsEnabled(true);
            addNotification({ icon: 'success', title: 'Success', message: '2FA Enabled Successfully' });
        } else {
            addNotification({ icon: 'error', title: 'Error', message: response.error || 'Invalid code' });
        }
        setIsSaving(false);
    };

    if (isEnabled) {
        return (
            <PageLayout title={t('enable_2fa')} scrollable={false}>
                <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fadeIn bg-background-primary">
                    <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6 border border-success/20">
                        <Check className="w-12 h-12 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">2FA is Active</h2>
                    <p className="text-text-secondary text-sm max-w-xs mx-auto leading-relaxed mb-8">
                        Your account is now secured with Google Authenticator. You will need a code to log in or withdraw funds.
                    </p>
                    <button onClick={() => setIsEnabled(false)} className="text-error font-bold text-sm hover:underline">
                        Disable 2FA (Not Recommended)
                    </button>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title={t('enable_2fa')} scrollable={false}>
            <div className="flex flex-col h-full bg-background-primary">
                
                <div className="flex-grow overflow-y-auto no-scrollbar p-6">
                    {/* Stepper */}
                    <div className="flex justify-between items-center mb-10 px-6 relative max-w-sm mx-auto w-full">
                        {[1, 2, 3].map(num => (
                            <div key={num} className="flex flex-col items-center gap-1 z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= num ? `bg-${primaryColor} text-background-primary` : 'bg-background-tertiary text-text-secondary'}`}>
                                    {step > num ? <Check className="w-4 h-4" /> : num}
                                </div>
                            </div>
                        ))}
                        <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-background-tertiary -z-0 -translate-y-1/2">
                            <div className={`h-full bg-${primaryColor} transition-all duration-300`} style={{ width: `${(step - 1) * 50}%` }}></div>
                        </div>
                    </div>

                    <div className="min-h-[300px] flex flex-col items-center">
                        {step === 1 && (
                            <div className="text-center space-y-8 animate-fadeIn w-full max-w-sm">
                                <div className="bg-background-secondary p-8 rounded-full inline-block border border-border-divider/50 shadow-sm">
                                    <Download className={`w-16 h-16 text-${primaryColor}`} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-bold text-text-primary">{t('download_app')}</h3>
                                    <p className="text-text-secondary text-sm leading-relaxed mx-auto">
                                        Download and install <strong className="text-text-primary">Google Authenticator</strong> or <strong className="text-text-primary">Authy</strong> on your phone.
                                    </p>
                                </div>
                                <div className="flex gap-4 justify-center">
                                    <button className="px-5 py-3 bg-background-tertiary rounded-xl text-xs font-bold hover:bg-background-secondary transition-colors border border-border-divider">App Store</button>
                                    <button className="px-5 py-3 bg-background-tertiary rounded-xl text-xs font-bold hover:bg-background-secondary transition-colors border border-border-divider">Google Play</button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="text-center space-y-8 animate-fadeIn w-full max-w-sm">
                                <div className="bg-white p-4 rounded-2xl inline-block shadow-lg">
                                    {otpAuthUrl ? (
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpAuthUrl)}`}
                                            alt="2FA QR"
                                            className="w-40 h-40"
                                        />
                                    ) : (
                                        <QrCode className="w-40 h-40 text-black" />
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-text-primary">{t('scan_qr_code')}</h3>
                                    <p className="text-text-secondary text-xs mb-4">
                                        Use the authenticator app to scan this QR code.
                                    </p>
                                    <div className="bg-background-tertiary p-4 rounded-xl border border-border-divider flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Key className="w-4 h-4 text-text-secondary flex-shrink-0" />
                                            <span className="font-mono text-sm text-brand-yellow truncate tracking-widest">{secretKey || '—'}</span>
                                        </div>
                                        <button onClick={handleCopy} className="p-2 hover:bg-background-secondary rounded-lg text-text-secondary hover:text-text-primary transition-colors flex-shrink-0">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-text-secondary/60">{t('enter_key_manually')}</p>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="text-center space-y-8 animate-fadeIn w-full max-w-sm">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-text-primary">{t('verify_code')}</h3>
                                    <p className="text-text-secondary text-sm">
                                        Enter the 6-digit code generated by your authenticator app.
                                    </p>
                                </div>
                                <div className="py-4">
                                    <OTPInput value={otp} onChange={setOtp} length={6} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 pb-8 bg-background-primary border-t border-border-divider/10 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
                    <button 
                        onClick={() => {
                            if (step < 3) setStep(step + 1);
                            else handleVerify();
                        }}
                        disabled={isLoading || isSaving || (step === 3 && otp.length !== 6)}
                        className={`w-full p-4 rounded-xl font-bold text-background-primary bg-${primaryColor} flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-${primaryColor}/20`}
                    >
                        {isSaving ? t('verifying') : step === 3 ? t('enable_2fa') : t('next_step')}
                        {step < 3 && <ArrowRight className="w-4 h-4 rtl:rotate-180" />}
                    </button>
                </div>
            </div>
        </PageLayout>
    );
};

export default TwoFactorScreen;
