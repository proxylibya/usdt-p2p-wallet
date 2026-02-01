import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { SmsProvider } from '../../types/sms';

export default function SmsProvidersPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [providers, setProviders] = useState<SmsProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await apiClient.get<SmsProvider[]>('/sms/providers');
      if (response.success && response.data) {
        setProviders(response.data);
      } else {
        error('Error', response.error || 'Failed to fetch providers');
      }
    } catch (err) {
      error('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this provider?')) return;

    try {
      const response = await apiClient.delete(`/sms/providers/${id}`);
      if (response.success) {
        success('Success', 'Provider deleted successfully');
        fetchProviders();
      } else {
        error('Error', response.error || 'Failed to delete provider');
      }
    } catch (err) {
      error('Error', 'Network error');
    }
  };

  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">SMS Providers</h1>
          <p className="text-text-secondary">Manage SMS gateways and routing priority</p>
        </div>
        <button
          onClick={() => navigate('/sms/providers/create')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Provider
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-border-divider flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-secondary text-text-secondary text-sm">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Priority</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Cost/Msg</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-divider">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-secondary">
                    Loading...
                  </td>
                </tr>
              ) : filteredProviders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-secondary">
                    No providers found
                  </td>
                </tr>
              ) : (
                filteredProviders.map((provider) => (
                  <tr key={provider.id} className="hover:bg-background-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary">{provider.name}</div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary font-mono text-sm">
                      {provider.type}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {provider.priority}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        provider.isActive 
                          ? 'bg-status-success/10 text-status-success' 
                          : 'bg-status-error/10 text-status-error'
                      }`}>
                        {provider.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {provider.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {provider.costPerMsg} {provider.currency}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/sms/providers/${provider.id}/edit`)}
                        className="p-1 hover:bg-brand-primary/10 rounded text-brand-primary transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(provider.id)}
                        className="p-1 hover:bg-status-error/10 rounded text-status-error transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
