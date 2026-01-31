import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ArrowLeftRight,
  Wallet,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  pendingDisputes: number;
  pendingKYC: number;
  p2pActiveOffers: number;
  p2pCompletedTrades: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'transaction' | 'dispute' | 'kyc';
  message: string;
  time: string;
  status: 'success' | 'pending' | 'error';
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  color: string;
}> = ({ title, value, icon, change, color }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-text-secondary text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-text-primary mt-2">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-status-success' : 'text-status-error'}`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(change)}% from last week</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const volumeData = [
  { name: 'Mon', volume: 45000 },
  { name: 'Tue', volume: 52000 },
  { name: 'Wed', volume: 49000 },
  { name: 'Thu', volume: 63000 },
  { name: 'Fri', volume: 58000 },
  { name: 'Sat', volume: 71000 },
  { name: 'Sun', volume: 65000 },
];

const assetDistribution = [
  { name: 'USDT', value: 65, color: '#26A17B' },
  { name: 'USDC', value: 20, color: '#2775CA' },
  { name: 'BTC', value: 10, color: '#F7931A' },
  { name: 'ETH', value: 5, color: '#627EEA' },
];

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalVolume: 0,
    pendingDisputes: 0,
    pendingKYC: 0,
    p2pActiveOffers: 0,
    p2pCompletedTrades: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{
        users: { total: number; active: number; banned: number; pendingKyc: number };
        transactions: { total: number; pendingWithdrawals: number };
        p2p: { activeOffers: number; openDisputes: number };
        totalBalance: number;
        recentTransactions: any[];
        recentUsers: any[];
      }>('/admin/dashboard/stats');
      if (response.success && response.data) {
        const data = response.data;
        setStats({
          totalUsers: data.users.total,
          activeUsers: data.users.active,
          totalTransactions: data.transactions.total,
          totalVolume: data.totalBalance,
          pendingDisputes: data.p2p.openDisputes,
          pendingKYC: data.users.pendingKyc,
          p2pActiveOffers: data.p2p.activeOffers,
          p2pCompletedTrades: 0,
        });
        // Map recent users to activity
        const activity: RecentActivity[] = data.recentUsers.slice(0, 4).map((user: any, idx: number) => ({
          id: String(idx),
          type: 'user' as const,
          message: `New user: ${user.name}`,
          time: new Date(user.createdAt).toLocaleString(),
          status: 'success' as const,
        }));
        setRecentActivity(activity);
      }
    } catch {
      // Keep default zero values
    }
    setIsLoading(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-yellow border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={formatNumber(stats.totalUsers)}
          icon={<Users className="w-6 h-6 text-status-info" />}
          change={12.5}
          color="bg-status-info/20"
        />
        <StatCard
          title="Total Volume"
          value={`$${formatNumber(stats.totalVolume)}`}
          icon={<DollarSign className="w-6 h-6 text-status-success" />}
          change={8.3}
          color="bg-status-success/20"
        />
        <StatCard
          title="Transactions"
          value={formatNumber(stats.totalTransactions)}
          icon={<ArrowLeftRight className="w-6 h-6 text-brand-yellow" />}
          change={-2.1}
          color="bg-brand-yellow/20"
        />
        <StatCard
          title="Pending Disputes"
          value={stats.pendingDisputes}
          icon={<AlertTriangle className="w-6 h-6 text-status-error" />}
          color="bg-status-error/20"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume Chart */}
        <div className="lg:col-span-2 bg-background-secondary p-6 rounded-xl border border-border-divider">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Trading Volume (7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
              <XAxis dataKey="name" stroke="#848E9C" />
              <YAxis stroke="#848E9C" tickFormatter={(v) => `$${v / 1000}K`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#F0B90B"
                fill="url(#colorVolume)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F0B90B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F0B90B" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Distribution */}
        <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Asset Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={assetDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
              >
                {assetDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }}
                formatter={(value: number) => [`${value}%`, 'Share']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {assetDistribution.map((asset) => (
              <div key={asset.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }} />
                <span className="text-sm text-text-secondary">{asset.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-background-tertiary rounded-lg">
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm">Active Users</span>
              </div>
              <p className="text-xl font-bold text-text-primary">{formatNumber(stats.activeUsers)}</p>
            </div>
            <div className="p-4 bg-background-tertiary rounded-lg">
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                <Wallet className="w-4 h-4" />
                <span className="text-sm">P2P Offers</span>
              </div>
              <p className="text-xl font-bold text-text-primary">{stats.p2pActiveOffers}</p>
            </div>
            <div className="p-4 bg-background-tertiary rounded-lg">
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Pending KYC</span>
              </div>
              <p className="text-xl font-bold text-status-warning">{stats.pendingKYC}</p>
            </div>
            <div className="p-4 bg-background-tertiary rounded-lg">
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">P2P Trades</span>
              </div>
              <p className="text-xl font-bold text-status-success">{formatNumber(stats.p2pCompletedTrades)}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
            <Link to="/logs" className="text-sm text-brand-yellow hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg">
                <div className={`p-2 rounded-lg ${
                  activity.status === 'success' ? 'bg-status-success/20' :
                  activity.status === 'error' ? 'bg-status-error/20' : 'bg-status-warning/20'
                }`}>
                  {activity.status === 'success' ? <CheckCircle className="w-4 h-4 text-status-success" /> :
                   activity.status === 'error' ? <XCircle className="w-4 h-4 text-status-error" /> :
                   <Clock className="w-4 h-4 text-status-warning" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-primary">{activity.message}</p>
                  <p className="text-xs text-text-secondary">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
