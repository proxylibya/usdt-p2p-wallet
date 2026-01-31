import { useState, useEffect } from 'react';
import {
  Activity, Server, Cpu, HardDrive, Clock, RefreshCw,
  CheckCircle, AlertTriangle, Wifi
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  lastChecked: string;
  services: {
    name: string;
    status: 'online' | 'offline' | 'degraded';
    responseTime: number;
    lastError?: string;
  }[];
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeConnections: number;
    requestsPerMinute: number;
  };
  recentErrors: {
    id: string;
    message: string;
    count: number;
    lastOccurred: string;
  }[];
}

const SystemMonitoringPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchHealth();
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchHealth, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchHealth = async () => {
    try {
      const response = await apiClient.get<SystemHealth>('/admin/system/health');
      if (response.success && response.data) {
        setHealth(response.data);
      }
    } catch {
      setHealth(null);
    }
    setIsLoading(false);
  };

  const getMetricColor = (value: number) => {
    if (value < 60) return 'bg-status-success';
    if (value < 80) return 'bg-status-warning';
    return 'bg-status-error';
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><RefreshCw className="w-8 h-8 animate-spin text-brand-yellow" /></div>;
  }

  if (!health) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-status-error mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Unable to fetch system health</h2>
        <p className="text-text-secondary mb-4">Please check your connection and try again</p>
        <button onClick={fetchHealth} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">System Monitoring</h1>
          <p className="text-text-secondary mt-1">Real-time system health and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="sr-only" />
            <div className={`w-10 h-5 rounded-full transition-colors ${autoRefresh ? 'bg-status-success' : 'bg-background-tertiary'}`}>
              <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${autoRefresh ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-text-secondary">Auto Refresh</span>
          </label>
          <button onClick={fetchHealth} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`p-6 rounded-xl border ${health.status === 'healthy' ? 'border-status-success bg-status-success/10' : health.status === 'warning' ? 'border-status-warning bg-status-warning/10' : 'border-status-error bg-status-error/10'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {health.status === 'healthy' ? (
              <CheckCircle className="w-12 h-12 text-status-success" />
            ) : (
              <AlertTriangle className={`w-12 h-12 ${health.status === 'warning' ? 'text-status-warning' : 'text-status-error'}`} />
            )}
            <div>
              <h2 className="text-xl font-bold text-text-primary capitalize">System {health.status}</h2>
              <p className="text-text-secondary">All services are operational</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary">Uptime</p>
            <p className="text-2xl font-bold text-text-primary">{health.uptime}</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-brand-yellow/20 rounded-lg">
              <Cpu className="w-5 h-5 text-brand-yellow" />
            </div>
            <span className="text-text-secondary text-sm">CPU Usage</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-text-primary">{health.metrics.cpuUsage}%</span>
          </div>
          <div className="mt-2 h-2 bg-background-tertiary rounded-full overflow-hidden">
            <div className={`h-full ${getMetricColor(health.metrics.cpuUsage)} transition-all`} style={{ width: `${health.metrics.cpuUsage}%` }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-status-info/20 rounded-lg">
              <Server className="w-5 h-5 text-status-info" />
            </div>
            <span className="text-text-secondary text-sm">Memory</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-text-primary">{health.metrics.memoryUsage}%</span>
          </div>
          <div className="mt-2 h-2 bg-background-tertiary rounded-full overflow-hidden">
            <div className={`h-full ${getMetricColor(health.metrics.memoryUsage)} transition-all`} style={{ width: `${health.metrics.memoryUsage}%` }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-status-warning/20 rounded-lg">
              <HardDrive className="w-5 h-5 text-status-warning" />
            </div>
            <span className="text-text-secondary text-sm">Disk Usage</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-text-primary">{health.metrics.diskUsage}%</span>
          </div>
          <div className="mt-2 h-2 bg-background-tertiary rounded-full overflow-hidden">
            <div className={`h-full ${getMetricColor(health.metrics.diskUsage)} transition-all`} style={{ width: `${health.metrics.diskUsage}%` }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-status-success/20 rounded-lg">
              <Wifi className="w-5 h-5 text-status-success" />
            </div>
            <span className="text-text-secondary text-sm">Connections</span>
          </div>
          <span className="text-2xl font-bold text-text-primary">{health.metrics.activeConnections}</span>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-status-error/20 rounded-lg">
              <Activity className="w-5 h-5 text-status-error" />
            </div>
            <span className="text-text-secondary text-sm">Requests/min</span>
          </div>
          <span className="text-2xl font-bold text-text-primary">{health.metrics.requestsPerMinute.toLocaleString()}</span>
        </div>
      </div>

      {/* Services Status */}
      <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Service Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {health.services.map((service) => (
            <div key={service.name} className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${service.status === 'online' ? 'bg-status-success' : service.status === 'degraded' ? 'bg-status-warning' : 'bg-status-error'}`} />
                <div>
                  <p className="font-medium text-text-primary">{service.name}</p>
                  <p className="text-xs text-text-secondary capitalize">{service.status}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-text-primary">{service.responseTime}ms</p>
                <p className="text-xs text-text-secondary">Response</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Errors */}
      <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Errors</h3>
        {health.recentErrors.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-status-success mx-auto mb-2" />
            <p className="text-text-secondary">No recent errors</p>
          </div>
        ) : (
          <div className="space-y-3">
            {health.recentErrors.map((err) => (
              <div key={err.id} className="flex items-center justify-between p-4 bg-status-error/10 border border-status-error/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-status-error" />
                  <div>
                    <p className="font-medium text-text-primary">{err.message}</p>
                    <p className="text-sm text-text-secondary">{err.lastOccurred}</p>
                  </div>
                </div>
                <span className="badge badge-error">{err.count}x</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last Updated */}
      <div className="flex items-center justify-center gap-2 text-text-secondary text-sm">
        <Clock className="w-4 h-4" />
        <span>Last updated: {new Date(health.lastChecked).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default SystemMonitoringPage;
