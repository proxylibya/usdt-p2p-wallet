import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, ArrowLeftRight, TrendingUp, DollarSign, Clock, RefreshCw,
  Globe, Shield, Zap, Activity, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line
} from 'recharts';

interface LiveStats {
  users: { total: number; online: number; newToday: number; growth: number };
  transactions: { total: number; today: number; pending: number; volume24h: number };
  p2p: { activeOffers: number; activeTrades: number; completedToday: number; disputes: number };
  revenue: { today: number; week: number; month: number; fees: number };
  system: { uptime: string; requests: number; errors: number; latency: number };
}

interface ChartData {
  volumeData: { date: string; volume: number; trades: number }[];
  userGrowth: { date: string; users: number; active: number }[];
  revenueData: { date: string; revenue: number; fees: number }[];
  assetDistribution: { name: string; value: number; color: string }[];
  topCountries: { country: string; users: number; volume: number }[];
}


const AdvancedDashboardPage: React.FC = () => {
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [statsRes, chartsRes] = await Promise.all([
        apiClient.get<LiveStats>('/admin/dashboard/live-stats'),
        apiClient.get<ChartData>(`/admin/dashboard/charts?period=${selectedPeriod}`),
      ]);
      
      if (statsRes.success && statsRes.data) {
        setLiveStats(statsRes.data);
      } else {
        throw new Error(statsRes.error || 'Failed to fetch live stats');
      }

      if (chartsRes.success && chartsRes.data) {
        setChartData(chartsRes.data);
      } else {
        throw new Error(chartsRes.error || 'Failed to fetch chart data');
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      // If we have previous data, we might want to keep it, but for now let's handle the error
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchData();
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchData, 30000);
    }
    return () => clearInterval(interval);
  }, [fetchData, autoRefresh]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
        <div className="relative">
          <RefreshCw className="w-10 h-10 animate-spin text-brand-yellow" />
          <div className="absolute inset-0 animate-ping opacity-30">
            <RefreshCw className="w-10 h-10 text-brand-yellow" />
          </div>
        </div>
        <p className="mt-4 text-text-secondary animate-pulse">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
        <AlertTriangle className="w-12 h-12 text-status-error mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-2">Failed to load dashboard</h2>
        <p className="text-text-secondary mb-6">{error}</p>
        <button 
          onClick={() => { setIsLoading(true); fetchData(); }}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (!liveStats || !chartData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with animation */}
      <div className="flex items-center justify-between animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Advanced Dashboard</h1>
          <p className="text-text-secondary mt-1">Real-time platform analytics and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-status-success animate-pulse' : 'bg-status-error'}`} />
            <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as typeof selectedPeriod)}
            className="input-field w-28"
          >
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
          </select>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg ${autoRefresh ? 'bg-status-success/20 text-status-success' : 'bg-background-tertiary text-text-secondary'}`}
          >
            <Zap className="w-5 h-5" />
          </button>
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Live Stats Row with stagger animation */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="stat-card bg-gradient-to-br from-brand-yellow/20 to-transparent animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-brand-yellow" />
            <span className="text-sm text-text-secondary">Online Users</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-text-primary">{formatNumber(liveStats.users.online)}</span>
            <div className="flex items-center gap-1 text-status-success text-sm">
              <div className="w-2 h-2 bg-status-success rounded-full animate-pulse" />
              Live
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-status-info" />
            <span className="text-sm text-text-secondary">Total Users</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-text-primary">{formatNumber(liveStats.users.total)}</span>
            <div className="flex items-center gap-1 text-status-success text-xs">
              <TrendingUp className="w-3 h-3" />
              {liveStats.users.growth}%
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <ArrowLeftRight className="w-5 h-5 text-status-warning" />
            <span className="text-sm text-text-secondary">24h Volume</span>
          </div>
          <span className="text-2xl font-bold text-text-primary">{formatCurrency(liveStats.transactions.volume24h)}</span>
        </div>

        <div className="stat-card animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-status-success" />
            <span className="text-sm text-text-secondary">Today Revenue</span>
          </div>
          <span className="text-2xl font-bold text-status-success">{formatCurrency(liveStats.revenue.today)}</span>
        </div>

        <div className="stat-card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-brand-yellow" />
            <span className="text-sm text-text-secondary">Active Trades</span>
          </div>
          <span className="text-2xl font-bold text-text-primary">{liveStats.p2p.activeTrades}</span>
        </div>

        <div className="stat-card animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-status-error" />
            <span className="text-sm text-text-secondary">Open Disputes</span>
          </div>
          <span className="text-2xl font-bold text-status-error">{liveStats.p2p.disputes}</span>
        </div>
      </div>

      {/* Charts Row 1 with animations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume Chart */}
        <div className="lg:col-span-2 bg-background-secondary p-6 rounded-xl border border-border-divider card-hover animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Trading Volume & Transactions</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded bg-brand-yellow" />
                <span className="text-text-secondary">Volume</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded bg-status-info" />
                <span className="text-text-secondary">Trades</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.volumeData}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F0B90B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F0B90B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
              <XAxis dataKey="date" stroke="#848E9C" />
              <YAxis yAxisId="left" stroke="#848E9C" tickFormatter={(v) => formatCurrency(v)} />
              <YAxis yAxisId="right" orientation="right" stroke="#848E9C" />
              <Tooltip contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }} />
              <Area yAxisId="left" type="monotone" dataKey="volume" stroke="#F0B90B" fill="url(#volumeGradient)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="trades" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Distribution */}
        <div className="bg-background-secondary p-6 rounded-xl border border-border-divider card-hover animate-fade-in-up" style={{ animationDelay: '350ms' }}>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Asset Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={chartData.assetDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                {chartData.assetDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {chartData.assetDistribution.map((asset) => (
              <div key={asset.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: asset.color }} />
                <span className="text-xs text-text-secondary">{asset.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 with animations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-background-secondary p-6 rounded-xl border border-border-divider card-hover animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Revenue & Fees</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
              <XAxis dataKey="date" stroke="#848E9C" />
              <YAxis stroke="#848E9C" tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }} />
              <Bar dataKey="revenue" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fees" fill="#F0B90B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth */}
        <div className="bg-background-secondary p-6 rounded-xl border border-border-divider card-hover animate-fade-in-up" style={{ animationDelay: '450ms' }}>
          <h3 className="text-lg font-semibold text-text-primary mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
              <XAxis dataKey="date" stroke="#848E9C" />
              <YAxis stroke="#848E9C" />
              <Tooltip contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }} />
              <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="active" stroke="#22C55E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row with animations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Countries */}
        <div className="bg-background-secondary p-6 rounded-xl border border-border-divider card-hover animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" /> Top Countries
          </h3>
          <div className="space-y-3">
            {chartData.topCountries.map((country, idx) => (
              <div key={country.country} className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center bg-background-tertiary rounded text-sm font-medium text-text-secondary">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-text-primary">{country.country}</span>
                    <span className="text-text-secondary text-sm">{formatNumber(country.users)} users</span>
                  </div>
                  <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-yellow rounded-full"
                      style={{ width: `${(country.volume / chartData.topCountries[0].volume) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-background-secondary p-6 rounded-xl border border-border-divider card-hover animate-fade-in-up" style={{ animationDelay: '550ms' }}>
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" /> System Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-status-success" />
                <span className="text-text-primary">Uptime</span>
              </div>
              <span className="font-semibold text-status-success">{liveStats.system.uptime}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-yellow" />
                <span className="text-text-primary">Requests/min</span>
              </div>
              <span className="font-semibold text-text-primary">{formatNumber(liveStats.system.requests)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-status-info" />
                <span className="text-text-primary">Avg Latency</span>
              </div>
              <span className="font-semibold text-text-primary">{liveStats.system.latency}ms</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-status-error" />
                <span className="text-text-primary">Errors (24h)</span>
              </div>
              <span className="font-semibold text-status-error">{liveStats.system.errors}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-background-secondary p-6 rounded-xl border border-border-divider card-hover animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/users" className="p-4 bg-background-tertiary rounded-lg hover:bg-brand-yellow/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-text-secondary" />
              <span className="text-sm text-text-primary">Users</span>
            </Link>
            <Link to="/transactions" className="p-4 bg-background-tertiary rounded-lg hover:bg-brand-yellow/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 text-center">
              <ArrowLeftRight className="w-6 h-6 mx-auto mb-2 text-text-secondary" />
              <span className="text-sm text-text-primary">Transactions</span>
            </Link>
            <Link to="/disputes" className="p-4 bg-background-tertiary rounded-lg hover:bg-brand-yellow/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 text-center">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-text-secondary" />
              <span className="text-sm text-text-primary">Disputes</span>
            </Link>
            <Link to="/security" className="p-4 bg-background-tertiary rounded-lg hover:bg-brand-yellow/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 text-center">
              <Shield className="w-6 h-6 mx-auto mb-2 text-text-secondary" />
              <span className="text-sm text-text-primary">Security</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboardPage;
