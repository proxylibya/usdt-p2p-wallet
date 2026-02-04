import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, ChevronLeft, ChevronRight, Eye, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { exportToCSV } from '../../utils/exportCSV';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'p2p_buy' | 'p2p_sell' | 'swap' | 'transfer';
  userId: string;
  userName: string;
  asset: string;
  amount: number;
  fee: number;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  txHash?: string;
  createdAt: string;
}

const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, typeFilter, statusFilter]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ transactions: Transaction[]; totalPages: number }>(
        `/admin/transactions?page=${currentPage}&type=${typeFilter}&status=${statusFilter}`
      );
      if (response.success && response.data) {
        setTransactions(response.data.transactions);
        setTotalPages(response.data.totalPages);
      }
    } catch {
      setTransactions([]);
      setTotalPages(1);
    }
    setIsLoading(false);
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      deposit: 'bg-status-success/20 text-status-success',
      withdrawal: 'bg-status-error/20 text-status-error',
      p2p_buy: 'bg-status-info/20 text-status-info',
      p2p_sell: 'bg-brand-yellow/20 text-brand-yellow',
      swap: 'bg-purple-500/20 text-purple-400',
      transfer: 'bg-gray-500/20 text-gray-400',
    };
    return <span className={`badge ${styles[type] || 'badge-info'}`}>{type.replace('_', ' ')}</span>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="badge badge-success">Completed</span>;
      case 'pending': return <span className="badge badge-warning">Pending</span>;
      case 'failed': return <span className="badge badge-error">Failed</span>;
      case 'cancelled': return <span className="badge badge-info">Cancelled</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'deposit' || type === 'p2p_buy') {
      return <ArrowDownLeft className="w-4 h-4 text-status-success" />;
    }
    return <ArrowUpRight className="w-4 h-4 text-status-error" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Transactions</h1>
          <p className="text-text-secondary mt-1">Monitor all platform transactions</p>
        </div>
        <button 
          onClick={() => exportToCSV(transactions as unknown as Record<string, unknown>[], 'transactions')}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-background-secondary p-4 rounded-xl border border-border-divider flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by ID, user, or hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field w-40">
          <option value="all">All Types</option>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="p2p_buy">P2P Buy</option>
          <option value="p2p_sell">P2P Sell</option>
          <option value="swap">Swap</option>
          <option value="transfer">Transfer</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-40">
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <button className="btn-secondary flex items-center gap-2">
          <Filter className="w-4 h-4" /> More
        </button>
      </div>

      <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="overflow-x-auto">
          <table className="data-table data-table-animated">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>User</th>
                <th>Asset</th>
                <th>Amount</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-8"><div className="animate-spin w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-text-secondary">No transactions found</td></tr>
              ) : transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-text-primary">{tx.id}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(tx.type)}
                      {getTypeBadge(tx.type)}
                    </div>
                  </td>
                  <td className="text-text-primary">{tx.userName}</td>
                  <td className="font-medium text-text-primary">{tx.asset}</td>
                  <td className="font-medium text-text-primary">{tx.amount.toLocaleString()}</td>
                  <td className="text-text-secondary">{tx.fee}</td>
                  <td>{getStatusBadge(tx.status)}</td>
                  <td className="text-text-secondary">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => navigate(`/transactions/${tx.id}`)}
                      className="p-2 hover:bg-background-tertiary rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      <Eye className="w-4 h-4 text-text-secondary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-divider">
          <p className="text-sm text-text-secondary">Page {currentPage} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="btn-secondary p-2 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="btn-secondary p-2 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
