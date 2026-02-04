import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface LimitRule {
  id: string;
  name: string;
  category: 'withdrawal' | 'deposit' | 'p2p' | 'transfer' | 'daily' | 'monthly';
  userType: 'all' | 'unverified' | 'verified' | 'vip' | 'merchant';
  minAmount: number;
  maxAmount: number;
  dailyLimit: number;
  monthlyLimit: number;
  requiresApproval: boolean;
  approvalThreshold: number;
  isActive: boolean;
}

interface Restriction {
  id: string;
  type: 'country' | 'ip_range' | 'device' | 'time';
  value: string;
  action: 'block' | 'warn' | 'require_2fa';
  reason: string;
  isActive: boolean;
  createdAt: string;
}

const LimitsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'limits' | 'restrictions' | 'approvals'>('limits');
  const [limits, setLimits] = useState<LimitRule[]>([]);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [limitsRes, restrictionsRes] = await Promise.all([
        apiClient.get<{ limits: LimitRule[] }>('/admin/limits/rules'),
        apiClient.get<{ restrictions: Restriction[] }>('/admin/limits/restrictions'),
      ]);
      if (limitsRes.success && limitsRes.data) setLimits(limitsRes.data.limits);
      if (restrictionsRes.success && restrictionsRes.data) setRestrictions(restrictionsRes.data.restrictions);
    } catch {
      error('Error', 'Failed to fetch limits data');
      setLimits([]);
      setRestrictions([]);
    }
    setIsLoading(false);
  };

  const handleToggleLimit = async (id: string, isActive: boolean) => {
    try {
      await apiClient.patch(`/admin/limits/rules/${id}/status`, { isActive: !isActive });
      success('Updated', `Limit ${isActive ? 'disabled' : 'enabled'}`);
      fetchData();
    } catch {
      error('Failed', 'Could not update status');
    }
  };

  const handleDeleteRestriction = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await apiClient.delete(`/admin/limits/restrictions/${id}`);
      success('Deleted', 'Restriction removed');
      fetchData();
    } catch {
      error('Failed', 'Could not delete restriction');
    }
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  if (isLoading) {
    return <div className="flex justify-center p-12"><RefreshCw className="w-8 h-8 animate-spin text-brand-yellow" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Limits & Restrictions</h1>
          <p className="text-text-secondary mt-1">Configure transaction limits and access restrictions</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'limits' && (
            <button onClick={() => navigate('/limits/create')} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Limit Rule
            </button>
          )}
          {activeTab === 'restrictions' && (
            <button onClick={() => navigate('/limits/restrictions/create')} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Restriction
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-divider">
        {(['limits', 'restrictions', 'approvals'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium capitalize transition-colors ${
              activeTab === tab ? 'text-brand-yellow border-b-2 border-brand-yellow' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'limits' ? 'Limit Rules' : tab === 'restrictions' ? 'Restrictions' : 'Pending Approvals'}
          </button>
        ))}
      </div>

      {/* Limits Tab */}
      {activeTab === 'limits' && (
        <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Category</th>
                <th>User Type</th>
                <th>Min/Max</th>
                <th>Daily/Monthly</th>
                <th>Approval</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {limits.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-text-secondary">No limit rules configured</td></tr>
              ) : limits.map((limit) => (
                <tr key={limit.id}>
                  <td className="font-medium text-text-primary">{limit.name}</td>
                  <td><span className="badge badge-info capitalize">{limit.category}</span></td>
                  <td><span className="badge badge-warning capitalize">{limit.userType}</span></td>
                  <td className="text-text-secondary text-sm">
                    {formatCurrency(limit.minAmount)} - {formatCurrency(limit.maxAmount)}
                  </td>
                  <td className="text-text-secondary text-sm">
                    {formatCurrency(limit.dailyLimit)} / {formatCurrency(limit.monthlyLimit)}
                  </td>
                  <td>
                    {limit.requiresApproval ? (
                      <span className="text-status-warning text-sm">&gt; {formatCurrency(limit.approvalThreshold)}</span>
                    ) : (
                      <span className="text-text-secondary text-sm">No</span>
                    )}
                  </td>
                  <td>
                    <button onClick={() => handleToggleLimit(limit.id, limit.isActive)} className={`badge ${limit.isActive ? 'badge-success' : 'badge-error'}`}>
                      {limit.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => navigate(`/limits/${limit.id}/edit`)} className="p-2 hover:bg-background-tertiary rounded-lg">
                      <Edit2 className="w-4 h-4 text-text-secondary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Restrictions Tab */}
      {activeTab === 'restrictions' && (
        <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Action</th>
                <th>Reason</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {restrictions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-text-secondary">No restrictions configured</td></tr>
              ) : restrictions.map((restriction) => (
                <tr key={restriction.id}>
                  <td><span className="badge badge-info capitalize">{restriction.type.replace('_', ' ')}</span></td>
                  <td className="font-mono text-text-primary">{restriction.value}</td>
                  <td><span className={`badge ${restriction.action === 'block' ? 'badge-error' : restriction.action === 'warn' ? 'badge-warning' : 'badge-info'}`}>{restriction.action}</span></td>
                  <td className="text-text-secondary">{restriction.reason}</td>
                  <td className="text-text-secondary">{new Date(restriction.createdAt).toLocaleDateString()}</td>
                  <td><span className={`badge ${restriction.isActive ? 'badge-success' : 'badge-error'}`}>{restriction.isActive ? 'Active' : 'Disabled'}</span></td>
                  <td>
                    <button onClick={() => handleDeleteRestriction(restriction.id)} className="p-2 hover:bg-background-tertiary rounded-lg">
                      <Trash2 className="w-4 h-4 text-status-error" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="bg-background-secondary rounded-xl border border-border-divider p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-status-warning opacity-50" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No Pending Approvals</h3>
          <p className="text-text-secondary">All transactions within limits are processed automatically</p>
        </div>
      )}

    </div>
  );
};

export default LimitsPage;
