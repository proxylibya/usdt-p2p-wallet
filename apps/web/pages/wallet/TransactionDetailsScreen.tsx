
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { Transaction } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useLiveData } from '../../context/LiveDataContext';
import { CopyIcon } from '../../components/icons/CopyIcon';
import { ExternalLink, CheckCircle, Clock, XCircle, ArrowDownLeft, ArrowUpRight, Share2, Download } from 'lucide-react';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { useNotifications } from '../../context/NotificationContext';

const TransactionDetailsScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t } = useLanguage();
    const { formatCurrency } = useCurrency();
    const { addNotification } = useNotifications();
    const { transactions, isLoading, wallets } = useLiveData();
    const [transaction, setTransaction] = useState<Transaction | null | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (id) {
            // Find transaction in live data first
            const foundTx = transactions.find(tx => tx.id === id);
            
            if (foundTx) {
                setTransaction(foundTx);
            } else if (!isLoading) {
                // Only set to null (Not Found) if we are done loading
                setTransaction(null);
            }
        }
    }, [id, transactions, isLoading]);

    const handleShare = async () => {
        if (!transaction) return;
        
        const shareText = `Transaction Receipt\n` +
            `------------------\n` +
            `Amount: ${transaction.amount > 0 ? '+' : ''}${transaction.amount} ${transaction.asset}\n` +
            `Status: ${transaction.status}\n` +
            `Date: ${transaction.date}\n` +
            `TXID: ${transaction.txId || 'N/A'}`;

        const shareData: ShareData = {
            title: 'Transaction Receipt',
            text: shareText,
        };

        if (window.location.protocol.startsWith('http')) {
            shareData.url = window.location.href;
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch {
                // Share dismissed
            }
        } else {
            handleCopy(shareText);
            addNotification({ icon: 'info', title: 'Copied', message: 'Receipt details copied to clipboard' });
        }
    };

    const handleSaveReceipt = () => {
        setIsSaving(true);
        // Simulate image generation delay
        setTimeout(() => {
            setIsSaving(false);
            addNotification({ icon: 'success', title: 'Saved', message: 'Receipt saved to gallery' });
        }, 1500);
    };

    if (transaction === undefined || (isLoading && !transaction)) {
        return (
            <PageLayout title={t('transaction_details')}>
                <div className="space-y-6 px-4 pt-4">
                    <SkeletonLoader className="h-48 w-full rounded-2xl" />
                    <SkeletonLoader className="h-64 w-full rounded-2xl" />
                </div>
            </PageLayout>
        );
    }

    if (!transaction) {
        return <PageLayout title={t('error')}><div className="p-6 text-center text-text-secondary">{t('transaction_not_found')}</div></PageLayout>;
    }
    
    const isIncome = transaction.amount > 0;
    
    const walletNetwork = wallets.find(w => w.symbol === transaction.asset)?.network;
    const network = transaction.network || walletNetwork || 'Unknown';
    const networkLabel = network === 'Unknown' ? t('no_data') : network;

    const getExplorerUrl = (txId: string, net: string) => {
        let baseUrl = 'https://etherscan.io/tx/';
        const n = net.toUpperCase();
        if (n.includes('TRC') || n.includes('TRON')) baseUrl = 'https://tronscan.org/#/transaction/';
        else if (n.includes('BSC') || n.includes('BEP')) baseUrl = 'https://bscscan.com/tx/';
        else if (n.includes('SOL')) baseUrl = 'https://solscan.io/tx/';
        else if (n.includes('POLYGON')) baseUrl = 'https://polygonscan.com/tx/';
        
        return `${baseUrl}${txId}`;
    };

    const explorerUrl = transaction.txId && network !== 'Unknown' ? getExplorerUrl(transaction.txId, network) : '#';

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        addNotification({ icon: 'success', title: 'Copied', message: 'Copied to clipboard' });
    };

    const StatusIcon = () => {
        switch(transaction.status) {
            case 'Completed': return <CheckCircle className="w-12 h-12 text-success" />;
            case 'Pending': return <Clock className="w-12 h-12 text-brand-yellow" />;
            case 'Failed': return <XCircle className="w-12 h-12 text-error" />;
            default: return <CheckCircle className="w-12 h-12 text-text-secondary" />;
        }
    };

    const DetailRow: React.FC<{ label: string; value?: string | number; children?: React.ReactNode; copyValue?: string }> = ({ label, value, children, copyValue }) => (
        <div className="flex justify-between items-center py-4 border-b border-border-divider/50 last:border-0">
            <span className="text-text-secondary text-sm font-medium">{label}</span>
            <div className="flex items-center gap-2 max-w-[60%]">
                {value && <span className="font-medium text-text-primary text-end truncate">{value}</span>}
                {children}
                {copyValue && (
                    <button onClick={() => handleCopy(copyValue)} className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-md hover:bg-background-tertiary">
                        <CopyIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <PageLayout title={t('transaction_details')}>
            <div className="flex flex-col space-y-6 px-4 pt-4 pb-10">
                {/* Header Card */}
                <div id="receipt-card" className="flex flex-col items-center text-center p-8 bg-background-secondary rounded-2xl shadow-sm border border-border-divider/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-yellow to-transparent opacity-50"></div>
                    <div className="mb-4 p-3 bg-background-tertiary/50 rounded-full">
                        <StatusIcon />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                         <span className={`text-3xl font-bold tracking-tight ${isIncome ? 'text-success' : 'text-text-primary'}`}>
                            {isIncome ? '+' : ''}{Math.abs(transaction.amount).toLocaleString()}
                        </span>
                        <span className="text-xl font-bold text-text-secondary">{transaction.asset}</span>
                    </div>
                    <p className="text-sm text-text-secondary font-medium">{formatCurrency(Math.abs(transaction.usdValue))}</p>
                    <div className={`mt-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-background-tertiary ${transaction.status === 'Completed' ? 'text-success' : transaction.status === 'Pending' ? 'text-brand-yellow' : 'text-error'}`}>
                        {t(transaction.status.toLowerCase() as any)}
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button onClick={handleSaveReceipt} className="flex-1 flex items-center justify-center gap-2 p-3 bg-background-secondary rounded-xl border border-border-divider hover:bg-background-tertiary transition-colors font-semibold text-sm">
                        {isSaving ? <span className="w-4 h-4 rounded-full border-2 border-text-secondary border-t-transparent animate-spin"></span> : <Download className="w-4 h-4" />}
                        {isSaving ? 'Saving...' : t('save_image')}
                    </button>
                    <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 p-3 bg-background-secondary rounded-xl border border-border-divider hover:bg-background-tertiary transition-colors font-semibold text-sm">
                        <Share2 className="w-4 h-4" />
                        {t('share')}
                    </button>
                </div>
                
                {/* Details List */}
                <div className="bg-background-secondary rounded-2xl px-5 shadow-sm border border-border-divider/30">
                     <DetailRow label={t('date')} value={transaction.date} />
                     <DetailRow label={t('type')}>
                        <div className="flex items-center gap-2">
                            {isIncome ? <ArrowDownLeft className="w-4 h-4 text-success" /> : <ArrowUpRight className="w-4 h-4 text-text-primary" />}
                            <span className="text-text-primary font-medium">{t(transaction.type.toLowerCase().replace(/ /g, '_') as any)}</span>
                        </div>
                     </DetailRow>
                     <DetailRow label={t('network')} value={network} />
                     
                     {transaction.networkFee !== undefined && transaction.networkFee !== null && (
                        <DetailRow label={t('network_fee')} value={`${transaction.networkFee} ${transaction.asset}`} />
                     )}

                     {transaction.fromAddress && (
                         <DetailRow 
                            label={t('from_address')} 
                            value={`${transaction.fromAddress.substring(0, 8)}...${transaction.fromAddress.substring(transaction.fromAddress.length - 6)}`}
                            copyValue={transaction.fromAddress}
                        />
                     )}
                     {transaction.toAddress && (
                         <DetailRow 
                            label={t('to_address')} 
                            value={`${transaction.toAddress.substring(0, 8)}...${transaction.toAddress.substring(transaction.toAddress.length - 6)}`}
                            copyValue={transaction.toAddress}
                        />
                     )}
                     {transaction.txId && (
                         <DetailRow 
                            label={t('transaction_id_txid')} 
                            value={`${transaction.txId.substring(0, 10)}...`}
                            copyValue={transaction.txId}
                        />
                     )}
                </div>

                {transaction.txId && (
                    <div className="mt-auto pt-4">
                        <a 
                            href={explorerUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full p-4 rounded-xl bg-background-secondary text-sm font-bold text-brand-yellow hover:bg-background-tertiary transition-colors border border-border-divider/50 hover:border-brand-yellow/50"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>{t('view_on_explorer')}</span>
                        </a>
                    </div>
                )}
            </div>
        </PageLayout>
    );
};

export default TransactionDetailsScreen;
