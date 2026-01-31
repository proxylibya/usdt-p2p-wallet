
import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ADMIN_TRANSACTIONS } from '../../constants';
import { useLiveData } from '../../context/LiveDataContext';
import { DataTable, TableColumn } from '../../components/admin/DataTable';
import { TradeStatus, TransactionType } from '../../types';
import { SelectField } from '../../components/SelectField';
import { SelectModal } from '../../components/SelectModal';

const TransactionsScreen: React.FC = () => {
    const { t } = useLanguage();
    // Connect to Live Context
    const { transactions: userTransactions } = useLiveData();
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [activeFilterPicker, setActiveFilterPicker] = useState<'type' | 'status' | null>(null);
    
    const getStatusColor = (status: string) => {
        // Normalize status string
        const s = status.toLowerCase();
        if (s === 'completed') return 'bg-success/20 text-success';
        if (s === 'pending') return 'bg-brand-yellow/20 text-brand-yellow';
        if (s === 'cancelled') return 'bg-error/20 text-error';
        if (s === 'in progress') return 'bg-blue-500/20 text-blue-400';
        return 'bg-background-tertiary text-text-secondary';
    };
    
    const translateEnum = (value: string) => {
        const key = value.toLowerCase().replace(/ /g, '_');
        return t(key as any) || value;
    }

    // Merge static admin transactions with live user transactions
    const allTransactions = useMemo(() => {
        // Map user transactions to match Admin transaction shape if needed
        const mappedUserTxs = userTransactions.map(tx => ({
            id: tx.id,
            user: 'Current User', // Label for the logged-in user so admin sees their actions
            type: tx.type,
            amount: Math.abs(tx.amount), // Ensure positive display
            status: tx.status,
            date: tx.date
        }));

        // Combine recent first
        return [...mappedUserTxs, ...ADMIN_TRANSACTIONS].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [userTransactions]);

    const filteredTransactions = useMemo(() => {
        return allTransactions.filter(tx => {
            if (typeFilter && tx.type !== typeFilter) return false;
            if (statusFilter && tx.status !== statusFilter) return false;
            return true;
        });
    }, [allTransactions, typeFilter, statusFilter]);
    
    const columns: TableColumn<typeof allTransactions[0]>[] = [
        { header: t('transaction_id'), accessor: 'id', sortable: true },
        { 
            header: t('user'), 
            accessor: (tx) => (
                <span className={tx.user === 'Current User' ? 'text-brand-yellow font-bold border-b border-dashed border-brand-yellow/50' : 'text-text-primary'}>
                    {tx.user}
                </span>
            ), 
            sortable: true 
        },
        { 
            header: t('type'), 
            accessor: (tx) => translateEnum(tx.type), 
            sortable: true, 
            sortKey: 'type' 
        },
        { 
            header: t('amount'), 
            accessor: (tx) => `$${tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 
            sortable: true, 
            sortKey: 'amount' 
        },
        {
            header: t('status'),
            accessor: (tx) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                    {translateEnum(tx.status)}
                </span>
            ),
            sortable: true,
            sortKey: 'status'
        },
        { header: t('date'), accessor: 'date', sortable: true },
    ];
    
    const typeFilterLabel = typeFilter ? translateEnum(typeFilter) : t('all_types');
    const statusFilterLabel = statusFilter ? translateEnum(statusFilter) : t('all_statuses');

    const filters = (
        <div className="flex gap-3">
            <div className="min-w-[180px]">
                <SelectField
                    valueLabel={typeFilterLabel}
                    onClick={() => setActiveFilterPicker('type')}
                    className="w-full bg-background-tertiary border border-border-divider rounded-lg p-2 text-sm focus:outline-none ltr:pl-3 ltr:pr-10 rtl:pr-3 rtl:pl-10 text-text-primary"
                />
            </div>
            <div className="min-w-[180px]">
                <SelectField
                    valueLabel={statusFilterLabel}
                    onClick={() => setActiveFilterPicker('status')}
                    className="w-full bg-background-tertiary border border-border-divider rounded-lg p-2 text-sm focus:outline-none ltr:pl-3 ltr:pr-10 rtl:pr-3 rtl:pl-10 text-text-primary"
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">{t('manage_transactions')}</h1>
                <p className="text-text-secondary mt-1">{t('transactions_screen_subtitle')}</p>
            </div>
            <DataTable
                columns={columns}
                data={filteredTransactions}
                searchPlaceholder={t('search_transactions')}
                filters={filters}
            />

            <SelectModal
                isOpen={activeFilterPicker === 'type'}
                onClose={() => setActiveFilterPicker(null)}
                title={t('type')}
                value={typeFilter}
                accentColorClassName="text-brand-yellow"
                options={[
                    { value: '', label: t('all_types') },
                    { value: TransactionType.DEPOSIT, label: t('deposit') },
                    { value: TransactionType.WITHDRAW, label: t('withdraw') },
                    { value: TransactionType.P2P_BUY, label: t('p2p_buy') },
                    { value: TransactionType.P2P_SELL, label: t('p2p_sell') },
                    { value: TransactionType.SWAP_IN, label: t('swap_in') },
                    { value: TransactionType.SWAP_OUT, label: t('swap_out') },
                ]}
                onChange={(v) => setTypeFilter(v)}
            />

            <SelectModal
                isOpen={activeFilterPicker === 'status'}
                onClose={() => setActiveFilterPicker(null)}
                title={t('status')}
                value={statusFilter}
                accentColorClassName="text-brand-yellow"
                options={[
                    { value: '', label: t('all_statuses') },
                    { value: TradeStatus.COMPLETED, label: t('completed') },
                    { value: TradeStatus.PENDING, label: t('pending') },
                    { value: TradeStatus.CANCELLED, label: t('cancelled') },
                    { value: TradeStatus.IN_PROGRESS, label: t('in_progress') },
                    { value: TradeStatus.FAILED, label: t('failed') },
                ]}
                onChange={(v) => setStatusFilter(v)}
            />
        </div>
    );
};

export default TransactionsScreen;
