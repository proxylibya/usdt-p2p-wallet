import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Pause, TrendingUp, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface StakingProduct {
  id: string;
  asset: string;
  apy: number;
  durationDays: number;
  minAmount: number;
  maxAmount: number | null;
  isActive: boolean;
  _count?: {
    subscriptions: number;
  };
}

const StakingPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<StakingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<StakingProduct[]>('/admin/earn/products');
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch {
      error('Error', 'Failed to load staking products');
    }
    setIsLoading(false);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await apiClient.patch(`/admin/earn/products/${id}/status`, {
        isActive: !currentStatus,
      });
      if (response.success) {
        success('Success', `Product ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchProducts();
      }
    } catch {
      error('Error', 'Failed to update status');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Staking Products</h1>
          <p className="text-text-secondary mt-1">Manage Earn products and APY rates</p>
        </div>
        <button
          onClick={() => navigate('/earn/products/create')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                  <span className="font-bold text-brand-yellow">{product.asset[0]}</span>
                </div>
                <div>
                  <h3 className="font-bold text-text-primary">{product.asset}</h3>
                  <span className="text-xs text-text-secondary">
                    {product.durationDays === 0 ? 'Flexible' : `${product.durationDays} Days`}
                  </span>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                product.isActive ? 'bg-status-success/20 text-status-success' : 'bg-status-error/20 text-status-error'
              }`}>
                {product.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> APY
                </span>
                <span className="font-bold text-status-success">{product.apy}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Min Amount
                </span>
                <span className="text-text-primary">{product.minAmount} {product.asset}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Duration
                </span>
                <span className="text-text-primary">
                  {product.durationDays === 0 ? 'Flexible' : `${product.durationDays} Days`}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => toggleStatus(product.id, product.isActive)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                  product.isActive
                    ? 'bg-status-error/10 text-status-error hover:bg-status-error/20'
                    : 'bg-status-success/10 text-status-success hover:bg-status-success/20'
                }`}
              >
                {product.isActive ? (
                  <>
                    <Pause className="w-4 h-4" /> Deactivate
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Activate
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default StakingPage;
