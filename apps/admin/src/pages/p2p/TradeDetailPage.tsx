import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface TradeDetail {
  id: string;
  offerId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  asset: string;
  amount: number;
  price: number;
  fiatAmount: number;
  fiatCurrency: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  releasedAt?: string;
  cancelledAt?: string;
  disputeReason?: string;
}

const TradeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [trade, setTrade] = useState<TradeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrade();
  }, [id]);

  const fetchTrade = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<TradeDetail>(`/admin/p2p/trades/${id}`);
      if (response.success && response.data) {
        setTrade(response.data);
      }
    } catch {
      error('Load Failed', 'Failed to load trade details');
      navigate('/p2p/trades');
    }
    setIsLoading(false);
  };

  const handleCancelTrade = async () => {
    try {
      const response = await apiClient.patch(`/admin/p2p/trades/${id}/cancel`);
      if (response.success) {
        success('Trade Cancelled', 'Trade has been cancelled');
        fetchTrade();
      }
    } catch {
      error('Action Failed', 'Failed to cancel trade');
    }
  };

  const handleReleaseFunds = async () => {
    try {
      const response = await apiClient.patch(`/admin/p2p/trades/${id}/release`);
      if (response.success) {
        success('Funds Released', 'Funds have been released to buyer');
        fetchTrade();
      }
    } catch {
      error('Action Failed', 'Failed to release funds');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="w-6 h-6 text-status-success" />;
      case 'pending': return <Clock className="w-6 h-6 text-status-warning" />;
      case 'paid': return <Clock className="w-6 h-6 text-status-info" />;
      case 'disputed': return <AlertTriangle className="w-6 h-6 text-status-error" />;
      case 'cancelled': return <XCircle className="w-6 h-6 text-text-secondary" />;
      default: return <Clock className="w-6 h-6 text-status-info" />;
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
    return <span className={`badge ${styles[status.toLowerCase()] || 'badge-info'}`}>{status}</span>;
  };

  if (isLoading || !trade) {
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
        <button onClick={() => navigate('/p2p/trades')} className="p-2 hover:bg-background-secondary rounded-lg">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Trade Details</h1>
          <p className="text-text-secondary font-mono">{trade.id}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(trade.status)}
          {getStatusBadge(trade.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trade Details */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Trade Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Asset</p>
                <p className="text-xl font-bold text-brand-yellow">{trade.asset}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Amount</p>
                <p className="text-xl font-bold text-text-primary">{trade.amount.toLocaleString()} {trade.asset}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Price</p>
                <p className="text-xl font-bold text-text-primary">{trade.price} {trade.fiatCurrency}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Fiat Amount</p>
                <p className="text-xl font-bold text-status-success">{trade.fiatAmount.toLocaleString()} {trade.fiatCurrency}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Payment Method</p>
                <p className="text-lg font-semibold text-text-primary">{trade.paymentMethod}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Offer ID</p>
                <p className="text-sm font-mono text-text-primary">{trade.offerId}</p>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Parties Involved</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background-tertiary rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-status-success/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-status-success" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Buyer</p>
                    <p className="font-medium text-text-primary">{trade.buyerName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/users/${trade.buyerId}`)}
                  className="w-full btn-secondary text-sm"
                >
                  View Profile
                </button>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-brand-yellow" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Seller</p>
                    <p className="font-medium text-text-primary">{trade.sellerName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/users/${trade.sellerId}`)}
                  className="w-full btn-secondary text-sm"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-3 h-3 mt-1.5 rounded-full bg-status-success" />
                <div>
                  <p className="font-medium text-text-primary">Trade Created</p>
                  <p className="text-sm text-text-secondary">{trade.createdAt}</p>
                </div>
              </div>
              {trade.paidAt && (
                <div className="flex gap-4">
                  <div className="w-3 h-3 mt-1.5 rounded-full bg-status-info" />
                  <div>
                    <p className="font-medium text-text-primary">Payment Marked</p>
                    <p className="text-sm text-text-secondary">{trade.paidAt}</p>
                  </div>
                </div>
              )}
              {trade.releasedAt && (
                <div className="flex gap-4">
                  <div className="w-3 h-3 mt-1.5 rounded-full bg-status-success" />
                  <div>
                    <p className="font-medium text-text-primary">Funds Released</p>
                    <p className="text-sm text-text-secondary">{trade.releasedAt}</p>
                  </div>
                </div>
              )}
              {trade.cancelledAt && (
                <div className="flex gap-4">
                  <div className="w-3 h-3 mt-1.5 rounded-full bg-status-error" />
                  <div>
                    <p className="font-medium text-text-primary">Trade Cancelled</p>
                    <p className="text-sm text-text-secondary">{trade.cancelledAt}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dispute Info */}
          {trade.status.toLowerCase() === 'disputed' && trade.disputeReason && (
            <div className="bg-status-error/10 rounded-xl border border-status-error/30 p-6">
              <h3 className="text-lg font-semibold text-status-error mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Dispute Information
              </h3>
              <p className="text-text-secondary">{trade.disputeReason}</p>
              <button 
                onClick={() => navigate(`/disputes/${trade.id}`)}
                className="btn-secondary mt-4"
              >
                View Dispute Details
              </button>
            </div>
          )}
        </div>

        {/* Sidebar - Admin Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {['pending', 'paid'].includes(trade.status.toLowerCase()) && (
            <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Admin Actions</h3>
              <div className="space-y-3">
                {trade.status.toLowerCase() === 'paid' && (
                  <button 
                    onClick={handleReleaseFunds}
                    className="w-full btn-success flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Release Funds
                  </button>
                )}
                <button 
                  onClick={handleCancelTrade}
                  className="w-full btn-danger flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Cancel Trade
                </button>
              </div>
            </div>
          )}

          {/* View Offer */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Related</h3>
            <button 
              onClick={() => navigate(`/p2p/offers/${trade.offerId}`)}
              className="w-full btn-secondary"
            >
              View Original Offer
            </button>
          </div>

          {/* Chat Link */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Communication
            </h3>
            <p className="text-sm text-text-secondary mb-3">
              View chat history between buyer and seller
            </p>
            <button className="w-full btn-secondary">
              View Chat History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeDetailPage;
