import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface P2PTrade {
  id: string;
  offerId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  asset: string;
  amount: number;
  fiatAmount: number;
  fiatCurrency: string;
  status: 'pending' | 'paid' | 'completed' | 'cancelled' | 'disputed';
  createdAt: string;
  completedAt?: string;
}

const TradesPage: React.FC = () => {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<P2PTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTrades();
  }, [currentPage, statusFilter]);

  const fetchTrades = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ trades: P2PTrade[]; totalPages: number }>(`/admin/p2p/trades?page=${currentPage}&status=${statusFilter}`);
      if (response.success && response.data) {
        setTrades(response.data.trades);
        setTotalPages(response.data.totalPages);
      }
    } catch {
      setTrades([]);
      setTotalPages(1);
    }
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-status-success" />;
      case 'pending': return <Clock className="w-4 h-4 text-status-warning" />;
      case 'paid': return <Clock className="w-4 h-4 text-status-info" />;
      case 'disputed': return <AlertTriangle className="w-4 h-4 text-status-error" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-text-secondary" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'badge-success',
      pending: 'badge-warning',
      paid: 'badge-info',
      disputed: 'badge-error',
      cancelled: 'bg-gray-500/20 text-gray-400',
    };
    return <span className={`badge ${styles[status] || ''}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">P2P Trades</h1>
        <p className="text-text-secondary mt-1">Monitor all P2P trade transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-text-secondary text-sm">Total Trades Today</p>
          <p className="text-2xl font-bold text-text-primary mt-1">156</p>
        </div>
        <div className="stat-card">
          <p className="text-text-secondary text-sm">In Progress</p>
          <p className="text-2xl font-bold text-status-warning mt-1">23</p>
        </div>
        <div className="stat-card">
          <p className="text-text-secondary text-sm">Completed</p>
          <p className="text-2xl font-bold text-status-success mt-1">128</p>
        </div>
        <div className="stat-card">
          <p className="text-text-secondary text-sm">Disputed</p>
          <p className="text-2xl font-bold text-status-error mt-1">5</p>
        </div>
      </div>

      <div className="bg-background-secondary p-4 rounded-xl border border-border-divider flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input type="text" placeholder="Search trades..." className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-40">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="completed">Completed</option>
          <option value="disputed">Disputed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="btn-secondary flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</button>
      </div>

      <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Trade ID</th>
                <th>Buyer</th>
                <th>Seller</th>
                <th>Asset</th>
                <th>Amount</th>
                <th>Fiat</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-8"><div className="animate-spin w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : trades.map((trade) => (
                <tr key={trade.id}>
                  <td className="font-mono text-text-primary">{trade.id}</td>
                  <td className="text-text-primary">{trade.buyerName}</td>
                  <td className="text-text-primary">{trade.sellerName}</td>
                  <td className="font-medium text-text-primary">{trade.asset}</td>
                  <td className="text-text-primary">{trade.amount.toLocaleString()}</td>
                  <td className="text-text-primary">{trade.fiatAmount.toLocaleString()} {trade.fiatCurrency}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(trade.status)}
                      {getStatusBadge(trade.status)}
                    </div>
                  </td>
                  <td className="text-text-secondary">{trade.createdAt}</td>
                  <td>
                    <button 
                      onClick={() => navigate(`/p2p/trades/${trade.id}`)}
                      className="p-2 hover:bg-background-tertiary rounded-lg"
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

export default TradesPage;
