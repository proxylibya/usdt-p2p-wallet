import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface FeeRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'tiered';
  category: 'trading' | 'withdrawal' | 'deposit' | 'p2p' | 'swap' | 'staking';
  value: number;
  minAmount?: number;
  maxAmount?: number;
  tiers?: { min: number; max: number; fee: number }[];
  isActive: boolean;
  appliesTo: 'all' | 'verified' | 'vip' | 'merchant';
  description: string;
}

interface RevenueStats {
  totalRevenue: number;
  tradingFees: number;
  withdrawalFees: number;
  p2pFees: number;
  stakingRevenue: number;
  dailyAverage: number;
  monthlyGrowth: number;
}

const FeesManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [feeRules, setFeeRules] = useState<FeeRule[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'tiers' | 'revenue'>('rules');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rulesRes, statsRes] = await Promise.all([
        apiClient.get<{ rules: FeeRule[] }>('/admin/fees/rules'),
        apiClient.get<RevenueStats>('/admin/fees/revenue'),
      ]);
      if (rulesRes.success && rulesRes.data) setFeeRules(rulesRes.data.rules);
      if (statsRes.success && statsRes.data) setRevenueStats(statsRes.data);
    } catch {
      error('Error', 'Failed to fetch fees data');
      setFeeRules([]);
      setRevenueStats(null);
    }
    setIsLoading(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await apiClient.patch(`/admin/fees/rules/${id}/status`, { isActive: !isActive });
      success('Updated', `Fee rule ${isActive ? 'disabled' : 'enabled'}`);
      fetchData();
    } catch {
      error('Failed', 'Could not update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee rule?')) return;
    try {
      await apiClient.delete(`/admin/fees/rules/${id}`);
      success('Deleted', 'Fee rule deleted');
      fetchData();
    } catch {
      error('Failed', 'Could not delete fee rule');
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><RefreshCw className="w-8 h-8 animate-spin text-brand-yellow" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Fees & Revenue Management</h1>
          <p className="text-text-secondary mt-1">Configure platform fees, commissions, and view revenue analytics</p>
        </div>
        <button onClick={() => navigate('/fees/create')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Fee Rule
        </button>
      </div>

      {/* Revenue Stats */}
      {revenueStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="stat-card bg-gradient-to-br from-status-success/20 to-transparent col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-status-success" />
              <span className="text-sm text-text-secondary">Total Revenue (Month)</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-status-success">{formatCurrency(revenueStats.totalRevenue)}</span>
              <div className="flex items-center gap-1 text-status-success text-sm">
                <TrendingUp className="w-4 h-4" />
                {revenueStats.monthlyGrowth}%
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="text-sm text-text-secondary mb-1">Trading Fees</div>
            <span className="text-xl font-bold text-text-primary">{formatCurrency(revenueStats.tradingFees)}</span>
          </div>
          <div className="stat-card">
            <div className="text-sm text-text-secondary mb-1">Withdrawal Fees</div>
            <span className="text-xl font-bold text-text-primary">{formatCurrency(revenueStats.withdrawalFees)}</span>
          </div>
          <div className="stat-card">
            <div className="text-sm text-text-secondary mb-1">P2P Fees</div>
            <span className="text-xl font-bold text-text-primary">{formatCurrency(revenueStats.p2pFees)}</span>
          </div>
          <div className="stat-card">
            <div className="text-sm text-text-secondary mb-1">Staking Revenue</div>
            <span className="text-xl font-bold text-text-primary">{formatCurrency(revenueStats.stakingRevenue)}</span>
          </div>
          <div className="stat-card">
            <div className="text-sm text-text-secondary mb-1">Daily Average</div>
            <span className="text-xl font-bold text-brand-yellow">{formatCurrency(revenueStats.dailyAverage)}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-divider">
        {(['rules', 'tiers', 'revenue'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium capitalize transition-colors ${
              activeTab === tab ? 'text-brand-yellow border-b-2 border-brand-yellow' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'rules' ? 'Fee Rules' : tab === 'tiers' ? 'Tiered Pricing' : 'Revenue Analytics'}
          </button>
        ))}
      </div>

      {/* Fee Rules Table */}
      {activeTab === 'rules' && (
        <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Value</th>
                <th>Applies To</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feeRules.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-text-secondary">No fee rules configured</td></tr>
              ) : feeRules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <div>
                      <p className="font-medium text-text-primary">{rule.name}</p>
                      <p className="text-xs text-text-secondary">{rule.description}</p>
                    </div>
                  </td>
                  <td><span className="badge badge-info capitalize">{rule.category}</span></td>
                  <td className="text-text-primary capitalize">{rule.type}</td>
                  <td className="font-semibold text-text-primary">
                    {rule.type === 'percentage' ? `${rule.value}%` : `$${rule.value}`}
                  </td>
                  <td><span className="badge badge-warning capitalize">{rule.appliesTo}</span></td>
                  <td>
                    <button onClick={() => handleToggle(rule.id, rule.isActive)} className={`badge ${rule.isActive ? 'badge-success' : 'badge-error'}`}>
                      {rule.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/fees/${rule.id}/edit`)} className="p-2 hover:bg-background-tertiary rounded-lg">
                        <Edit2 className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button onClick={() => handleDelete(rule.id)} className="p-2 hover:bg-background-tertiary rounded-lg">
                        <Trash2 className="w-4 h-4 text-status-error" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tiered Pricing */}
      {activeTab === 'tiers' && (
        <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-text-primary">Volume-Based Tiered Pricing</h3>
            <button className="btn-secondary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Tier
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-text-secondary pb-2 border-b border-border-divider">
              <span>Volume Range</span>
              <span>Maker Fee</span>
              <span>Taker Fee</span>
              <span>Status</span>
            </div>
            {[
              { range: '$0 - $10,000', maker: '0.10%', taker: '0.10%', level: 'Standard' },
              { range: '$10,000 - $50,000', maker: '0.08%', taker: '0.09%', level: 'Bronze' },
              { range: '$50,000 - $100,000', maker: '0.06%', taker: '0.07%', level: 'Silver' },
              { range: '$100,000 - $500,000', maker: '0.04%', taker: '0.05%', level: 'Gold' },
              { range: '$500,000+', maker: '0.02%', taker: '0.03%', level: 'VIP' },
            ].map((tier, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-4 items-center p-4 bg-background-tertiary rounded-lg">
                <div>
                  <p className="font-medium text-text-primary">{tier.range}</p>
                  <p className="text-xs text-text-secondary">{tier.level}</p>
                </div>
                <span className="text-status-success font-semibold">{tier.maker}</span>
                <span className="text-brand-yellow font-semibold">{tier.taker}</span>
                <span className="badge badge-success">Active</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Analytics */}
      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Revenue by Category</h3>
            <div className="space-y-4">
              {[
                { name: 'Trading Fees', value: 45000, percent: 36, color: 'bg-brand-yellow' },
                { name: 'P2P Fees', value: 35000, percent: 28, color: 'bg-status-success' },
                { name: 'Staking Revenue', value: 30000, percent: 24, color: 'bg-status-info' },
                { name: 'Withdrawal Fees', value: 15000, percent: 12, color: 'bg-status-warning' },
              ].map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-text-primary">{item.name}</span>
                    <span className="text-text-secondary">{formatCurrency(item.value)} ({item.percent}%)</span>
                  </div>
                  <div className="h-3 bg-background-tertiary rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Fee Collection Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-text-secondary text-sm">Today</p>
                <p className="text-2xl font-bold text-text-primary">$4,520</p>
                <p className="text-xs text-status-success">+12% vs yesterday</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-text-secondary text-sm">This Week</p>
                <p className="text-2xl font-bold text-text-primary">$28,500</p>
                <p className="text-xs text-status-success">+8% vs last week</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-text-secondary text-sm">This Month</p>
                <p className="text-2xl font-bold text-text-primary">$125,000</p>
                <p className="text-xs text-status-success">+15% vs last month</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-text-secondary text-sm">Projected (Month)</p>
                <p className="text-2xl font-bold text-brand-yellow">$145,000</p>
                <p className="text-xs text-text-secondary">Based on current rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FeesManagementPage;
