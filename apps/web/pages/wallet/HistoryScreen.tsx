
import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useLiveData } from '../../context/LiveDataContext';
import { useNotifications } from '../../context/NotificationContext';
import { Transaction, TransactionType } from '../../types';
import { TransactionList } from '../../components/TransactionList';
import { Filter, Calendar, ArrowUpDown, X, Check, Clock, ChevronDown, Download, FileSpreadsheet } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';

const HistoryScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { transactions, deleteTransaction, refreshData } = useLiveData(); 
    const { addNotification } = useNotifications();
    const [isLoading, setIsLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Active Filter State
    const [filterState, setFilterState] = useState({
        type: 'ALL',
        status: 'ALL',
        startDate: '',
        endDate: ''
    });

    // Temporary Filter State (for Modal)
    const [tempFilterState, setTempFilterState] = useState({
        type: 'ALL',
        status: 'ALL',
        startDate: '',
        endDate: ''
    });

    // Sort States
    const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'amount' | 'type'; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const handleOpenFilter = () => {
        setTempFilterState(filterState);
        setIsFilterOpen(true);
    };

    const handleApplyFilter = () => {
        setFilterState(tempFilterState);
        setIsFilterOpen(false);
    };

    const handleResetFilter = () => {
        setTempFilterState({ type: 'ALL', status: 'ALL', startDate: '', endDate: '' });
    };

    const handleQuickTypeChange = (type: string) => {
        setFilterState(prev => ({ ...prev, type }));
    };

    const handleDatePreset = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        
        setTempFilterState(prev => ({
            ...prev,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        }));
    };

    const handleDeleteTransaction = (id: string) => {
        deleteTransaction(id);
        addNotification({
            icon: 'success',
            title: t('success'),
            message: 'Transaction removed from history'
        });
    };

    const handleExport = () => {
        setIsExporting(true);
        setTimeout(() => {
            // Generate CSV
            const headers = ["ID", "Type", "Asset", "Amount", "USD Value", "Status", "Date", "TxID"];
            const rows = filteredTransactions.map(tx => [
                tx.id,
                tx.type,
                tx.asset,
                tx.amount,
                tx.usdValue,
                tx.status,
                tx.date,
                tx.txId || ''
            ]);

            const csvContent = "data:text/csv;charset=utf-8," 
                + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `statement_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setIsExporting(false);
            addNotification({
                icon: 'success',
                title: 'Export Successful',
                message: 'Statement downloaded as CSV'
            });
        }, 1500);
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const { type, status, startDate, endDate } = filterState;

            // Type Filter
            if (type !== 'ALL') {
                if (type === 'DEPOSIT' && tx.type !== TransactionType.DEPOSIT) return false;
                if (type === 'WITHDRAW' && tx.type !== TransactionType.WITHDRAW) return false;
                if (type === 'P2P' && (tx.type !== TransactionType.P2P_BUY && tx.type !== TransactionType.P2P_SELL)) return false;
                if (type === 'SWAP' && (tx.type !== TransactionType.SWAP_IN && tx.type !== TransactionType.SWAP_OUT)) return false;
                if (type === 'TRANSFER' && tx.type !== TransactionType.TRANSFER) return false;
            }

            // Status Filter
            if (status !== 'ALL') {
                if (tx.status !== status) return false;
            }

            // Robust Date Parsing (Handle "YYYY-MM-DD HH:mm" safely)
            const safeDateStr = tx.date.replace(' ', 'T');
            const txTime = new Date(safeDateStr).getTime();

            // Date Filter
            if (startDate) {
                const start = new Date(`${startDate}T00:00:00`).getTime();
                if (txTime < start) return false;
            }
            if (endDate) {
                const end = new Date(`${endDate}T23:59:59`).getTime();
                if (txTime > end) return false;
            }

            return true;
        });
    }, [transactions, filterState]);

    const sortedTransactions = useMemo(() => {
        const sorted = [...filteredTransactions].sort((a, b) => {
            let comparison = 0;
            switch (sortConfig.key) {
                case 'date':
                    // Safe parsing for sort as well
                    comparison = new Date(a.date.replace(' ', 'T')).getTime() - new Date(b.date.replace(' ', 'T')).getTime();
                    break;
                case 'amount':
                    // Sort by signed numeric value
                    comparison = a.amount - b.amount;
                    break;
                case 'type':
                    // Sort by translated label for better UX
                    const typeA = t(a.type.toLowerCase().replace(/ /g, '_') as any);
                    const typeB = t(b.type.toLowerCase().replace(/ /g, '_') as any);
                    comparison = typeA.localeCompare(typeB);
                    break;
            }
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
        return sorted;
    }, [filteredTransactions, sortConfig, t]);

    // Group by Date (Only used when sorting by date)
    const groupedTransactions = useMemo(() => {
        const groups: Record<string, Transaction[]> = {};
        sortedTransactions.forEach(tx => {
            const dateKey = tx.date.split(' ')[0]; 
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(tx);
        });
        return groups;
    }, [sortedTransactions]);

    const sortedDateKeys = Object.keys(groupedTransactions).sort((a, b) => {
        const timeA = new Date(a).getTime();
        const timeB = new Date(b).getTime();
        return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
    });

    const getDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return t('today');
        if (date.toDateString() === yesterday.toDateString()) return t('yesterday');
        
        return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const sortOptions = [
        { key: 'date', label: t('date'), ascLabel: 'Oldest First', descLabel: 'Newest First' },
        { key: 'amount', label: t('amount'), ascLabel: 'Low to High', descLabel: 'High to Low' },
        { key: 'type', label: t('type'), ascLabel: 'A-Z', descLabel: 'Z-A' },
    ];

    const isFilterActive = filterState.type !== 'ALL' || filterState.status !== 'ALL' || filterState.startDate !== '' || filterState.endDate !== '';

    return (
        <PageLayout 
            title={t('history')} 
            onRefresh={refreshData}
            action={
            <div className="flex gap-2">
                 <button 
                    onClick={handleExport}
                    disabled={isExporting} 
                    className={`p-2 rounded-full hover:bg-background-tertiary transition-colors ${isExporting ? 'text-text-secondary' : (primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green')}`}
                    title="Export Statement"
                >
                    {isExporting ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <FileSpreadsheet className="w-5 h-5" />}
                </button>
                 <button onClick={() => setIsSortOpen(true)} className={`p-2 rounded-full hover:bg-background-tertiary transition-colors ${sortConfig.key !== 'date' || sortConfig.direction !== 'desc' ? (primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green') : 'text-text-secondary'}`}>
                    <ArrowUpDown className="w-5 h-5" />
                </button>
                <button onClick={handleOpenFilter} className={`relative p-2 rounded-full hover:bg-background-tertiary transition-colors ${isFilterActive ? (primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green') : 'text-text-secondary'}`}>
                    <Filter className="w-5 h-5" />
                    {isFilterActive && <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${primaryColor === 'brand-yellow' ? 'bg-primary-gold' : 'bg-primary-green'} border border-background-primary`}></span>}
                </button>
            </div>
        }>
            <div className="flex flex-col h-full">
                {/* Quick Type Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-4 mb-2 -mx-4 px-4 items-center">
                    {['ALL', 'DEPOSIT', 'WITHDRAW', 'P2P', 'SWAP', 'TRANSFER'].map(type => (
                        <button
                            key={type}
                            onClick={() => handleQuickTypeChange(type)}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                                filterState.type === type 
                                ? (primaryColor === 'brand-yellow' ? 'bg-primary-gold text-background-primary border-primary-gold' : 'bg-primary-green text-background-primary border-primary-green') 
                                : 'bg-background-secondary text-text-secondary border-border-divider/50 hover:text-text-primary'
                            }`}
                        >
                            {type === 'ALL' ? t('all_transactions') : t(type.toLowerCase() as any)}
                        </button>
                    ))}
                </div>

                {/* Active Filter Badges */}
                {(filterState.startDate || filterState.endDate || filterState.status !== 'ALL') && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {filterState.status !== 'ALL' && (
                            <div className="flex items-center gap-1.5 bg-background-tertiary px-3 py-1.5 rounded-lg text-xs text-text-primary border border-border-divider font-medium">
                                <span className="text-text-secondary">{t('status')}:</span> {t(filterState.status.toLowerCase() as any)}
                                <button onClick={() => setFilterState(prev => ({ ...prev, status: 'ALL' }))} className="p-0.5 rounded-full hover:bg-background-secondary"><X className="w-3 h-3" /></button>
                            </div>
                        )}
                        {(filterState.startDate || filterState.endDate) && (
                            <div className="flex items-center gap-1.5 bg-background-tertiary px-3 py-1.5 rounded-lg text-xs text-text-primary border border-border-divider font-medium">
                                <Calendar className="w-3 h-3 text-text-secondary" />
                                <span>{filterState.startDate || '...'}</span>
                                <span className="text-text-secondary">→</span>
                                <span>{filterState.endDate || '...'}</span>
                                <button onClick={() => setFilterState(prev => ({ ...prev, startDate: '', endDate: '' }))} className="p-0.5 rounded-full hover:bg-background-secondary"><X className="w-3 h-3" /></button>
                            </div>
                        )}
                         <button onClick={() => setFilterState({ type: 'ALL', status: 'ALL', startDate: '', endDate: '' })} className={`text-xs ${primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green'} font-bold px-2 hover:underline`}>{t('clear_all')}</button>
                    </div>
                )}

                <div className="flex-grow space-y-6 pb-6">
                    {isLoading ? (
                         <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <SkeletonLoader key={i} className="h-16 w-full rounded-lg" />)}
                         </div>
                    ) : sortedTransactions.length > 0 ? (
                        sortConfig.key === 'date' ? (
                            sortedDateKeys.map(dateKey => (
                                <div key={dateKey}>
                                    <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2 sticky top-0 bg-background-primary py-2 z-10 opacity-95 backdrop-blur-sm px-1">{getDateLabel(dateKey)}</h3>
                                    <TransactionList transactions={groupedTransactions[dateKey]} onDelete={handleDeleteTransaction} />
                                </div>
                            ))
                        ) : (
                             <TransactionList transactions={sortedTransactions} onDelete={handleDeleteTransaction} />
                        )
                    ) : (
                        <div className="pt-20">
                             <EmptyState 
                                icon={Calendar} 
                                title="No transactions found" 
                                message="Try adjusting your filters or check a different date range." 
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Modal */}
            <Modal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title={t('filter')}>
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-text-secondary mb-2 block uppercase tracking-wide">{t('transaction_type')}</label>
                        <div className="grid grid-cols-2 gap-2">
                             {['ALL', 'DEPOSIT', 'WITHDRAW', 'P2P', 'SWAP', 'TRANSFER'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setTempFilterState(prev => ({ ...prev, type }))}
                                    className={`py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${
                                        tempFilterState.type === type 
                                        ? (primaryColor === 'brand-yellow' ? 'border-primary-gold bg-primary-gold/10 text-primary-gold shadow-sm' : 'border-primary-green bg-primary-green/10 text-primary-green shadow-sm') 
                                        : 'border-border-divider bg-background-tertiary text-text-secondary hover:bg-background-secondary'
                                    }`}
                                >
                                    {type === 'ALL' ? t('all_transactions') : t(type.toLowerCase() as any)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-text-secondary mb-2 block uppercase tracking-wide">{t('status')}</label>
                        <div className="grid grid-cols-2 gap-2">
                             {['ALL', 'Completed', 'Pending', 'Failed'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setTempFilterState(prev => ({ ...prev, status }))}
                                    className={`py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${
                                        tempFilterState.status === status 
                                        ? `border-${primaryColor} bg-${primaryColor}/10 text-${primaryColor} shadow-sm` 
                                        : 'border-border-divider bg-background-tertiary text-text-secondary hover:bg-background-secondary'
                                    }`}
                                >
                                    {status === 'ALL' ? t('all_statuses') : t(status.toLowerCase() as any)}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wide">{t('date_range')}</label>
                        </div>
                        
                        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                            {[
                                { label: 'Last 7 Days', days: 7 }, 
                                { label: 'Last 30 Days', days: 30 },
                                { label: 'Last 90 Days', days: 90 }
                            ].map(preset => (
                                <button 
                                    key={preset.days}
                                    onClick={() => handleDatePreset(preset.days)}
                                    className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-background-tertiary border border-border-divider text-xs font-medium text-text-primary hover:bg-background-secondary transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-text-secondary block mb-1.5 font-medium">{t('start_date')}</span>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        className="w-full bg-background-tertiary border border-border-divider rounded-xl p-3 text-sm focus:outline-none focus:border-brand-yellow text-text-primary transition-colors appearance-none"
                                        value={tempFilterState.startDate}
                                        onChange={(e) => setTempFilterState(prev => ({...prev, startDate: e.target.value}))}
                                        style={{ colorScheme: 'dark' }} 
                                    />
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-text-secondary block mb-1.5 font-medium">{t('end_date')}</span>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        className="w-full bg-background-tertiary border border-border-divider rounded-xl p-3 text-sm focus:outline-none focus:border-brand-yellow text-text-primary transition-colors appearance-none"
                                        value={tempFilterState.endDate}
                                        onChange={(e) => setTempFilterState(prev => ({...prev, endDate: e.target.value}))}
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                            onClick={handleResetFilter}
                            className="flex-1 p-3.5 rounded-xl font-bold bg-background-tertiary text-text-primary hover:bg-border-divider transition-colors"
                        >
                            {t('reset_filters')}
                        </button>
                        <button 
                            onClick={handleApplyFilter}
                            className={`flex-1 p-3.5 rounded-xl font-bold text-background-primary bg-${primaryColor} shadow-lg shadow-${primaryColor}/20 transition-transform active:scale-95`}
                        >
                            {t('apply')}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Sort Modal */}
            <Modal isOpen={isSortOpen} onClose={() => setIsSortOpen(false)} title={t('sort_by')}>
                 <div className="space-y-3">
                    {sortOptions.map((option) => {
                        const isActiveKey = sortConfig.key === option.key;
                        return (
                            <div key={option.key} className={`bg-background-tertiary rounded-xl overflow-hidden border transition-colors ${isActiveKey ? `border-${primaryColor}/50` : 'border-transparent'}`}>
                                <div className="flex items-center justify-between p-3 border-b border-border-divider/50 bg-background-secondary/50">
                                    <span className={`font-bold text-sm ${isActiveKey ? `text-${primaryColor}` : 'text-text-primary'}`}>{option.label}</span>
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-border-divider/50">
                                    <button 
                                        onClick={() => { setSortConfig({ key: option.key as any, direction: 'asc' }); setIsSortOpen(false); }}
                                        className={`p-3 text-sm text-center transition-colors relative ${isActiveKey && sortConfig.direction === 'asc' ? `text-${primaryColor} font-bold bg-${primaryColor}/10` : 'text-text-secondary hover:bg-background-secondary hover:text-text-primary'}`}
                                    >
                                        {option.ascLabel}
                                        {isActiveKey && sortConfig.direction === 'asc' && <Check className="w-3.5 h-3.5 absolute top-1/2 right-2 -translate-y-1/2" />}
                                    </button>
                                    <button 
                                        onClick={() => { setSortConfig({ key: option.key as any, direction: 'desc' }); setIsSortOpen(false); }}
                                        className={`p-3 text-sm text-center transition-colors relative ${isActiveKey && sortConfig.direction === 'desc' ? `text-${primaryColor} font-bold bg-${primaryColor}/10` : 'text-text-secondary hover:bg-background-secondary hover:text-text-primary'}`}
                                    >
                                        {option.descLabel}
                                        {isActiveKey && sortConfig.direction === 'desc' && <Check className="w-3.5 h-3.5 absolute top-1/2 right-2 -translate-y-1/2" />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Modal>
        </PageLayout>
    );
};

export default HistoryScreen;
