
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { AlertCircle, User, Lock, ShieldCheck, ChevronLeft, Mail, Eye, EyeOff, Check } from 'lucide-react';
import { PhoneInput } from '../../components/PhoneInput';
import { OTPInput } from '../../components/OTPInput';
import { CONFIG } from '../../config';
import { AuthMethodTabs } from '../../components/AuthMethodTabs';

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

const RegisterScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { requestRegistrationOtp, verifyRegistrationAndLogin, loginWithSocial } = useAuth();
    const { primaryColor } = useTheme();
    const { t } = useLanguage();
    
    const [step, setStep] = useState<'details' | 'otp'>('details');
    const [method, setMethod] = useState<'phone' | 'email'>('phone');
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('+218');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    
    // Visibility Toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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

    // Password Strength Calculation
    const passwordStrength = useMemo(() => {
        if (!password) return 0;
        let score = 0;
        if (password.length >= 8) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        return score; // Max 4
    }, [password]);

    const getStrengthColor = () => {
        if (passwordStrength <= 1) return 'bg-error';
        if (passwordStrength === 2) return 'bg-brand-yellow';
        if (passwordStrength >= 3) return 'bg-success';
        return 'bg-background-tertiary';
    };

    const getStrengthText = () => {
        if (!password) return '';
        if (passwordStrength <= 1) return t('status_weak');
        if (passwordStrength === 2) return t('status_medium');
        return t('status_strong');
    };

    const validateForm = () => {
        if (!name.trim() || name.length < 3) {
            setError(t('full_name') + ' is required');
            return false;
        }

        if (method === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email.trim() || !emailRegex.test(email)) {
                setError('Please enter a valid email address');
                return false;
            }
        }

        if (method === 'phone') {
            if (phone.length < 8) {
                setError('Invalid phone number');
                return false;
            }
        }

        if (password.length < CONFIG.PASSWORD_MIN_LENGTH) {
            setError(`Password must be at least ${CONFIG.PASSWORD_MIN_LENGTH} characters`);
            return false;
        }
        if (password !== confirmPassword) {
            setError(t('passwords_do_not_match'));
            return false;
        }
        
        if (!agreeTerms) {
            setError('You must agree to the Terms of Service');
            return false;
        }

        return true;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setIsLoading(true);
        setError('');
        
        const finalPhone = method === 'phone' ? phone : '';
        const finalEmail = method === 'email' ? email : '';

        const success = await requestRegistrationOtp(name, finalEmail, finalPhone, password);
        setIsLoading(false);
        if (success) {
            setStep('otp');
            setResendTimer(30);
        } else {
            setError(t('failed_to_create_account'));
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

    const handleVerifyOtp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        
        if (otp.length !== CONFIG.OTP_LENGTH) {
            setError(t('invalid_otp'));
            return;
        }

        setIsLoading(true);
        setError('');
        const success = await verifyRegistrationAndLogin(otp);
        setIsLoading(false);
        if (success) {
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
            {/* Back Button - Fixed at top, consistent with LoginScreen */}
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
                                    <linearGradient id="goldGradientReg" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#F0B90B" />
                                        <stop offset="100%" stopColor="#F8D33A" />
                                    </linearGradient>
                                </defs>
                                <path d="M50 5 L90 25 V75 L50 95 L10 75 V25 Z" fill="url(#goldGradientReg)" stroke="#FFFFFF" strokeWidth="2" />
                                <text x="50" y="65" fontSize="40" fontWeight="bold" fill="#0B0E11" textAnchor="middle" fontFamily="Arial">U</text>
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F0B90B] to-[#F8D33A] tracking-tight">
                            UbinPay
                        </h1>
                     </div>

                    {step === 'details' && (
                        <>
                            {/* Header - REDUCED SIZE */}
                            <div className="text-center mb-5 flex-shrink-0">
                                <h2 className="text-xl font-bold text-text-primary">{t('create_your_account')}</h2>
                                <p className="text-text-secondary mt-1 text-sm">{t('join_future_stablecoins')}</p>
                            </div>

                            <AuthMethodTabs 
                                activeMethod={method} 
                                onChange={(m) => { setMethod(m); setError(''); }} 
                            />

                            <form className="space-y-4 flex-shrink-0" onSubmit={handleRegister}>
                                <div>
                                    <label className="text-xs font-bold text-text-secondary ms-1 mb-1 block uppercase tracking-wide">{t('full_name')}</label>
                                    <div className="relative">
                                        <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input id="name" type="text" placeholder={t('full_name_placeholder')} value={name} onChange={e => { setName(e.target.value); setError(''); }}
                                            className="w-full bg-background-secondary border border-border-divider rounded-xl p-3 ps-12 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:outline-none transition-colors text-text-primary font-medium"
                                            style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                                        />
                                    </div>
                                </div>
                                
                                {method === 'email' ? (
                                    <div className="animate-fadeIn">
                                        <label className="text-xs font-bold text-text-secondary ms-1 mb-1 block uppercase tracking-wide">{t('email_address')}</label>
                                        <div className="relative">
                                            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                            <input id="email" type="email" placeholder="name@example.com" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                                                className="w-full bg-background-secondary border border-border-divider rounded-xl p-3 ps-12 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:outline-none transition-colors text-text-primary font-medium"
                                                style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-fadeIn">
                                        <label className="text-xs font-bold text-text-secondary ms-1 mb-1 block uppercase tracking-wide">{t('phone_number')}</label>
                                        <div className="mt-1">
                                            <PhoneInput value={phone} onChange={(val) => { setPhone(val); setError(''); }} />
                                        </div>
                                    </div>
                                )}
                                
                                <div>
                                    <label className="text-xs font-bold text-text-secondary ms-1 mb-1 block uppercase tracking-wide">{t('password')}</label>
                                    <div className="relative">
                                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input 
                                            id="password" 
                                            type={showPassword ? "text" : "password"} 
                                            placeholder="••••••••" 
                                            value={password} 
                                            onChange={e => { setPassword(e.target.value); setError(''); }}
                                            className="w-full bg-background-secondary border border-border-divider rounded-xl py-3 ps-12 pe-10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:outline-none transition-colors text-text-primary font-medium"
                                            style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {/* Password Strength Meter */}
                                    {password && (
                                        <div className="flex items-center gap-2 mt-2 px-1 animate-fadeIn">
                                            <div className="flex-1 h-1 bg-background-tertiary rounded-full overflow-hidden">
                                                <div className={`h-full ${getStrengthColor()} transition-all duration-300`} style={{ width: `${(passwordStrength / 4) * 100}%` }}></div>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase ${passwordStrength <= 1 ? 'text-error' : passwordStrength === 2 ? 'text-brand-yellow' : 'text-success'}`}>
                                                {getStrengthText()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-text-secondary ms-1 mb-1 block uppercase tracking-wide">{t('confirm_password')}</label>
                                    <div className="relative">
                                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input 
                                            id="confirm-password" 
                                            type={showConfirmPassword ? "text" : "password"} 
                                            placeholder="••••••••" 
                                            value={confirmPassword} 
                                            onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                                            className="w-full bg-background-secondary border border-border-divider rounded-xl py-3 ps-12 pe-10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:outline-none transition-colors text-text-primary font-medium"
                                            style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Terms Checkbox */}
                                <div className="flex items-start gap-3 py-2 px-1 cursor-pointer" onClick={() => setAgreeTerms(!agreeTerms)}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${agreeTerms ? `bg-${primaryColor} border-${primaryColor} text-background-primary` : 'border-text-secondary bg-background-tertiary'}`}>
                                        {agreeTerms && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                                    </div>
                                    <p className="text-xs text-text-secondary leading-snug">
                                        I agree to the <span className={`text-${primaryColor} font-bold hover:underline`}>Terms of Service</span> and <span className={`text-${primaryColor} font-bold hover:underline`}>Privacy Policy</span>.
                                    </p>
                                </div>

                                {error && (
                                    <div className="flex items-center justify-center gap-2 text-error text-sm bg-error/10 p-3 rounded-lg animate-fadeIn">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{error}</span>
                                    </div>
                                )}
                                
                                <button type="submit" disabled={isLoading} className={`w-full p-4 rounded-xl text-lg font-bold text-background-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 mt-4 bg-${primaryColor}`}>
                                    {isLoading ? '...' : t('create_account')}
                                </button>
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
                                    onClick={() => navigate('/login')}
                                    className="w-full p-4 rounded-xl text-lg font-bold text-text-primary bg-background-secondary border border-border-divider hover:bg-background-tertiary transition-all active:scale-[0.98] mb-8"
                                >
                                    {t('login')}
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'otp' && (
                        <div className="flex flex-col flex-grow justify-center animate-fadeIn">
                            <div className="text-center mb-8">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-background-secondary p-4 rounded-full border border-border-divider">
                                        <ShieldCheck className={`w-8 h-8 text-${primaryColor}`} />
                                    </div>
                                </div>
                                <h1 className="text-2xl font-bold text-text-primary">{t('verification')}</h1>
                                <p className="text-text-secondary mt-2 text-sm px-4">
                                    We sent a verification code to your {method === 'email' ? 'email' : 'phone'}.<br/>
                                    <span className="font-bold text-text-primary mt-1 block" dir="ltr">{method === 'email' ? email : phone}</span>
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
                                        length={CONFIG.OTP_LENGTH}
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
                                                className={`text-sm font-bold text-${primaryColor} hover:underline`}
                                            >
                                                {t('resend_code')}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="flex items-center justify-center gap-2 text-error text-sm bg-error/10 p-3 rounded-lg">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button type="submit" disabled={isLoading} className={`w-full p-4 rounded-xl text-lg font-bold text-background-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-${primaryColor}`}>
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

export default RegisterScreen;
