import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { AlertCircle, Lock, ShieldCheck, ChevronLeft, ScanFace, Eye, EyeOff, Smartphone, Mail } from 'lucide-react';
import { PhoneInput } from '../../components/PhoneInput';
import { OTPInput } from '../../components/OTPInput';
import { COUNTRIES } from '../../constants/countries';
import { AuthMethodTabs } from '../../components/AuthMethodTabs';
import { normalizePhoneNumber } from '../../utils/phoneUtils';

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const AppleIcon = () => (
    <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        className="block"
    >
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
);

const LoginScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, verifyLoginOtp, isBiometricEnabled, loginWithBiometrics, loginWithSocial } = useAuth();
    const { primaryColor } = useTheme();
    const { t, detectedCountry } = useLanguage();
    const { sendPushNotification } = useNotifications();

    const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
    const [method, setMethod] = useState<'phone' | 'email'>('phone');
    
    // Initialize phone
    const [phone, setPhone] = useState(() => {
        if (detectedCountry) {
            const c = COUNTRIES.find(c => c.code === detectedCountry);
            return c ? c.dial_code : '+218';
        }
        return '+218';
    });
    const [email, setEmail] = useState('');
    
    useEffect(() => {
        if (detectedCountry && phone === '+218') {
             const c = COUNTRIES.find(c => c.code === detectedCountry);
             if (c) setPhone(c.dial_code);
        }
    }, [detectedCountry, phone]);
    
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBioLoading, setIsBioLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(30);
    
    const from = location.state?.from?.pathname || '/';

    useEffect(() => {
        let interval: any;
        if (step === 'otp' && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step, resendTimer]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        let identifier = method === 'phone' ? phone : email;
        if (!identifier) {
            setError(method === 'phone' ? 'Invalid phone' : 'Invalid email');
            setIsLoading(false);
            return;
        }

        if (method === 'phone') {
            const norm = normalizePhoneNumber(phone, detectedCountry || 'LY');
            const isLibya = (norm.countryCode || '').toUpperCase() === 'LY';
            const isValid = norm.isValid && (!isLibya || norm.local.length === 9);
            if (!isValid) {
                setError('Invalid phone number');
                setIsLoading(false);
                return;
            }

            // Ensure we send the normalized value immediately (don't rely on setState timing)
            identifier = norm.full;
            if (norm.full !== phone) {
                setPhone(norm.full);
            }
        }

        const result = await login(identifier, password);
        setIsLoading(false);
        if (result === 'direct') {
            navigate(from, { replace: true });
            return;
        }

        if (result === 'otp') {
            setStep('otp');
            setResendTimer(30);
        } else {
            setError(t('incorrect_phone_or_password'));
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        setIsLoading(true);
        try {
            const success = await loginWithSocial(provider);
            if (success) {
                navigate(from, { replace: true });
            } else {
                setError('Social login failed');
            }
        } catch (e) {
            setError('Connection error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        setIsBioLoading(true);
        setError('');
        try {
            const success = await loginWithBiometrics();
            
            if (success) {
                sendPushNotification(t('security_alert'), { body: 'Logged in via Biometrics' });
                navigate(from, { replace: true });
            } else {
                setError(t('biometric_verification_failed'));
            }
        } catch (e) {
            setError('Biometric Auth Error');
        } finally {
            setIsBioLoading(false);
        }
    };

    const handleVerifyOtp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setIsLoading(true);
        setError('');
        const success = await verifyLoginOtp(otp);
        setIsLoading(false);
        if (success) {
            sendPushNotification(t('security_alert'), { body: t('new_device_login') });
            navigate(from, { replace: true });
        } else {
            setError(t('invalid_otp'));
        }
    };

    const handleResendCode = () => {
        setResendTimer(30);
        setOtp('');
    };

    return (
        <div className="h-[100dvh] bg-background-primary flex flex-col relative overflow-hidden">
             {/* Back Button - Fixed at top */}
             <div className="absolute top-0 left-0 right-0 p-6 z-20 pointer-events-none">
                 <button onClick={() => navigate('/')} className="pointer-events-auto p-2 rounded-full bg-background-secondary hover:bg-background-tertiary transition-colors shadow-sm">
                     <ChevronLeft className="w-6 h-6 text-text-primary rtl:rotate-180" />
                 </button>
             </div>
             
             {/* Main Scrollable Area */}
             <div className="flex-grow overflow-y-auto no-scrollbar p-6 pt-[70px] pb-10">
                 <div className="flex flex-col min-h-full max-w-md mx-auto">
                     
                     {/* Logo Area - REDUCED SIZE */}
                     <div className="flex flex-col items-center justify-center mb-6 flex-shrink-0">
                        <div className="w-16 h-16 mb-2">
                            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                                <defs>
                                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#F0B90B" />
                                        <stop offset="100%" stopColor="#F8D33A" />
                                    </linearGradient>
                                </defs>
                                <path d="M50 5 L90 25 V75 L50 95 L10 75 V25 Z" fill="url(#goldGradient)" stroke="#FFFFFF" strokeWidth="2" />
                                <text x="50" y="65" fontSize="40" fontWeight="bold" fill="#0B0E11" textAnchor="middle" fontFamily="Arial">U</text>
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F0B90B] to-[#F8D33A] tracking-tight">
                            UbinPay
                        </h1>
                     </div>

                    {step === 'credentials' && (
                        <>
                            {/* Header Text - REDUCED SIZE */}
                            <div className="text-center mb-5 flex-shrink-0">
                                <h2 className="text-xl font-bold text-text-primary">{t('login')}</h2>
                                <p className="text-text-secondary mt-1 text-sm">{t('login_subtitle')}</p>
                            </div>

                            <AuthMethodTabs 
                                activeMethod={method} 
                                onChange={(m) => { setMethod(m); setError(''); }} 
                            />

                            <form className="space-y-6 flex-shrink-0" onSubmit={handleLogin}>
                                {method === 'phone' ? (
                                    <div className="animate-fadeIn">
                                        <label className="text-sm font-medium text-text-secondary ms-1" htmlFor="phone">{t('phone_number')}</label>
                                        <div className="mt-2">
                                            <PhoneInput
                                                value={phone}
                                                onChange={value => {
                                                    setPhone(value);
                                                    if (error) setError('');
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-fadeIn">
                                        <label className="text-sm font-medium text-text-secondary ms-1" htmlFor="email">{t('email_address')}</label>
                                        <div className="relative mt-2">
                                            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                            <input
                                                id="email"
                                                type="email"
                                                placeholder="name@example.com"
                                                value={email}
                                                onChange={e => {
                                                    setEmail(e.target.value);
                                                    if (error) setError('');
                                                }}
                                                className="w-full bg-background-secondary border border-border-divider rounded-xl p-4 ps-12 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:outline-none transition-all text-text-primary font-medium"
                                                style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex justify-between items-center mb-2 ms-1">
                                        <label className="text-sm font-medium text-text-secondary" htmlFor="password">{t('password')}</label>
                                        <Link to="/forgot-password" className={`text-xs font-bold ${primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'}`}>
                                            {t('forgot_password')}
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => {
                                                setPassword(e.target.value);
                                                if (error) setError('');
                                            }}
                                            className="w-full bg-background-secondary border border-border-divider rounded-xl py-4 ps-12 pe-12 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:outline-none transition-all text-text-primary font-medium"
                                            style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute end-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center justify-center gap-2 text-error text-sm bg-error/10 p-3 rounded-lg animate-fadeIn">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3">
                                    <button type="submit" disabled={isLoading} className={`w-full p-4 rounded-xl text-lg font-bold text-background-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 disabled:transform-none ${primaryColor === 'brand-yellow' ? 'bg-brand-yellow' : 'bg-brand-green'}`}>
                                        {isLoading ? '...' : t('login')}
                                    </button>

                                    {isBiometricEnabled && (
                                        <button 
                                            type="button"
                                            onClick={handleBiometricLogin}
                                            disabled={isBioLoading}
                                            className="w-full p-4 rounded-xl text-base font-bold text-text-primary bg-background-tertiary/50 border border-border-divider hover:bg-background-tertiary transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                                        >
                                            {isBioLoading ? (
                                                <div className="w-5 h-5 border-2 border-text-primary border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <ScanFace className={`w-5 h-5 text-${primaryColor} group-hover:scale-110 transition-transform`} />
                                                    <span>Login with FaceID</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </form>
                            
                            <div className="mt-6 flex-shrink-0">
                                {/* Divider */}
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-border-divider"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-background-primary text-text-secondary">
                                            {t('or')}
                                        </span>
                                    </div>
                                </div>

                                {/* Social Login Buttons */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <button 
                                        type="button"
                                        onClick={() => handleSocialLogin('google')}
                                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-100 transition-colors active:scale-95"
                                    >
                                        <GoogleIcon />
                                        Google
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleSocialLogin('apple')}
                                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-black text-white border border-border-divider font-bold text-sm hover:bg-gray-900 transition-colors active:scale-95"
                                    >
                                        <AppleIcon />
                                        Apple
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => navigate('/register')}
                                    className="w-full p-4 rounded-xl text-lg font-bold text-text-primary bg-background-secondary border border-border-divider hover:bg-background-tertiary transition-all active:scale-[0.98]"
                                >
                                    {t('create_account')}
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'otp' && (
                        <div className="flex flex-col flex-grow justify-center">
                            <div className="text-center mb-8">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-background-secondary p-4 rounded-full border border-border-divider">
                                        <ShieldCheck className={`w-8 h-8 ${primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'}`} />
                                    </div>
                                </div>
                                <h1 className="text-2xl font-bold text-text-primary">{t('verification')}</h1>
                                <p className="text-text-secondary mt-2 text-sm px-4">
                                    {t('enter_verification_code')} <br/>
                                    <span className="font-bold text-text-primary mt-1 block text-lg" dir="ltr">{method === 'phone' ? phone : email}</span>
                                </p>
                            </div>
                            
                            <form className="space-y-8" onSubmit={handleVerifyOtp}>
                                <div className="flex justify-center">
                                    <OTPInput 
                                        value={otp} 
                                        onChange={(val) => {
                                            setOtp(val);
                                            if (error) setError('');
                                        }}
                                        onComplete={() => {
                                            // Optional: auto-submit when full
                                        }}
                                    />
                                </div>

                                <div className="text-center">
                                    {resendTimer > 0 ? (
                                        <p className="text-sm text-text-secondary">
                                            {t('resend_in')} <span className="font-mono font-bold text-text-primary">00:{resendTimer.toString().padStart(2, '0')}</span>
                                        </p>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <p className="text-sm text-text-secondary">{t('didnt_receive_code')}</p>
                                            <button 
                                                type="button" 
                                                onClick={handleResendCode}
                                                className={`text-sm font-bold ${primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'} hover:underline`}
                                            >
                                                {t('resend_code')}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="flex items-center justify-center gap-2 text-error text-sm bg-error/10 p-3 rounded-lg animate-fadeIn">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button type="submit" disabled={isLoading} className={`w-full p-4 rounded-xl text-lg font-bold text-background-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${primaryColor === 'brand-yellow' ? 'bg-brand-yellow' : 'bg-brand-green'}`}>
                                     {isLoading ? '...' : t('verify_and_login')}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};

export default LoginScreen;
