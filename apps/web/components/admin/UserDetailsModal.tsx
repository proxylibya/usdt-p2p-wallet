import React from 'react';
import { Modal } from '../Modal';
import { AdminUser, KYCStatus, TransactionType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ADMIN_TRANSACTIONS } from '../../constants';

interface UserDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: AdminUser;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, user }) => {
    const { t } = useLanguage();
    const userTransactions = ADMIN_TRANSACTIONS.filter(tx => tx.user === user.name).slice(0, 5);
    
    const kycStatusInfo = {
        [KYCStatus.VERIFIED]: { text: t('verified'), color: 'text-success' },
        [KYCStatus.PENDING]: { text: t('pending'), color: 'text-brand-yellow' },
        [KYCStatus.NOT_VERIFIED]: { text: t('unverified'), color: 'text-text-secondary' },
        [KYCStatus.REJECTED]: { text: t('rejected'), color: 'text-error' },
    };
    
    const statusInfo = {
        Active: { text: t('active'), color: 'text-success' },
        Banned: { text: t('banned'), color: 'text-error' },
        Pending: { text: t('pending'), color: 'text-brand-yellow' },
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('user_details')}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-background-tertiary rounded-lg">
                    <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full"/>
                    <div className="text-center sm:text-left">
                        <h3 className="text-xl font-bold text-text-primary">{user.name}</h3>
                        <p className="text-text-secondary">{user.phoneNumber}</p>
                        <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-xs">
                             <span className={`font-semibold px-2 py-1 rounded-full ${statusInfo[user.status].color} bg-opacity-20 bg-current`}>{statusInfo[user.status].text}</span>
                             <span className={`font-semibold px-2 py-1 rounded-full ${kycStatusInfo[user.kycStatus].color} bg-opacity-20 bg-current`}>KYC: {kycStatusInfo[user.kycStatus].text}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoItem label={t('join_date')} value={user.joinDate} />
                    <InfoItem label={t('last_login')} value={user.lastLogin} />
                    <InfoItem label={t('total_volume')} value={`$${user.totalVolume.toLocaleString()}`} />
                </div>
                
                <div>
                    <h4 className="font-bold text-text-primary mb-2">{t('recent_activity')}</h4>
                    <div className="space-y-2 text-sm">
                        {userTransactions.length > 0 ? userTransactions.map(tx => (
                            <div key={tx.id} className="flex justify-between items-center p-2 bg-background-tertiary rounded-md">
                                <div>
                                    <p className="font-semibold text-text-primary">{t(tx.type.toLowerCase().replace(/ /g, '_') as any)}</p>
                                    <p className="text-xs text-text-secondary">{tx.date}</p>
                                </div>
                                <p className="font-semibold text-text-primary">${tx.amount.toLocaleString()}</p>
                            </div>
                        )) : (
                            <p className="text-text-secondary text-center p-4">{t('no_recent_activity')}</p>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const InfoItem: React.FC<{label: string, value: string}> = ({label, value}) => (
    <div className="bg-background-tertiary p-3 rounded-md">
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="font-semibold text-text-primary">{value}</p>
    </div>
);
