
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, Lock, Check, ShieldAlert, Smartphone, Fingerprint, Banknote } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ReleaseConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  asset: string;
}

export const ReleaseConfirmationModal: React.FC<ReleaseConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  asset,
}) => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    
    // Safety Checks State
    const [hasCheckedBank, setHasCheckedBank] = useState(false);
    const [hasCheckedName, setHasCheckedName] = useState(false);
    const [hasCheckedAppLogin, setHasCheckedAppLogin] = useState(false);
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timer, setTimer] = useState(5); // Increased to 5s safety delay

    useEffect(() => {
        if (isOpen) {
            setTimer(5);
            setHasCheckedBank(false);
            setHasCheckedName(false);
            setHasCheckedAppLogin(false);
            setPassword('');
            const interval = setInterval(() => {
                setTimer((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        if (!hasCheckedBank || !hasCheckedName || !hasCheckedAppLogin || !password) return;
        
        setIsSubmitting(true);
        // Simulate password check delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsSubmitting(false);
        onConfirm();
    };

    const reset = () => {
        setHasCheckedBank(false);
        setHasCheckedName(false);
        setHasCheckedAppLogin(false);
        setPassword('');
        onClose();
    };

    const isButtonDisabled = !hasCheckedBank || !hasCheckedName || !hasCheckedAppLogin || !password || isSubmitting || timer > 0;

    return (
        <Modal isOpen={isOpen} onClose={reset} title={t('confirm_release_title')}>
            <div className="space-y-5">
                {/* Critical Warning Banner */}
                <div className="bg-error/10 p-4 rounded-xl flex items-start gap-3 border-l-4 border-error shadow-sm">
                    <ShieldAlert className="w-8 h-8 text-error flex-shrink-0 mt-0.5 animate-pulse" />
                    <div className="text-xs text-text-secondary leading-relaxed">
                        <p className="font-bold text-text-primary mb-1 uppercase text-error tracking-wide">{t('security_warning_title')}</p>
                        <p className="font-medium text-text-primary">{t('security_warning_p2p')}</p>
                    </div>
                </div>

                <div className="bg-background-tertiary p-4 rounded-lg flex justify-between items-center border border-border-divider/50">
                    <div>
                        <p className="text-xs text-text-secondary uppercase font-bold">{t('you_are_releasing')}</p>
                        <p className="text-xl font-bold text-text-primary font-mono tracking-tight mt-1">
                            {amount.toLocaleString(undefined, {maximumFractionDigits: 4})} <span className={`text-${primaryColor}`}>{asset}</span>
                        </p>
                    </div>
                    <div className="bg-background-secondary p-2 rounded-full border border-border-divider">
                        <Banknote className="w-6 h-6 text-text-secondary" />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border transition-all duration-200 group ${hasCheckedAppLogin ? `bg-${primaryColor}/10 border-${primaryColor}` : 'bg-background-tertiary/30 border-transparent hover:border-error/50'}`}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${hasCheckedAppLogin ? `bg-${primaryColor} border-${primaryColor} text-background-primary` : 'border-text-secondary group-hover:border-error'}`}>
                            {hasCheckedAppLogin && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={hasCheckedAppLogin} onChange={e => setHasCheckedAppLogin(e.target.checked)} />
                        <span className="text-xs text-text-secondary select-none group-hover:text-text-primary transition-colors font-bold leading-snug">
                            <span className="block mb-1 text-text-primary flex items-center gap-1 text-sm"><Smartphone className="w-4 h-4 text-error"/> I checked my BANK APP.</span>
                            <span className="text-error font-normal">I did NOT rely on SMS notification. Fake SMS scams are common.</span>
                        </span>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg bg-background-tertiary/30 cursor-pointer border border-transparent hover:border-border-divider transition-colors group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${hasCheckedBank ? `bg-${primaryColor} border-${primaryColor} text-background-primary` : 'border-text-secondary group-hover:border-text-primary'}`}>
                            {hasCheckedBank && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={hasCheckedBank} onChange={e => setHasCheckedBank(e.target.checked)} />
                        <span className="text-xs text-text-secondary select-none group-hover:text-text-primary transition-colors">
                            {t('checklist_bank')}
                        </span>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg bg-background-tertiary/30 cursor-pointer border border-transparent hover:border-border-divider transition-colors group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${hasCheckedName ? `bg-${primaryColor} border-${primaryColor} text-background-primary` : 'border-text-secondary group-hover:border-text-primary'}`}>
                            {hasCheckedName && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={hasCheckedName} onChange={e => setHasCheckedName(e.target.checked)} />
                        <span className="text-xs text-text-secondary select-none group-hover:text-text-primary transition-colors">
                            {t('checklist_name')}
                        </span>
                    </label>
                </div>
                
                <div>
                    <label className="text-xs font-bold text-text-secondary ms-1 mb-1.5 block">{t('security_password_label')}</label>
                    <div className="relative">
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('enter_transaction_password')}
                            className="w-full bg-background-secondary border border-border-divider rounded-xl p-3 ps-10 focus:outline-none focus:border-brand-yellow transition-colors text-text-primary placeholder:text-text-secondary/30"
                        />
                        <Lock className="w-4 h-4 text-text-secondary absolute start-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                     <button onClick={reset} className="flex-1 p-3 rounded-xl font-bold bg-background-tertiary text-text-primary hover:bg-border-divider transition-colors">
                        {t('cancel')}
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        disabled={isButtonDisabled}
                        className={`flex-1 p-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-success shadow-lg shadow-success/20 active:scale-[0.98] flex items-center justify-center gap-2`}
                    >
                        {isSubmitting ? (
                            t('verifying')
                        ) : timer > 0 ? (
                            <span className="flex items-center gap-1">{t('wait_for_timer')} ({timer}s)</span>
                        ) : (
                            <>
                                <Fingerprint className="w-4 h-4" />
                                {t('confirm_release_button')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
