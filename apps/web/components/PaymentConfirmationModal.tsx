
import React, { useState } from 'react';
import { Modal } from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { AlertTriangle, Check, Info, UploadCloud } from 'lucide-react';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  currency: string;
}

export const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  currency,
}) => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const [checked1, setChecked1] = useState(false);
    const [checked2, setChecked2] = useState(false);
    const [proofUploaded, setProofUploaded] = useState(false);

    const handleConfirm = () => {
        if (checked1 && checked2) {
            onConfirm();
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('mark_as_paid')}>
            <div className="space-y-5">
                <div className="bg-brand-yellow/10 p-4 rounded-xl flex items-start gap-3 border border-brand-yellow/20">
                    <Info className="w-6 h-6 text-brand-yellow flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-text-secondary leading-relaxed">
                        <p className="font-bold text-text-primary mb-1">{t('confirm')}</p>
                        <p>{t('please_transfer_exactly')} <span className="font-bold text-text-primary">{amount} {currency}</span>. {t('security_warning_title')}</p>
                    </div>
                </div>

                {/* Upload Proof Simulation */}
                <div 
                    onClick={() => setProofUploaded(!proofUploaded)}
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${proofUploaded ? 'border-success bg-success/5' : 'border-border-divider hover:border-brand-yellow/50'}`}
                >
                    {proofUploaded ? (
                        <div className="flex items-center gap-2 text-success">
                            <Check className="w-5 h-5" />
                            <span className="text-sm font-bold">{t('receipt_attached')}</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-text-secondary">
                            <UploadCloud className="w-8 h-8" />
                            <span className="text-xs font-bold">{t('upload_proof_optional')}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 rounded-lg bg-background-tertiary/50 cursor-pointer border border-transparent hover:border-border-divider transition-colors group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${checked1 ? `bg-${primaryColor} border-${primaryColor} text-background-primary` : 'border-text-secondary group-hover:border-text-primary'}`}>
                            {checked1 && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={checked1} onChange={e => setChecked1(e.target.checked)} />
                        <span className="text-xs text-text-secondary select-none group-hover:text-text-primary transition-colors">
                            {t('checklist_real_name')}
                        </span>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg bg-background-tertiary/50 cursor-pointer border border-transparent hover:border-border-divider transition-colors group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${checked2 ? `bg-${primaryColor} border-${primaryColor} text-background-primary` : 'border-text-secondary group-hover:border-text-primary'}`}>
                            {checked2 && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={checked2} onChange={e => setChecked2(e.target.checked)} />
                        <span className="text-xs text-text-secondary select-none group-hover:text-text-primary transition-colors">
                            {t('checklist_no_crypto_words')}
                        </span>
                    </label>
                </div>

                <div className="flex gap-3 pt-2">
                     <button onClick={onClose} className="flex-1 p-3 rounded-xl font-bold bg-background-tertiary text-text-primary hover:bg-border-divider transition-colors">
                        {t('cancel')}
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        disabled={!checked1 || !checked2}
                        className={`flex-1 p-3 rounded-xl font-bold text-background-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-${primaryColor}`}
                    >
                        {t('mark_as_paid')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
