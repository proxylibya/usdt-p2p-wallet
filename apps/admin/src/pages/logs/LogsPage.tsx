import { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface LogEntry {
  id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  category: 'auth' | 'transaction' | 'p2p' | 'system' | 'security';
  message: string;
  userId?: string;
  userName?: string;
  ip?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, levelFilter, categoryFilter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ logs: LogEntry[]; totalPages: number }>(`/admin/logs?page=${currentPage}&level=${levelFilter}&category=${categoryFilter}`);
      if (response.success && response.data) {
        setLogs(response.data.logs);
        setTotalPages(response.data.totalPages);
      }
    } catch {
      setLogs([]);
      setTotalPages(1);
    }
    setIsLoading(false);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-4 h-4 text-status-success" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-status-error" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-status-warning" />;
      default: return <Info className="w-4 h-4 text-status-info" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const styles: Record<string, string> = {
      success: 'badge-success',
      error: 'badge-error',
      warning: 'badge-warning',
      info: 'badge-info',
    };
    return <span className={`badge ${styles[level] || ''}`}>{level}</span>;
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      auth: 'bg-purple-500/20 text-purple-400',
      transaction: 'bg-green-500/20 text-green-400',
      p2p: 'bg-blue-500/20 text-blue-400',
      system: 'bg-gray-500/20 text-gray-400',
      security: 'bg-red-500/20 text-red-400',
    };
    return <span className={`badge ${colors[category] || ''}`}>{category}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">System Logs</h1>
          <p className="text-text-secondary mt-1">Monitor platform activity and events</p>
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> Export Logs
        </button>
      </div>

      <div className="bg-background-secondary p-4 rounded-xl border border-border-divider flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input type="text" placeholder="Search logs..." className="input-field pl-10" />
        </div>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="input-field w-32">
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field w-40">
          <option value="all">All Categories</option>
          <option value="auth">Auth</option>
          <option value="transaction">Transaction</option>
          <option value="p2p">P2P</option>
          <option value="system">System</option>
          <option value="security">Security</option>
        </select>
        <button className="btn-secondary flex items-center gap-2"><Filter className="w-4 h-4" /> More</button>
      </div>

      <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Category</th>
                <th>Message</th>
                <th>User</th>
                <th>IP</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8"><div className="animate-spin w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-text-secondary">No logs found</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className={log.level === 'error' ? 'bg-status-error/5' : log.level === 'warning' ? 'bg-status-warning/5' : ''}>
                  <td>
                    <div className="flex items-center gap-2">
                      {getLevelIcon(log.level)}
                      {getLevelBadge(log.level)}
                    </div>
                  </td>
                  <td>{getCategoryBadge(log.category)}</td>
                  <td className="text-text-primary max-w-md truncate">{log.message}</td>
                  <td className="text-text-secondary">{log.userName || '-'}</td>
                  <td className="text-text-secondary font-mono text-sm">{log.ip || '-'}</td>
                  <td className="text-text-secondary text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-divider">
          <p className="text-sm text-text-secondary">Page {currentPage} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="btn-secondary p-2 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="btn-secondary p-2 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsPage;
