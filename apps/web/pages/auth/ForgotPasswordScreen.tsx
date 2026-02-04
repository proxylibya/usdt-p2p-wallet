
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuthConfig } from '../../context/AuthConfigContext';
import { ChevronLeft, Mail, AlertCircle, CheckCircle, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { PhoneInput } from '../../components/PhoneInput';
import { AuthMethodTabs } from '../../components/AuthMethodTabs';
import { OTPInput } from '../../components/OTPInput';
import { normalizePhoneNumber } from '../../utils/phoneUtils';
import { authService } from '../../services/authService';

const ForgotPasswordScreen: React.FC = () => {
    const navigate = useNavigate();
    const { primaryColor } = useTheme();
    const { t, detectedCountry } = useLanguage();
    const { addNotification } = useNotifications();
    const { config, shouldShowPhoneField, shouldShowEmailField, validatePassword } = useAuthConfig();
    
    // States: 'request' -> 'verify' -> 'reset' -> 'success'
    const [step, setStep] = useState<'request' | 'verify' | 'reset' | 'success'>('request');
    const [method, setMethod] = useState<'phone' | 'email'>('phone');
    
    // Initialize phone
    const [phone, setPhone] = useState(() => {
        if (detectedCountry) {
            // Import COUNTRIES if needed or rely on default
            return '+218'; // Default fallback
        }
        return '+218';
    });
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Initialize method based on config
    useEffect(() => {
        if (!shouldShowPhoneField() && shouldShowEmailField()) {
            setMethod('email');
        }
    }, [shouldShowPhoneField, shouldShowEmailField]);

    // Step 2: OTP
    const [otp, setOtp] = useState('');
    const [resendTimer, setResendTimer] = useState(config.otpExpirationMinutes * 60 || 300);

    // Step 3: New Password
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let interval: any;
        if (step === 'verify' && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step, resendTimer]);

    // Handle initial request
    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        let identifier = method === 'email' ? email : phone;

        if (method === 'email') {
            if (!email.trim() || !email.includes('@')) {
                setError(t('invalid_email') || 'Invalid email address');
                return;
            }
        }
        
        if (method === 'phone') {
            const norm = normalizePhoneNumber(phone, detectedCountry || 'LY');
            if (!norm.isValid) {
                setError(t('invalid_phone') || 'Invalid phone number');
                return;
            }
            identifier = norm.full;
            // Update phone state to normalized version
            if (phone !== norm.full) setPhone(norm.full);
        }

        setIsLoading(true);
        
        try {
            // In a real app, you might have separate endpoints or a single one handling both
            // For now assuming authService.forgotPassword handles the request
            // Note: Update authService to accept email if backend supports it
            await authService.forgotPassword(identifier);
            
            setIsLoading(false);
            setStep('verify');
            setResendTimer(config.otpExpirationMinutes * 60 || 300);
        } catch (err: any) {
            setIsLoading(false);
            setError(err.message || 'Failed to send reset code');
        }
    };

    // Handle OTP Verification
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        // Use config length
        const requiredLength = config.otpLength || 6;
        if (otp.length !== requiredLength) {
            setError(`Please enter a valid ${requiredLength}-digit code`);
            return;
        }
        
        // Optimistic transition - backend verification usually happens on reset or here
        // If backend API supports verifying reset-token-otp separately, call it here.
        // For now, we assume standard flow where we just proceed to enter password
        // and then submit everything or validate token.
        // Assuming current authService.resetPassword takes OTP.
        
        setStep('reset');
    };

    // Handle Password Reset
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const validation = validatePassword(newPassword);
        if (!validation.valid) {
            setError(validation.errors[0]);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('passwords_do_not_match'));
            return;
        }

        setIsLoading(true);
        setError('');
        
        try {
            const identifier = method === 'email' ? email : phone;
            await authService.resetPassword(identifier, otp, newPassword);
            
            setIsLoading(false);
            addNotification({ icon: 'success', title: 'Success', message: 'Password reset successfully' });
            setStep('success');
        } catch (err: any) {
            setIsLoading(false);
            setError(err.message || 'Failed to reset password');
        }
    };

    const handleResendCode = async () => {
        setResendTimer(config.otpExpirationMinutes * 60 || 300);
        try {
            const identifier = method === 'email' ? email : phone;
            // Using a generic resend or the specific forgot password trigger again
            await authService.forgotPassword(identifier);
        } catch (err) {
            console.error(err);
        }
    };

    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-[100dvh] bg-background-primary flex flex-col relative overflow-hidden"
             style={config.loginBackgroundUrl ? {
                 backgroundImage: `url(${config.loginBackgroundUrl})`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
             } : {}}>
             
             {/* Overlay */}
             {config.loginBackgroundUrl && <div className="absolute inset-0 bg-background-primary/90 backdrop-blur-sm z-0"></div>}

             {/* Fixed Header/Back Button */}
             <div className="absolute top-0 left-0 right-0 p-6 z-20 pointer-events-none">
                 <button onClick={() => navigate('/login')} className="pointer-events-auto p-2 rounded-full bg-background-secondary hover:bg-background-tertiary transition-colors shadow-sm">
                     <ChevronLeft className="w-6 h-6 text-text-primary rtl:rotate-180" />
                 </button>
             </div>

             {/* Scrollable Content */}
             <div className="flex-grow overflow-y-auto no-scrollbar p-6 pt-[70px] pb-10 z-10">
                 <div className="flex flex-col min-h-full max-w-md mx-auto justify-center">
                
                    {/* Step 1: Request Code */}
                    {step === 'request' && (
                        <div className="animate-fadeIn">
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-text-primary">{t('forgot_password')}</h1>
                                <p className="text-text-secondary mt-2">Enter your registered {shouldShowPhoneField() && shouldShowEmailField() ? 'phone number or email' : method === 'phone' ? 'phone number' : 'email'} to receive a reset code.</p>
                            </div>

                            {/* Auth Method Tabs - Only if both enabled */}
                            {shouldShowPhoneField() && shouldShowEmailField() && (
                                <AuthMethodTabs 
                                    activeMethod={method} 
                                    onChange={(m) => { setMethod(m); setError(''); }} 
                                />
                            )}

                            <form className="space-y-6" onSubmit={handleRequestCode}>
                                {method === 'phone' && shouldShowPhoneField() && (
                                    <div className="animate-fadeIn">
                                        <label className="text-xs font-bold text-text-secondary ms-1 mb-1 block uppercase tracking-wide">{t('phone_number')}</label>
                                        <PhoneInput value={phone} onChange={(val) => { setPhone(val); setError(''); }} />
                                    </div>
                                )}
                                
                                {method === 'email' && shouldShowEmailField() && (
                                    <div className="animate-fadeIn">
                                        <label className="text-xs font-bold text-text-secondary ms-1 mb-1 block uppercase tracking-wide">{t('email')}</label>
                                        <div className="relative">
                                            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                            <input
                                                type="text"
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                                placeholder="name@example.com"
                                                className="w-full bg-background-secondary border border-border-divider rounded-xl py-3 ps-12 pe-4 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:outline-none transition-colors text-text-primary font-medium"
                                                style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                                            />
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="flex items-center justify-center gap-2 text-error text-sm bg-error/10 p-3 rounded-lg animate-fadeIn">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button type="submit" disabled={isLoading} className={`w-full p-4 rounded-xl text-lg font-bold text-background-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 bg-${primaryColor}`}>
                                    {isLoading ? 'Sending...' : 'Send Code'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 2: Verify Code */}
                    {step === 'verify' && (
                        <div className="animate-fadeIn">
                            <div className="text-center mb-8">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-background-secondary p-4 rounded-full border border-border-divider">
                                        <ShieldCheck className={`w-8 h-8 text-${primaryColor}`} />
                                    </div>
                                </div>
                                <h1 className="text-2xl font-bold text-text-primary">{t('verification')}</h1>
                                <p className="text-text-secondary mt-2 text-sm px-4">
                                    Enter the code sent to <br/>
                                    <span className="font-bold text-text-primary mt-1 block" dir="ltr">{method === 'phone' ? phone : email}</span>
                                </p>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-8">
                                <div className="flex justify-center">
                                    <OTPInput 
                                        value={otp} 
                                        onChange={(val) => { setOtp(val); setError(''); }} 
                                        length={config.otpLength || 6} 
                                    />
                                </div>

                                <div className="text-center">
                                    {resendTimer > 0 ? (
                                        <p className="text-sm text-text-secondary">
                                            {t('resend_in')} <span className="font-mono font-bold text-text-primary">{formatTimer(resendTimer)}</span>
                                        </p>
                                    ) : (
                                        <button type="button" onClick={handleResendCode} className={`text-sm font-bold text-${primaryColor} hover:underline`}>
                                            {t('resend_code')}
                                        </button>
                                    )}
                                </div>

                                {error && (
                                    <div className="flex items-center justify-center gap-2 text-error text-sm bg-error/10 p-3 rounded-lg animate-fadeIn">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button type="submit" disabled={isLoading} className={`w-full p-4 rounded-xl text-lg font-bold text-background-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 bg-${primaryColor}`}>
                                    {isLoading ? 'Verifying...' : 'Verify'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 3: Reset Password */}
                    {step === 'reset' && (
                        <div className="animate-fadeIn">
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-text-primary">Reset Password</h1>
                                <p className="text-text-secondary mt-2 text-sm">Create a new strong password for your account.</p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-text-secondary ms-1 mb-1 block uppercase tracking-wide">{t('new_password') || 'New Password'}</label>
                                    <div className="relative">
                                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            placeholder={`Min ${config.minPasswordLength} characters`}
                                            value={newPassword} 
                                            onChange={e => { setNewPassword(e.target.value); setError(''); }}
                                            className="w-full bg-background-secondary border border-border-divider rounded-xl py-3 ps-12 pe-10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:outline-none transition-colors text-text-primary font-medium"
                                            style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary">
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-text-secondary ms-1 mb-1 block uppercase tracking-wide">{t('confirm_password')}</label>
                                    <div className="relative">
                                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            placeholder="Repeat password" 
                                            value={confirmPassword} 
                                            onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                                            className="w-full bg-background-secondary border border-border-divider rounded-xl py-3 ps-12 pe-10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:outline-none transition-colors text-text-primary font-medium"
                                            style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center justify-center gap-2 text-error text-sm bg-error/10 p-3 rounded-lg animate-fadeIn">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button type="submit" disabled={isLoading} className={`w-full p-4 rounded-xl text-lg font-bold text-background-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 bg-${primaryColor}`}>
                                    {isLoading ? 'Updating...' : 'Set New Password'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 'success' && (
                        <div className="text-center animate-fadeInUp">
                            <div className="flex justify-center mb-6">
                                <div className="bg-success/10 p-6 rounded-full border border-success/20">
                                    <CheckCircle className="w-16 h-16 text-success" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-2">Password Reset!</h2>
                            <p className="text-text-secondary mb-8">
                                Your password has been updated successfully. You can now log in with your new credentials.
                            </p>
                            <button onClick={() => navigate('/login')} className="w-full p-4 bg-background-secondary rounded-xl font-bold text-text-primary border border-border-divider hover:bg-background-tertiary transition-colors">
                                Back to Login
                            </button>
                        </div>
                    )}
                 </div>
             </div>
        </div>
    );
};

export default ForgotPasswordScreen;
