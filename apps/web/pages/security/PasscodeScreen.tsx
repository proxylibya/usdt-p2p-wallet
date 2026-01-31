
import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Delete, CheckCircle, Shield } from 'lucide-react';

const PasscodeScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { addNotification } = useNotifications();
    const navigate = useNavigate();

    const [step, setStep] = useState<'create' | 'confirm' | 'success'>('create');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    
    const [isLockActive, setIsLockActive] = useState(() => {
        return localStorage.getItem('usdt_wallet_app_lock') === 'true';
    });

    // Simulated existing PIN for verification flow (optional enhancement)
    const [existingPin] = useState(localStorage.getItem('usdt_wallet_pin_code'));

    const handleKeyPress = (num: string) => {
        if (step === 'success') return;

        const currentVal = step === 'create' ? pin : confirmPin;
        if (currentVal.length < 4) {
            const newVal = currentVal + num;
            if (step === 'create') setPin(newVal);
            else setConfirmPin(newVal);
        }
    };

    const handleDelete = () => {
        if (step === 'create') setPin(prev => prev.slice(0, -1));
        else setConfirmPin(prev => prev.slice(0, -1));
    };

    useEffect(() => {
        if (step === 'create' && pin.length === 4) {
            setTimeout(() => setStep('confirm'), 300);
        }
        if (step === 'confirm' && confirmPin.length === 4) {
            if (pin === confirmPin) {
                localStorage.setItem('usdt_wallet_pin_code', pin);
                localStorage.setItem('usdt_wallet_app_lock', 'true');
                setStep('success');
                addNotification({ icon: 'success', title: 'Success', message: 'App Lock Enabled' });
            } else {
                addNotification({ icon: 'error', title: 'Error', message: 'PINs do not match' });
                setConfirmPin('');
                setStep('create');
                setPin('');
            }
        }
    }, [pin, confirmPin, step]);

    const handleToggleLock = () => {
        if (isLockActive) {
            // Disable logic
            localStorage.removeItem('usdt_wallet_app_lock');
            localStorage.removeItem('usdt_wallet_pin_code');
            setIsLockActive(false);
            setPin('');
            setConfirmPin('');
            setStep('create');
            addNotification({ icon: 'info', title: 'Disabled', message: 'App Lock Disabled' });
        }
    };

    if (isLockActive && step !== 'success' && !pin && !confirmPin) {
        // If already active, show management view
        return (
            <PageLayout title="App Lock">
                <div className="flex flex-col h-full p-4">
                    <div className="bg-background-secondary p-6 rounded-2xl border border-border-divider flex flex-col items-center text-center space-y-4">
                        <div className={`w-16 h-16 rounded-full bg-${primaryColor}/10 flex items-center justify-center`}>
                            <Lock className={`w-8 h-8 text-${primaryColor}`} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">App Lock is Active</h2>
                            <p className="text-sm text-text-secondary mt-1">Your app is protected with a 4-digit PIN.</p>
                        </div>
                        <button 
                            onClick={handleToggleLock}
                            className="w-full py-3 rounded-xl border border-error text-error font-bold text-sm hover:bg-error/5 transition-colors"
                        >
                            Disable App Lock
                        </button>
                        <button 
                            onClick={() => { setIsLockActive(false); /* Reset local state to allow re-creation */ }}
                            className="w-full py-3 rounded-xl bg-background-tertiary text-text-primary font-bold text-sm hover:bg-border-divider transition-colors"
                        >
                            Change PIN
                        </button>
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title={t('security')} noPadding scrollable={false}>
            <div className="flex flex-col h-full bg-background-primary">
                {/* Display Area */}
                <div className="flex-grow flex flex-col items-center justify-center space-y-8 p-6">
                    {step === 'success' ? (
                        <div className="text-center animate-fadeInUp">
                            <CheckCircle className="w-20 h-20 text-success mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-text-primary">PIN Set Successfully</h2>
                            <p className="text-text-secondary mt-2">Your wallet is now extra secure.</p>
                            <button onClick={() => navigate('/security')} className={`mt-8 px-8 py-3 rounded-xl bg-${primaryColor} text-background-primary font-bold`}>
                                Done
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="text-center space-y-2">
                                <div className={`w-12 h-12 mx-auto bg-background-tertiary rounded-full flex items-center justify-center mb-4`}>
                                    <Shield className="w-6 h-6 text-text-secondary" />
                                </div>
                                <h2 className="text-xl font-bold text-text-primary">
                                    {step === 'create' ? 'Create PIN Code' : 'Confirm PIN Code'}
                                </h2>
                                <p className="text-sm text-text-secondary">
                                    {step === 'create' ? 'Enter a new 4-digit PIN' : 'Re-enter your PIN to confirm'}
                                </p>
                            </div>

                            <div className="flex gap-6">
                                {[0, 1, 2, 3].map((i) => {
                                    const val = step === 'create' ? pin : confirmPin;
                                    const filled = i < val.length;
                                    return (
                                        <div 
                                            key={i} 
                                            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${filled ? `bg-${primaryColor} border-${primaryColor}` : 'bg-transparent border-text-secondary/30'}`}
                                        ></div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Keypad */}
                {step !== 'success' && (
                    <div className="bg-background-secondary pb-safe pt-6 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
                        <div className="grid grid-cols-3 gap-y-6 px-6 pb-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button 
                                    key={num}
                                    onClick={() => handleKeyPress(num.toString())}
                                    className="h-16 w-full flex items-center justify-center text-2xl font-bold text-text-primary rounded-xl hover:bg-background-tertiary transition-colors active:scale-95"
                                >
                                    {num}
                                </button>
                            ))}
                            <div className="h-16 w-full"></div>
                            <button 
                                onClick={() => handleKeyPress('0')}
                                className="h-16 w-full flex items-center justify-center text-2xl font-bold text-text-primary rounded-xl hover:bg-background-tertiary transition-colors active:scale-95"
                            >
                                0
                            </button>
                            <button 
                                onClick={handleDelete}
                                className="h-16 w-full flex items-center justify-center text-text-secondary hover:text-text-primary rounded-xl hover:bg-background-tertiary transition-colors active:scale-95"
                            >
                                <Delete className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    );
};

export default PasscodeScreen;
