import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, DollarSign, Clock, Play, Pause, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface OfferDetail {
  id: string;
  type: 'BUY' | 'SELL';
  userId: string;
  userName: string;
  userPhone: string;
  asset: string;
  fiatCurrency: string;
  price: number;
  available: number;
  totalAmount: number;
  minLimit: number;
  maxLimit: number;
  paymentMethods: string[];
  terms?: string;
  isActive: boolean;
  completedTrades: number;
  createdAt: string;
  updatedAt: string;
}

const OfferDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOffer();
  }, [id]);

  const fetchOffer = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<OfferDetail>(`/admin/p2p/offers/${id}`);
      if (response.success && response.data) {
        setOffer(response.data);
      }
    } catch {
      error('Load Failed', 'Failed to load offer details');
      navigate('/p2p/offers');
    }
    setIsLoading(false);
  };

  const handleToggleStatus = async () => {
    if (!offer) return;
    try {
      const endpoint = offer.isActive 
        ? `/admin/p2p/offers/${id}/suspend`
        : `/admin/p2p/offers/${id}/activate`;
      const response = await apiClient.patch(endpoint);
      if (response.success) {
        success('Status Updated', `Offer has been ${offer.isActive ? 'suspended' : 'activated'}`);
        fetchOffer();
      }
    } catch {
      error('Action Failed', 'Failed to update offer status');
    }
  };

  if (isLoading || !offer) {
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
        <button onClick={() => navigate('/p2p/offers')} className="p-2 hover:bg-background-secondary rounded-lg">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Offer Details</h1>
          <p className="text-text-secondary font-mono">{offer.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${offer.type === 'SELL' ? 'badge-success' : 'badge-error'}`}>
            {offer.type}
          </span>
          <span className={`badge ${offer.isActive ? 'badge-success' : 'badge-warning'}`}>
            {offer.isActive ? 'Active' : 'Paused'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Offer Details */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Offer Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Asset</p>
                <p className="text-xl font-bold text-brand-yellow">{offer.asset}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Price</p>
                <p className="text-xl font-bold text-text-primary">{offer.price} {offer.fiatCurrency}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Available</p>
                <p className="text-xl font-bold text-status-success">{offer.available.toLocaleString()} {offer.asset}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Min Limit</p>
                <p className="text-lg font-semibold text-text-primary">{offer.minLimit} {offer.fiatCurrency}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Max Limit</p>
                <p className="text-lg font-semibold text-text-primary">{offer.maxLimit} {offer.fiatCurrency}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Completed Trades</p>
                <p className="text-lg font-semibold text-text-primary">{offer.completedTrades}</p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Payment Methods</h3>
            <div className="flex flex-wrap gap-2">
              {offer.paymentMethods.map((method, idx) => (
                <span key={idx} className="px-4 py-2 bg-background-tertiary rounded-lg text-text-primary">
                  {method}
                </span>
              ))}
            </div>
          </div>

          {/* Terms */}
          {offer.terms && (
            <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Terms & Conditions</h3>
              <p className="text-text-secondary whitespace-pre-wrap">{offer.terms}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Clock className="w-5 h-5 text-text-secondary" />
                <div>
                  <p className="text-text-primary">Created</p>
                  <p className="text-sm text-text-secondary">{offer.createdAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Clock className="w-5 h-5 text-text-secondary" />
                <div>
                  <p className="text-text-primary">Last Updated</p>
                  <p className="text-sm text-text-secondary">{offer.updatedAt}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Merchant Info */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> Merchant
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Name</span>
                <span className="text-text-primary">{offer.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Phone</span>
                <span className="text-text-primary">{offer.userPhone}</span>
              </div>
              <button 
                onClick={() => navigate(`/users/${offer.userId}`)}
                className="w-full btn-secondary mt-2"
              >
                View Profile
              </button>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Admin Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={handleToggleStatus}
                className={`w-full flex items-center justify-center gap-2 ${
                  offer.isActive 
                    ? 'btn-danger' 
                    : 'btn-success'
                }`}
              >
                {offer.isActive ? (
                  <>
                    <Pause className="w-4 h-4" /> Suspend Offer
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Activate Offer
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Total Volume</span>
                <span className="text-text-primary font-semibold">{offer.totalAmount?.toLocaleString() || 0} {offer.asset}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Success Rate</span>
                <span className="text-status-success font-semibold">98%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferDetailPage;
