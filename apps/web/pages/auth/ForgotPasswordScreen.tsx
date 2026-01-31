
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { ChevronLeft, Mail, AlertCircle, CheckCircle, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { PhoneInput } from '../../components/PhoneInput';
import { AuthMethodTabs } from '../../components/AuthMethodTabs';
import { OTPInput } from '../../components/OTPInput';

const ForgotPasswordScreen: React.FC = () => {
    const navigate = useNavigate();
    const { primaryColor } = useTheme();
    const { t } = useLanguage();
    const { addNotification } = useNotifications();
    
    // States: 'request' -> 'verify' -> 'reset' -> 'success'
    const [step, setStep] = useState<'request' | 'verify' | 'reset' | 'success'>('request');
    const [phone, setPhone] = useState('+218');
    const [email, setEmail] = useState('');
    const [method, setMethod] = useState<'phone' | 'email'>('phone');
    const [isLoading, setIsLoading] = useState(false);
    
    // Step 2: OTP
    const [otp, setOtp] = useState('');
    const [resendTimer, setResendTimer] = useState(30);

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
        
        if (method === 'email' && !email.includes('@')) {
            setError('Invalid email address');
            return;
        }
        if (method === 'phone' && phone.length < 8) {
            setError('Invalid phone number');
            return;
        }

        setIsLoading(true);
        setError('');
        
        // Simulate API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsLoading(false);
        setStep('verify');
        setResendTimer(30);
    };

    // Handle OTP Verification
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }
        
        setIsLoading(true);
        setError('');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
        setStep('reset');
    };

    // Handle Password Reset
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError('');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
        
        addNotification({ icon: 'success', title: 'Success', message: 'Password reset successfully' });
        setStep('success');
    };

    const handleResendCode = () => {
        setResendTimer(30);
    };

    return (
        <div className="h-[100dvh] bg-background-primary flex flex-col relative overflow-hidden">
             {/* Fixed Header/Back Button */}
             <div className="absolute top-0 left-0 right-0 p-6 z-20 pointer-events-none">
                 <button onClick={() => navigate('/login')} className="pointer-events-auto p-2 rounded-full bg-background-secondary hover:bg-background-tertiary transition-colors shadow-sm">
                     <ChevronLeft className="w-6 h-6 text-text-primary rtl:rotate-180" />
                 </button>
             </div>

             {/* Scrollable Content */}
             <div className="flex-grow overflow-y-auto no-scrollbar p-6 pt-[70px] pb-10">
                 <div className="flex flex-col min-h-full max-w-md mx-auto justify-center">
                
                    {/* Step 1: Request Code */}
                    {step === 'request' && (
                        <div className="animate-fadeIn">
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-text-primary">{t('forgot_password')}</h1>
                                <p className="text-text-secondary mt-2">Enter your registered phone number or email to receive a reset code.</p>
                            </div>

                            <AuthMethodTabs 
                                activeMethod={method} 
                                onChange={(m) => { setMethod(m); setError(''); }} 
                            />

                            <form className="space-y-6" onSubmit={handleRequestCode}>
                                {method === 'phone' ? (
                                    <div className="animate-fadeIn">
                                        <label className="text-xs font-bold text-text-secondary ms-1 mb-1 block uppercase tracking-wide">{t('phone_number')}</label>
                                        <PhoneInput value={phone} onChange={(val) => { setPhone(val); setError(''); }} />
                                    </div>
                                ) : (
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

                                {error && <p className="text-error text-sm text-center bg-error/10 p-2 rounded-lg">{error}</p>}

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
                                        length={6} 
                                    />
                                </div>

                                <div className="text-center">
                                    {resendTimer > 0 ? (
                                        <p className="text-sm text-text-secondary">
                                            Resend in <span className="font-mono font-bold text-text-primary">00:{resendTimer.toString().padStart(2, '0')}</span>
                                        </p>
                                    ) : (
                                        <button type="button" onClick={handleResendCode} className={`text-sm font-bold text-${primaryColor} hover:underline`}>
                                            Resend Code
                                        </button>
                                    )}
                                </div>

                                {error && <p className="text-error text-sm text-center bg-error/10 p-2 rounded-lg">{error}</p>}

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
                                    <label className="text-xs font-bold text-text-secondary ms-1 mb-1 block uppercase tracking-wide">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            placeholder="Min 8 characters" 
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
                                    <label className="text-xs font-bold text-text-secondary ms-1 mb-1 block uppercase tracking-wide">Confirm Password</label>
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

                                {error && <p className="text-error text-sm text-center bg-error/10 p-2 rounded-lg">{error}</p>}

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
