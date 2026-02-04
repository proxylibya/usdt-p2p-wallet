import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, UserX, Globe, Activity, Clock,
  Ban, RefreshCw, Search, Download,
  Smartphone, Key, MapPin, AlertOctagon, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface SecurityAlert {
  id: string;
  type: 'login_attempt' | 'suspicious_tx' | 'ip_blocked' | 'device_change' | 'large_withdrawal' | 'fraud_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userName?: string;
  details: string;
  ipAddress?: string;
  location?: string;
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved' | 'dismissed';
}

interface BlockedEntity {
  id: string;
  type: 'ip' | 'device' | 'user' | 'country';
  value: string;
  reason: string;
  blockedAt: string;
  expiresAt?: string;
  blockedBy: string;
}

interface SecurityStats {
  totalAlerts: number;
  criticalAlerts: number;
  blockedIPs: number;
  blockedUsers: number;
  failedLogins24h: number;
  suspiciousTx24h: number;
  securityScore: number;
}

const severityColors: Record<string, string> = {
  low: 'badge-info',
  medium: 'badge-warning',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'badge-error',
};

const typeIcons: Record<string, React.ReactNode> = {
  login_attempt: <Key className="w-4 h-4" />,
  suspicious_tx: <AlertTriangle className="w-4 h-4" />,
  ip_blocked: <Globe className="w-4 h-4" />,
  device_change: <Smartphone className="w-4 h-4" />,
  large_withdrawal: <AlertOctagon className="w-4 h-4" />,
  fraud_detected: <ShieldAlert className="w-4 h-4" />,
};

const SecurityCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [blockedEntities, setBlockedEntities] = useState<BlockedEntity[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'alerts' | 'blocked' | 'rules' | 'audit'>('alerts');
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [alertsRes, blockedRes, statsRes] = await Promise.all([
        apiClient.get<{ alerts: SecurityAlert[] }>('/admin/security/alerts'),
        apiClient.get<{ blocked: BlockedEntity[] }>('/admin/security/blocked'),
        apiClient.get<SecurityStats>('/admin/security/stats'),
      ]);
      if (alertsRes.success && alertsRes.data) setAlerts(alertsRes.data.alerts);
      if (blockedRes.success && blockedRes.data) setBlockedEntities(blockedRes.data.blocked);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
    } catch {
      error('Error', 'Failed to fetch security data');
      setAlerts([]);
      setBlockedEntities([]);
      setStats(null);
    }
    setIsLoading(false);
  };

  const handleUpdateAlertStatus = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/admin/security/alerts/${id}`, { status });
      success('Updated', 'Alert status updated');
      fetchData();
    } catch {
      error('Failed', 'Could not update alert');
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      await apiClient.delete(`/admin/security/blocked/${id}`);
      success('Unblocked', 'Entity unblocked successfully');
      fetchData();
    } catch {
      error('Failed', 'Could not unblock entity');
    }
  };

  const filteredAlerts = alerts.filter(a => severityFilter === 'all' || a.severity === severityFilter);

  if (isLoading) {
    return <div className="flex justify-center p-12"><RefreshCw className="w-8 h-8 animate-spin text-brand-yellow" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Security Center</h1>
          <p className="text-text-secondary mt-1">Monitor and manage platform security</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/security/block')} className="btn-secondary flex items-center gap-2">
            <Ban className="w-4 h-4" /> Block Entity
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Security Score & Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="stat-card col-span-2 bg-gradient-to-br from-status-success/20 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Security Score</p>
                <p className="text-4xl font-bold text-status-success mt-2">{stats.securityScore}%</p>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-status-success flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-status-success" />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-status-error" />
              <span className="text-sm text-text-secondary">Critical</span>
            </div>
            <span className="text-2xl font-bold text-status-error">{stats.criticalAlerts}</span>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-status-warning" />
              <span className="text-sm text-text-secondary">Blocked IPs</span>
            </div>
            <span className="text-2xl font-bold text-text-primary">{stats.blockedIPs}</span>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="w-5 h-5 text-status-error" />
              <span className="text-sm text-text-secondary">Blocked Users</span>
            </div>
            <span className="text-2xl font-bold text-text-primary">{stats.blockedUsers}</span>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-5 h-5 text-status-info" />
              <span className="text-sm text-text-secondary">Failed Logins</span>
            </div>
            <span className="text-2xl font-bold text-text-primary">{stats.failedLogins24h}</span>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-brand-yellow" />
              <span className="text-sm text-text-secondary">Suspicious Tx</span>
            </div>
            <span className="text-2xl font-bold text-text-primary">{stats.suspiciousTx24h}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-divider">
        {(['alerts', 'blocked', 'rules', 'audit'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium capitalize transition-colors ${
              activeTab === tab ? 'text-brand-yellow border-b-2 border-brand-yellow' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'alerts' ? 'Security Alerts' : tab === 'blocked' ? 'Blocked Entities' : tab === 'rules' ? 'Security Rules' : 'Audit Log'}
          </button>
        ))}
      </div>

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input type="text" placeholder="Search alerts..." className="input-field pl-10" />
            </div>
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="input-field w-40">
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">No security alerts</div>
            ) : filteredAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-xl border ${alert.severity === 'critical' ? 'border-status-error bg-status-error/10' : 'border-border-divider bg-background-secondary'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${alert.severity === 'critical' ? 'bg-status-error/20' : 'bg-background-tertiary'}`}>
                      {typeIcons[alert.type]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${severityColors[alert.severity]}`}>{alert.severity.toUpperCase()}</span>
                        <span className="badge badge-info capitalize">{alert.type.replace('_', ' ')}</span>
                        {alert.userName && <span className="text-text-primary font-medium">{alert.userName}</span>}
                      </div>
                      <p className="text-text-primary">{alert.details}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                        {alert.ipAddress && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {alert.ipAddress}</span>}
                        {alert.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {alert.location}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={alert.status}
                      onChange={(e) => handleUpdateAlertStatus(alert.id, e.target.value)}
                      className="input-field text-sm w-32"
                    >
                      <option value="new">New</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocked Entities Tab */}
      {activeTab === 'blocked' && (
        <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Reason</th>
                <th>Blocked At</th>
                <th>Expires</th>
                <th>Blocked By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blockedEntities.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-text-secondary">No blocked entities</td></tr>
              ) : blockedEntities.map((entity) => (
                <tr key={entity.id}>
                  <td><span className="badge badge-error capitalize">{entity.type}</span></td>
                  <td className="font-mono text-text-primary">{entity.value}</td>
                  <td className="text-text-secondary">{entity.reason}</td>
                  <td className="text-text-secondary">{new Date(entity.blockedAt).toLocaleString()}</td>
                  <td className="text-text-secondary">{entity.expiresAt ? new Date(entity.expiresAt).toLocaleString() : 'Never'}</td>
                  <td className="text-text-primary">{entity.blockedBy}</td>
                  <td>
                    <button onClick={() => handleUnblock(entity.id)} className="btn-secondary text-sm px-3 py-1">
                      Unblock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Security Rules Tab */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Login Security</h3>
            <div className="space-y-4">
              {[
                { name: 'Max Login Attempts', value: '5', enabled: true },
                { name: 'Lockout Duration', value: '30 min', enabled: true },
                { name: 'Require 2FA for Admin', value: 'On', enabled: true },
                { name: 'Session Timeout', value: '60 min', enabled: true },
                { name: 'IP Whitelist', value: 'Off', enabled: false },
              ].map((rule, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                  <span className="text-text-primary">{rule.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-text-secondary">{rule.value}</span>
                    <div className={`w-10 h-5 rounded-full ${rule.enabled ? 'bg-status-success' : 'bg-background-primary'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Transaction Security</h3>
            <div className="space-y-4">
              {[
                { name: 'Large Withdrawal Alert', value: '$10,000', enabled: true },
                { name: 'Daily Limit Check', value: 'On', enabled: true },
                { name: 'Fraud Detection AI', value: 'On', enabled: true },
                { name: 'Manual Approval > $50K', value: 'On', enabled: true },
                { name: 'Suspicious Pattern Alert', value: 'On', enabled: true },
              ].map((rule, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                  <span className="text-text-primary">{rule.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-text-secondary">{rule.value}</span>
                    <div className={`w-10 h-5 rounded-full ${rule.enabled ? 'bg-status-success' : 'bg-background-primary'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Security Actions</h3>
          <div className="space-y-3">
            {[
              { action: 'IP Blocked', target: '192.168.1.100', admin: 'System', time: '2 min ago' },
              { action: 'User Suspended', target: 'user_456', admin: 'Admin', time: '15 min ago' },
              { action: 'Alert Resolved', target: 'Alert #123', admin: 'Admin', time: '1 hour ago' },
              { action: 'Security Rule Updated', target: 'Max Login Attempts', admin: 'Super Admin', time: '3 hours ago' },
              { action: 'IP Unblocked', target: '10.0.0.55', admin: 'Admin', time: '5 hours ago' },
            ].map((log, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-text-secondary" />
                  <div>
                    <p className="text-text-primary">{log.action}: <span className="font-mono text-text-secondary">{log.target}</span></p>
                    <p className="text-xs text-text-secondary">by {log.admin}</p>
                  </div>
                </div>
                <span className="text-sm text-text-secondary">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default SecurityCenterPage;
