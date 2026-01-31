
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Wallet } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { FingerprintIcon } from './icons/FingerprintIcon';
import { Lock, AlertCircle } from 'lucide-react';

interface WithdrawConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  asset: Wallet;
  amount: string;
  address: string;
  receivedAmount: number;
  networkFee: number;
}

export const WithdrawConfirmationModal: React.FC<WithdrawConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  asset,
  amount,
  address,
  receivedAmount,
  networkFee,
}) => {
    const { primaryColor } = useTheme();
    const { t } = useLanguage();
    const { isBiometricEnabled, loginWithBiometrics } = useAuth();
    const [isVerifying, setIsVerifying] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleBiometricConfirm = async () => {
        setIsVerifying(true);
        setError('');
        const success = await loginWithBiometrics();
        setIsVerifying(false);
        if (success) {
            onConfirm();
        } else {
            setError(t('biometric_verification_failed'));
        }
    };
    
    const handlePasswordConfirm = async () => {
        setIsVerifying(true);
        setError('');
        
        try {
            // Verify password via secure API call
            const { authService } = await import('../services');
            const response = await authService.changePassword(password, password);
            
            // If no error thrown, password is valid
            if (response.success || response.error?.includes('same')) {
                setIsVerifying(false);
                onConfirm();
            } else {
                setIsVerifying(false);
                setError(t('incorrect_password'));
            }
        } catch {
            setIsVerifying(false);
            setError(t('incorrect_password'));
        }
    }

    const handleClose = () => {
        setIsVerifying(false);
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t('confirm_withdrawal')}>
            <div className="space-y-4">
                <div className="bg-background-tertiary p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">{t('amount')}</span>
                        <span className="font-bold text-text-primary">{amount} {asset.symbol}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">{t('network_fee')}</span>
                        <span className="font-bold text-text-primary">{networkFee} {asset.symbol}</span>
                    </div>
                    <div className="h-px bg-border-divider my-1"></div>
                    <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">{t('you_will_receive')}</span>
                        <span className={`font-bold text-lg ${primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'}`}>
                            {receivedAmount.toFixed(4)} {asset.symbol}
                        </span>
                    </div>
                    <div className="flex justify-between items-start text-sm pt-2 border-t border-border-divider">
                        <span className="text-text-secondary flex-shrink-0 me-4">{t('to_address')}</span>
                        <span className="font-mono text-text-primary break-all text-end">{address}</span>
                    </div>
                </div>

                {isBiometricEnabled ? (
                     <button 
                        onClick={handleBiometricConfirm}
                        disabled={isVerifying}
                        className={`w-full p-4 rounded-lg text-lg font-bold text-background-primary transition-opacity disabled:opacity-70 flex items-center justify-center gap-2 ${primaryColor === 'brand-yellow' ? 'bg-brand-yellow' : 'bg-brand-green'}`}
                    >
                        {isVerifying ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-background-primary"></div>
                                <span>{t('verifying')}</span>
                            </>
                        ) : (
                            <>
                                <FingerprintIcon className="w-6 h-6" />
                                <span>{t('confirm_withdrawal')}</span>
                            </>
                        )}
                    </button>
                ) : (
                    <div className="space-y-4">
                         <div>
                            <label className="text-sm font-medium text-text-secondary" htmlFor="password-confirm">{t('password')}</label>
                            <div className="relative mt-2">
                                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                <input
                                    id="password-confirm"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => {
                                        setPassword(e.target.value);
                                        if (error) setError('');
                                    }}
                                    className="w-full bg-background-tertiary border border-border-divider rounded-lg py-3 ps-12 pe-4 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:outline-none"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handlePasswordConfirm}
                            disabled={isVerifying || !password}
                            className={`w-full p-4 rounded-lg text-lg font-bold text-background-primary transition-opacity disabled:opacity-70 flex items-center justify-center ${primaryColor === 'brand-yellow' ? 'bg-brand-yellow' : 'bg-brand-green'}`}
                        >
                             {isVerifying ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-background-primary"></div>
                                    <span>{t('verifying')}</span>
                                </>
                             ) : t('confirm_withdrawal')}
                        </button>
                    </div>
                )}
                 {error && (
                    <div className="flex items-center justify-center gap-2 text-error text-sm mt-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </Modal>
    );
};
