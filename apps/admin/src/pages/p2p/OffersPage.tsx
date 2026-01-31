import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Ban, CheckCircle, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface P2POffer {
  id: string;
  type: 'BUY' | 'SELL';
  userId: string;
  userName: string;
  asset: string;
  fiatCurrency: string;
  price: number;
  available: number;
  minLimit: number;
  maxLimit: number;
  paymentMethods: string[];
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  trades: number;
  createdAt: string;
}

const OffersPage: React.FC = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<P2POffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    fetchOffers();
  }, [currentPage, typeFilter]);

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ offers: P2POffer[]; totalPages: number }>(`/admin/p2p/offers?page=${currentPage}&type=${typeFilter}`);
      if (response.success && response.data) {
        setOffers(response.data.offers);
        setTotalPages(response.data.totalPages);
      }
    } catch {
      error('Load Failed', 'Failed to fetch offers');
      setOffers([]);
      setTotalPages(1);
    }
    setIsLoading(false);
  };

  const handleSuspendOffer = async (offerId: string) => {
    try {
      await apiClient.patch(`/admin/p2p/offers/${offerId}/suspend`);
      success('Offer Suspended', 'Offer has been suspended successfully');
      fetchOffers();
    } catch {
      error('Action Failed', 'Failed to suspend offer');
    }
    setSelectedOffer(null);
  };

  const handleActivateOffer = async (offerId: string) => {
    try {
      await apiClient.patch(`/admin/p2p/offers/${offerId}/activate`);
      success('Offer Activated', 'Offer has been activated successfully');
      fetchOffers();
    } catch {
      error('Action Failed', 'Failed to activate offer');
    }
    setSelectedOffer(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">P2P Offers</h1>
        <p className="text-text-secondary mt-1">Manage all P2P marketplace offers</p>
      </div>

      <div className="bg-background-secondary p-4 rounded-xl border border-border-divider flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input type="text" placeholder="Search offers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-10" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field w-32">
          <option value="all">All Types</option>
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
        <button className="btn-secondary flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</button>
      </div>

      <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Merchant</th>
                <th>Asset</th>
                <th>Price</th>
                <th>Available</th>
                <th>Limits</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Trades</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={11} className="text-center py-8"><div className="animate-spin w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : offers.map((offer) => (
                <tr key={offer.id}>
                  <td className="font-mono text-text-primary">{offer.id}</td>
                  <td>
                    <span className={`badge ${offer.type === 'SELL' ? 'badge-success' : 'badge-error'}`}>{offer.type}</span>
                  </td>
                  <td className="text-text-primary">{offer.userName}</td>
                  <td className="font-medium text-text-primary">{offer.asset}</td>
                  <td className="text-text-primary">{offer.price} {offer.fiatCurrency}</td>
                  <td className="text-text-primary">{offer.available.toLocaleString()}</td>
                  <td className="text-text-secondary text-sm">{offer.minLimit}-{offer.maxLimit}</td>
                  <td className="text-text-secondary text-sm">{offer.paymentMethods.slice(0, 2).join(', ')}</td>
                  <td>
                    <span className={`badge ${offer.status === 'active' ? 'badge-success' : offer.status === 'paused' ? 'badge-warning' : 'badge-info'}`}>{offer.status}</span>
                  </td>
                  <td className="text-text-primary">{offer.trades}</td>
                  <td>
                    <div className="relative">
                      <button onClick={() => setSelectedOffer(selectedOffer === offer.id ? null : offer.id)} className="p-2 hover:bg-background-tertiary rounded-lg">
                        <MoreVertical className="w-4 h-4 text-text-secondary" />
                      </button>
                      {selectedOffer === offer.id && (
                        <div className="absolute right-0 top-full mt-1 bg-background-tertiary border border-border-divider rounded-lg shadow-xl z-10 py-1 min-w-36">
                          <button 
                            onClick={() => { setSelectedOffer(null); navigate(`/p2p/offers/${offer.id}`); }}
                            className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-background-secondary flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          {offer.status === 'active' ? (
                            <button onClick={() => handleSuspendOffer(offer.id)} className="w-full px-4 py-2 text-left text-sm text-status-error hover:bg-background-secondary flex items-center gap-2">
                              <Ban className="w-4 h-4" /> Suspend
                            </button>
                          ) : (
                            <button onClick={() => handleActivateOffer(offer.id)} className="w-full px-4 py-2 text-left text-sm text-status-success hover:bg-background-secondary flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" /> Activate
                            </button>
                          )}
                        </div>
                      )}
                    </div>
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

export default OffersPage;
