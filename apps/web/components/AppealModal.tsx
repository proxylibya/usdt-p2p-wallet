
import React, { useState } from 'react';
import { Modal } from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { UploadCloud, AlertTriangle, CheckCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { SelectField } from './SelectField';
import { SelectModal } from './SelectModal';

interface AppealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, description: string) => void;
}

export const AppealModal: React.FC<AppealModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const [reason, setReason] = useState('payment_issue');
    const [isReasonPickerOpen, setIsReasonPickerOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [hasProof, setHasProof] = useState(false);

    const reasonLabel =
        reason === 'payment_issue'
            ? "I paid but seller didn't release"
            : reason === 'seller_unresponsive'
                ? "I didn't receive payment (Seller claim)"
                : reason === 'wrong_amount'
                    ? 'Received incorrect amount'
                    : reason === 'fraud'
                        ? 'Suspected Fraud / Scam'
                        : 'Other';

    const handleSubmit = () => {
        onSubmit(reason, description);
        setReason('payment_issue');
        setDescription('');
        setHasProof(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('appeal')}>
            <div className="space-y-5">
                <div className="bg-brand-yellow/10 p-4 rounded-xl flex items-start gap-3 border border-brand-yellow/20">
                    <AlertTriangle className="w-6 h-6 text-brand-yellow flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-text-secondary leading-relaxed">
                        <strong className="text-text-primary block mb-1">Before you appeal:</strong>
                        Assets will be frozen. Mediation may take 24-48 hours. Malicious appeals will result in account bans. Try to resolve via chat first.
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wide">Reason for Appeal</label>
                    <div className="relative">
                        <SelectField
                            valueLabel={reasonLabel}
                            onClick={() => setIsReasonPickerOpen(true)}
                            className="w-full bg-background-secondary border border-border-divider rounded-xl p-3 ltr:pl-3 ltr:pr-10 rtl:pr-3 rtl:pl-10 focus:outline-none focus:border-brand-yellow appearance-none text-sm font-medium text-text-primary"
                            style={{ '--tw-ring-color': `var(--tw-color-${primaryColor})` } as React.CSSProperties}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wide">Description</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide details (Transaction ID, Time, Bank Name)..."
                        className="w-full bg-background-secondary border border-border-divider rounded-xl p-3 focus:outline-none focus:border-brand-yellow min-h-[100px] text-sm text-text-primary placeholder:text-text-secondary/50"
                    />
                </div>

                <div 
                    onClick={() => setHasProof(!hasProof)}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${hasProof ? `border-success bg-success/5` : 'border-border-divider hover:bg-background-secondary hover:border-brand-yellow/50'}`}
                >
                    {hasProof ? (
                        <>
                            <CheckCircle className="w-8 h-8 text-success mb-2" />
                            <p className="text-sm font-bold text-success">Proof Attached</p>
                            <p className="text-xs text-text-secondary mt-1">screenshot_payment.jpg</p>
                        </>
                    ) : (
                        <>
                            <ImageIcon className="w-8 h-8 text-text-secondary mb-2 opacity-70" />
                            <p className="text-sm font-bold text-text-primary">Upload Proof</p>
                            <p className="text-xs text-text-secondary mt-1 text-center">Required: Proof of Payment / Video History</p>
                        </>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 p-3.5 rounded-xl font-bold bg-background-tertiary text-text-primary hover:bg-border-divider transition-colors">
                        {t('cancel')}
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={!description || !hasProof}
                        className={`flex-1 p-3.5 rounded-xl font-bold text-white transition-opacity disabled:opacity-50 bg-error shadow-lg shadow-error/20`}
                    >
                        Submit Appeal
                    </button>
                </div>
            </div>

            <SelectModal
                isOpen={isReasonPickerOpen}
                onClose={() => setIsReasonPickerOpen(false)}
                title="Reason for Appeal"
                value={reason}
                options={[
                    { value: 'payment_issue', label: "I paid but seller didn't release" },
                    { value: 'seller_unresponsive', label: "I didn't receive payment (Seller claim)" },
                    { value: 'wrong_amount', label: 'Received incorrect amount' },
                    { value: 'fraud', label: 'Suspected Fraud / Scam' },
                    { value: 'other', label: 'Other' },
                ]}
                accentColorClassName={primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'}
                onChange={(v) => setReason(v)}
            />
        </Modal>
    );
};
