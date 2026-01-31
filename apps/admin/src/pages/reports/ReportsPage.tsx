import { useState, useEffect } from 'react';
import { Download, TrendingUp, DollarSign, Users, ArrowLeftRight, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { apiClient } from '../../services/apiClient';

interface ReportData {
  graphData: { date: string; volume: number; users: number }[];
  stats: {
    volume: number;
    newUsers: number;
    transactions: number;
    revenue: number;
  };
}

const assetData = [
  { name: 'USDT', value: 65, color: '#26A17B' },
  { name: 'USDC', value: 20, color: '#2775CA' },
  { name: 'BTC', value: 10, color: '#F7931A' },
  { name: 'ETH', value: 5, color: '#627EEA' },
];

const transactionTypes = [
  { type: 'Deposits', count: 4521, amount: 2450000 },
  { type: 'Withdrawals', count: 3892, amount: 1890000 },
  { type: 'P2P Trades', count: 8934, amount: 5230000 },
  { type: 'Swaps', count: 2341, amount: 890000 },
];

const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('month');
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<ReportData>(`/admin/reports/stats?range=${dateRange}`);
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch {
      // API error - will show empty data
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /></div>;
  }

  const stats = data?.stats || { volume: 0, newUsers: 0, transactions: 0, revenue: 0 };
  const graphData = data?.graphData || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reports & Analytics</h1>
          <p className="text-text-secondary mt-1">Platform performance and insights</p>
        </div>
        <div className="flex gap-3">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="input-field w-40">
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-yellow/20 rounded-xl"><DollarSign className="w-6 h-6 text-brand-yellow" /></div>
            <div>
              <p className="text-text-secondary text-sm">Total Volume</p>
              <p className="text-2xl font-bold text-text-primary">${formatNumber(stats.volume)}</p>
              <p className="text-sm text-status-success">+12.5% vs last period</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-success/20 rounded-xl"><Users className="w-6 h-6 text-status-success" /></div>
            <div>
              <p className="text-text-secondary text-sm">New Users</p>
              <p className="text-2xl font-bold text-text-primary">{formatNumber(stats.newUsers)}</p>
              <p className="text-sm text-status-success">+8.3% vs last period</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-info/20 rounded-xl"><ArrowLeftRight className="w-6 h-6 text-status-info" /></div>
            <div>
              <p className="text-text-secondary text-sm">Transactions</p>
              <p className="text-2xl font-bold text-text-primary">{formatNumber(stats.transactions)}</p>
              <p className="text-sm text-status-success">+15.2% vs last period</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-xl"><TrendingUp className="w-6 h-6 text-purple-400" /></div>
            <div>
              <p className="text-text-secondary text-sm">Platform Revenue</p>
              <p className="text-2xl font-bold text-text-primary">${formatNumber(stats.revenue)}</p>
              <p className="text-sm text-status-success">+6.8% vs last period</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Chart */}
        <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Trading Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
              <XAxis dataKey="date" stroke="#848E9C" />
              <YAxis stroke="#848E9C" tickFormatter={(v: number) => `$${v / 1000}K`} />
              <Tooltip contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']} />
              <Area type="monotone" dataKey="volume" stroke="#F0B90B" fill="url(#colorVol)" strokeWidth={2} />
              <defs>
                <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F0B90B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F0B90B" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth */}
        <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
          <h3 className="text-lg font-semibold text-text-primary mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
              <XAxis dataKey="date" stroke="#848E9C" />
              <YAxis stroke="#848E9C" />
              <Tooltip contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }} />
              <Bar dataKey="users" fill="#0ECB81" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Distribution */}
        <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Asset Distribution</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie data={assetData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {assetData.map((asset) => (
                <div key={asset.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }} />
                    <span className="text-text-primary">{asset.name}</span>
                  </div>
                  <span className="font-medium text-text-primary">{asset.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction Types */}
        <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Transaction Breakdown</h3>
          <div className="space-y-4">
            {transactionTypes.map((item) => (
              <div key={item.type} className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
                <div>
                  <p className="font-medium text-text-primary">{item.type}</p>
                  <p className="text-sm text-text-secondary">{item.count.toLocaleString()} transactions</p>
                </div>
                <p className="text-lg font-bold text-brand-yellow">${(item.amount / 1000000).toFixed(2)}M</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
