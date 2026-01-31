
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Lock, Delete, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LockScreenOverlayProps {
    onUnlock: () => void;
}

export const LockScreenOverlay: React.FC<LockScreenOverlayProps> = ({ onUnlock }) => {
    const { primaryColor } = useTheme();
    const { isBiometricEnabled, loginWithBiometrics } = useAuth();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [storedPin, setStoredPin] = useState<string | null>(null);

    useEffect(() => {
        const savedPin = localStorage.getItem('usdt_wallet_pin_code');
        setStoredPin(savedPin);
        
        // Auto-trigger biometrics if enabled
        if (isBiometricEnabled) {
            handleBiometric();
        }
    }, []);

    const handleBiometric = async () => {
        const success = await loginWithBiometrics();
        if (success) {
            onUnlock();
        }
    };

    const handleKeyPress = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            
            if (newPin.length === 4) {
                if (newPin === storedPin) {
                    onUnlock();
                } else {
                    setError(true);
                    setTimeout(() => {
                        setPin('');
                        setError(false);
                    }, 400);
                }
            }
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-background-primary flex flex-col items-center justify-center p-6 animate-fadeIn">
            <div className="flex-grow flex flex-col items-center justify-center space-y-8">
                <div className="text-center space-y-4">
                    <div className={`w-20 h-20 mx-auto bg-background-tertiary rounded-full flex items-center justify-center mb-6 ring-4 ring-${primaryColor}/20`}>
                        <Lock className={`w-10 h-10 text-${primaryColor}`} />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary">Welcome Back</h2>
                    <p className="text-sm text-text-secondary">Enter your PIN to unlock wallet</p>
                </div>

                <div className="flex gap-6 my-8">
                    {[0, 1, 2, 3].map((i) => {
                        const filled = i < pin.length;
                        return (
                            <div 
                                key={i} 
                                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                                    error 
                                        ? 'bg-error border-error animate-shake' 
                                        : filled 
                                            ? `bg-${primaryColor} border-${primaryColor}` 
                                            : 'bg-transparent border-text-secondary/30'
                                }`}
                            ></div>
                        );
                    })}
                </div>
                
                {error && <p className="text-error text-sm font-bold animate-pulse">Incorrect PIN</p>}
            </div>

            <div className="w-full max-w-sm pb-safe">
                <div className="grid grid-cols-3 gap-y-6 gap-x-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button 
                            key={num}
                            onClick={() => handleKeyPress(num.toString())}
                            className="h-20 w-full flex items-center justify-center text-3xl font-medium text-text-primary rounded-full hover:bg-background-tertiary transition-colors active:scale-90"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="h-20 w-full flex items-center justify-center">
                        {isBiometricEnabled && (
                            <button onClick={handleBiometric} className={`p-4 rounded-full text-${primaryColor} hover:bg-background-tertiary`}>
                                <Fingerprint className="w-8 h-8" />
                            </button>
                        )}
                    </div>
                    <button 
                        onClick={() => handleKeyPress('0')}
                        className="h-20 w-full flex items-center justify-center text-3xl font-medium text-text-primary rounded-full hover:bg-background-tertiary transition-colors active:scale-90"
                    >
                        0
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="h-20 w-full flex items-center justify-center text-text-secondary hover:text-text-primary rounded-full hover:bg-background-tertiary transition-colors active:scale-90"
                    >
                        <Delete className="w-8 h-8" />
                    </button>
                </div>
                <div className="text-center mt-8">
                    <button onClick={() => window.location.reload()} className="text-sm text-text-secondary font-medium hover:text-text-primary">
                        Forgot PIN?
                    </button>
                </div>
            </div>
        </div>
    );
};
