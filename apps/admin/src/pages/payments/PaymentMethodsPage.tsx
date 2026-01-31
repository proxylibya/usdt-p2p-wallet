import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, CheckCircle, CreditCard, Building, Smartphone, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface PaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  type: 'bank' | 'ewallet' | 'cash';
  icon: string;
  isActive: boolean;
  requiresDetails: string[];
  countries: string[];
  processingTime: string;
  createdAt: string;
}

const PaymentMethodsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ methods: PaymentMethod[] }>('/admin/payment-methods');
      if (response.success && response.data) {
        setMethods(response.data.methods);
      }
    } catch {
      error('Error', 'Failed to fetch payment methods');
      setMethods([]);
    }
    setIsLoading(false);
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await apiClient.patch(`/admin/payment-methods/${id}/status`, { isActive: !isActive });
      success('Updated', `Payment method ${isActive ? 'disabled' : 'enabled'}`);
      fetchMethods();
    } catch {
      error('Failed', 'Could not update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    try {
      await apiClient.delete(`/admin/payment-methods/${id}`);
      success('Deleted', 'Payment method deleted');
      fetchMethods();
    } catch {
      error('Failed', 'Could not delete payment method');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Building className="w-5 h-5" />;
      case 'ewallet': return <Smartphone className="w-5 h-5" />;
      case 'cash': return <CreditCard className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Payment Methods</h1>
          <p className="text-text-secondary mt-1">Manage available P2P payment methods</p>
        </div>
        <button onClick={() => navigate('/p2p/payment-methods/create')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Method
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-success/20 rounded-xl">
              <CheckCircle className="w-6 h-6 text-status-success" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Active</p>
              <p className="text-2xl font-bold text-text-primary">{methods.filter(m => m.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-yellow/20 rounded-xl">
              <Building className="w-6 h-6 text-brand-yellow" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Bank Transfer</p>
              <p className="text-2xl font-bold text-text-primary">{methods.filter(m => m.type === 'bank').length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-info/20 rounded-xl">
              <Smartphone className="w-6 h-6 text-status-info" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">E-Wallets</p>
              <p className="text-2xl font-bold text-text-primary">{methods.filter(m => m.type === 'ewallet').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Type</th>
              <th>Required Fields</th>
              <th>Processing Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-yellow" /></td></tr>
            ) : methods.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-text-secondary">No payment methods</td></tr>
            ) : (
              methods.map((method) => (
                <tr key={method.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background-tertiary rounded-lg">
                        {getTypeIcon(method.type)}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{method.name}</p>
                        <p className="text-sm text-text-secondary">{method.nameAr}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-info capitalize">{method.type}</span></td>
                  <td className="text-text-secondary text-sm">{method.requiresDetails.join(', ')}</td>
                  <td className="text-text-primary">{method.processingTime}</td>
                  <td>
                    <button onClick={() => handleToggleStatus(method.id, method.isActive)} className={`badge ${method.isActive ? 'badge-success' : 'badge-error'}`}>
                      {method.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/p2p/payment-methods/${method.id}/edit`)} className="p-2 hover:bg-background-tertiary rounded-lg">
                        <Edit2 className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button onClick={() => handleDelete(method.id)} className="p-2 hover:bg-background-tertiary rounded-lg">
                        <Trash2 className="w-4 h-4 text-status-error" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default PaymentMethodsPage;
