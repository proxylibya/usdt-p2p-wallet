
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Wallet } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { FingerprintIcon } from './icons/FingerprintIcon';
import { assetIcons } from './icons/CryptoIcons';
import { Network } from 'lucide-react';

interface SwapConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromAsset?: Wallet;
  toAsset?: Wallet;
  fromAmount: string;
  toAmount: string;
  rate: number;
  slippage: number;
}

export const SwapConfirmationModal: React.FC<SwapConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fromAsset,
  toAsset,
  fromAmount,
  toAmount,
  rate,
  slippage,
}) => {
    const { primaryColor } = useTheme();
    const { t } = useLanguage();
    const { isBiometricEnabled } = useAuth();
    const [isVerifying, setIsVerifying] = useState(false);

    const handleConfirm = async () => {
        if (isBiometricEnabled) {
            setIsVerifying(true);
            // Simulate biometric scan
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsVerifying(false);
        }
        
        onConfirm();
        onClose();
    };

    // Reset verification state when modal is closed
    const handleClose = () => {
        setIsVerifying(false);
        onClose();
    };
    
    // Guard against undefined assets - don't render modal content if assets are missing
    if (!fromAsset || !toAsset) {
        return null;
    }

    const FromIcon = assetIcons[fromAsset.symbol];
    const ToIcon = assetIcons[toAsset.symbol];

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t('confirm_swap')}>
            <div className="space-y-6">
                <div className="bg-background-tertiary p-5 rounded-xl shadow-sm border border-border-divider/50">
                    <p className="text-sm text-text-secondary mb-3 font-medium">{t('you_are_swapping')}</p>
                    <div className="flex items-center gap-4">
                        {FromIcon ? <FromIcon className="w-10 h-10 flex-shrink-0"/> : <div className="w-10 h-10 bg-background-secondary rounded-full" />}
                        <div className="flex flex-col items-start">
                            <p className="text-2xl font-bold text-text-primary leading-none mb-1.5">{fromAmount} {fromAsset.symbol}</p>
                            <div className="flex items-center mt-1.5">
                                <span className="text-xs font-semibold text-text-secondary bg-background-secondary px-2 py-1 rounded-md flex items-center gap-1.5 border border-border-divider/50">
                                    <Network className="w-3 h-3 opacity-70" />
                                    {fromAsset.network}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-background-tertiary p-5 rounded-xl shadow-sm border border-border-divider/50">
                    <p className="text-sm text-text-secondary mb-3 font-medium">{t('you_will_receive')}</p>
                    <div className="flex items-center gap-4">
                        {ToIcon ? <ToIcon className="w-10 h-10 flex-shrink-0"/> : <div className="w-10 h-10 bg-background-secondary rounded-full" />}
                        <div className="flex flex-col items-start">
                             <p className="text-2xl font-bold text-text-primary leading-none mb-1.5">≈ {toAmount} {toAsset.symbol}</p>
                             <div className="flex items-center mt-1.5">
                                <span className="text-xs font-semibold text-text-secondary bg-background-secondary px-2 py-1 rounded-md flex items-center gap-1.5 border border-border-divider/50">
                                    <Network className="w-3 h-3 opacity-70" />
                                    {toAsset.network}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-sm space-y-3 text-text-secondary bg-background-tertiary/30 p-4 rounded-xl border border-border-divider/30">
                    <div className="flex justify-between">
                        <span>{t('rate')}</span>
                        <span className="text-text-primary font-medium font-mono">1 {fromAsset.symbol} = {rate.toFixed(6)} {toAsset.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t('slippage_tolerance')}</span>
                         <span className="text-text-primary font-medium">{slippage}%</span>
                    </div>
                </div>

                <button 
                    onClick={handleConfirm}
                    disabled={isVerifying}
                    className={`w-full p-4 rounded-xl text-lg font-bold bg-${primaryColor} text-background-primary transition-all active:scale-[0.98] disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-${primaryColor}/20`}
                >
                    {isVerifying ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-background-primary"></div>
                            <span>{t('verifying')}</span>
                        </>
                    ) : (
                        <>
                            {isBiometricEnabled && <FingerprintIcon className="w-6 h-6" />}
                            <span>{t('confirm_swap')}</span>
                        </>
                    )}
                </button>
            </div>
        </Modal>
    );
};
