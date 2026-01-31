
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export type TransactionStatus = 'processing' | 'success' | 'failed';

export interface TransactionDetails {
    amount?: string;
    asset?: string;
    address?: string;
    type?: 'send' | 'withdraw' | 'swap' | 'trade';
    fromAmount?: string;
    fromAsset?: string;
    toAmount?: string;
    toAsset?: string;
    transactionId?: string;
}
interface TransactionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TransactionStatus;
  details: TransactionDetails;
}

export const TransactionStatusModal: React.FC<TransactionStatusModalProps> = ({ isOpen, onClose, status, details }) => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const navigate = useNavigate();

    const statusConfig = {
        processing: {
            icon: <Loader className="w-16 h-16 text-brand-yellow animate-spin" />,
            title: t('processing'),
            message: t('transaction_processing_message'),
        },
        success: {
            icon: <CheckCircle className="w-16 h-16 text-success" />,
            title: t('success'),
            message: t('transaction_success_message'),
        },
        failed: {
            icon: <XCircle className="w-16 h-16 text-error" />,
            title: t('failed'),
            message: t('transaction_failed_message'),
        }
    };

    const { icon, title, message } = statusConfig[status];

    const handleNavigate = () => {
        onClose();
        if (details.transactionId) {
            navigate(`/wallet/transaction/${details.transactionId}`);
        } else {
            navigate('/wallet/history');
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('transaction_submitted')}>
            <div className="space-y-6 text-center">
                <div className="flex justify-center items-center py-4">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-text-primary">{title}</h3>
                <p className="text-text-secondary">{message}</p>

                {(details.amount || details.fromAmount) && (
                     <div className="bg-background-tertiary p-4 rounded-lg text-start text-sm space-y-2">
                        {details.type === 'swap' ? (
                            <>
                                <div className="flex justify-between"><span className="text-text-secondary">{t('from')}</span><span className="font-bold text-text-primary">{details.fromAmount} {details.fromAsset}</span></div>
                                <div className="flex justify-between"><span className="text-text-secondary">{t('to_estimated')}</span><span className="font-bold text-text-primary">{details.toAmount} {details.toAsset}</span></div>
                            </>
                        ) : details.type === 'trade' ? (
                            <>
                                 <div className="flex justify-between"><span className="text-text-secondary">{t('asset')}</span><span className="font-bold text-text-primary">{details.amount} {details.asset}</span></div>
                                 <div className="flex justify-between"><span className="text-text-secondary">Total</span><span className="font-bold text-text-primary">{details.toAmount} USDT</span></div>
                            </>
                        ) : (
                             <>
                                <div className="flex justify-between"><span className="text-text-secondary">{t('amount')}</span><span className="font-bold text-text-primary">{details.amount} {details.asset}</span></div>
                                <div className="flex justify-between"><span className="text-text-secondary">{t('to_address')}</span><span className="font-mono text-text-primary break-all">{details.address}</span></div>
                            </>
                        )}
                    </div>
                )}
               

                <div className="flex gap-3 pt-2">
                    {status === 'success' && (
                        <button onClick={handleNavigate} className="flex-1 p-3 rounded-lg font-semibold bg-background-tertiary text-text-primary">
                            {t('view_details')}
                        </button>
                    )}
                    <button onClick={onClose} className={`flex-1 p-3 rounded-lg font-bold text-background-primary ${primaryColor === 'brand-yellow' ? 'bg-brand-yellow' : 'bg-brand-green'}`}>
                        {t('close')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
