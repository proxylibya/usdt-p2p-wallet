import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface TransactionDetail {
  id: string;
  type: string;
  userId: string;
  userName: string;
  userPhone: string;
  asset: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: string;
  txHash?: string;
  address?: string;
  network: string;
  createdAt: string;
  completedAt?: string;
  adminNote?: string;
}

const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<TransactionDetail>(`/admin/transactions/${id}`);
      if (response.success && response.data) {
        setTransaction(response.data);
        setAdminNote(response.data.adminNote || '');
      }
    } catch {
      error('Load Failed', 'Failed to load transaction details');
      navigate('/transactions');
    }
    setIsLoading(false);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const response = await apiClient.put(`/admin/transactions/${id}`, { 
        status: newStatus,
        adminNote 
      });
      if (response.success) {
        success('Status Updated', `Transaction marked as ${newStatus}`);
        fetchTransaction();
      }
    } catch {
      error('Update Failed', 'Failed to update transaction status');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Copied', 'Copied to clipboard');
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="w-6 h-6 text-status-success" />;
      case 'pending': return <Clock className="w-6 h-6 text-status-warning" />;
      case 'failed': return <XCircle className="w-6 h-6 text-status-error" />;
      case 'cancelled': return <XCircle className="w-6 h-6 text-text-secondary" />;
      default: return <AlertTriangle className="w-6 h-6 text-status-info" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'badge-success',
      pending: 'badge-warning',
      processing: 'badge-info',
      failed: 'badge-error',
      cancelled: 'bg-gray-500/20 text-gray-400',
    };
    return <span className={`badge ${styles[status.toLowerCase()] || 'badge-info'}`}>{status}</span>;
  };

  if (isLoading || !transaction) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/transactions')} className="p-2 hover:bg-background-secondary rounded-lg">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Transaction Details</h1>
          <p className="text-text-secondary font-mono">{transaction.id}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(transaction.status)}
          {getStatusBadge(transaction.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Info */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Transaction Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Type</p>
                <p className="text-lg font-semibold text-text-primary capitalize">{transaction.type}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Asset</p>
                <p className="text-lg font-semibold text-text-primary">{transaction.asset}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Amount</p>
                <p className="text-lg font-semibold text-brand-yellow">{transaction.amount.toLocaleString()} {transaction.asset}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Fee</p>
                <p className="text-lg font-semibold text-text-primary">{transaction.fee} {transaction.asset}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Network</p>
                <p className="text-lg font-semibold text-text-primary">{transaction.network}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Net Amount</p>
                <p className="text-lg font-semibold text-status-success">{transaction.netAmount || (transaction.amount - transaction.fee)} {transaction.asset}</p>
              </div>
            </div>
          </div>

          {/* Blockchain Info */}
          {(transaction.txHash || transaction.address) && (
            <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Blockchain Details</h3>
              <div className="space-y-4">
                {transaction.txHash && (
                  <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-text-secondary">Transaction Hash</p>
                      <p className="font-mono text-text-primary truncate">{transaction.txHash}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copyToClipboard(transaction.txHash!)} className="p-2 hover:bg-background-secondary rounded-lg">
                        <Copy className="w-4 h-4 text-text-secondary" />
                      </button>
                      <a href={`https://tronscan.org/#/transaction/${transaction.txHash}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-background-secondary rounded-lg">
                        <ExternalLink className="w-4 h-4 text-text-secondary" />
                      </a>
                    </div>
                  </div>
                )}
                {transaction.address && (
                  <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-text-secondary">Address</p>
                      <p className="font-mono text-text-primary truncate">{transaction.address}</p>
                    </div>
                    <button onClick={() => copyToClipboard(transaction.address!)} className="p-2 hover:bg-background-secondary rounded-lg">
                      <Copy className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-3 h-3 mt-1.5 rounded-full bg-status-success" />
                <div>
                  <p className="font-medium text-text-primary">Transaction Created</p>
                  <p className="text-sm text-text-secondary">{transaction.createdAt}</p>
                </div>
              </div>
              {transaction.completedAt && (
                <div className="flex gap-4">
                  <div className="w-3 h-3 mt-1.5 rounded-full bg-status-success" />
                  <div>
                    <p className="font-medium text-text-primary">Transaction Completed</p>
                    <p className="text-sm text-text-secondary">{transaction.completedAt}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">User Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Name</span>
                <span className="text-text-primary">{transaction.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Phone</span>
                <span className="text-text-primary">{transaction.userPhone}</span>
              </div>
              <button 
                onClick={() => navigate(`/users/${transaction.userId}`)}
                className="w-full btn-secondary mt-2"
              >
                View User Profile
              </button>
            </div>
          </div>

          {/* Admin Actions */}
          {transaction.status.toLowerCase() === 'pending' && (
            <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Admin Actions</h3>
              <div className="space-y-3">
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add admin note..."
                  className="input-field h-24 resize-none"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    className="flex-1 btn-success"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus('FAILED')}
                    className="flex-1 btn-danger"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Admin Note */}
          {transaction.adminNote && (
            <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Admin Note</h3>
              <p className="text-text-secondary">{transaction.adminNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailPage;
