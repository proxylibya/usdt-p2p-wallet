import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, AlertTriangle, Clock, CheckCircle, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface Dispute {
  id: string;
  tradeId: string;
  initiatorId: string;
  initiatorName: string;
  respondentId: string;
  respondentName: string;
  reason: string;
  status: 'open' | 'in_review' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  amount: number;
  asset: string;
  createdAt: string;
  assignedTo?: string;
}

const DisputesPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDisputes();
  }, [currentPage, statusFilter]);

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ disputes: Dispute[]; totalPages: number }>(`/admin/disputes?page=${currentPage}&status=${statusFilter}`);
      if (response.success && response.data) {
        setDisputes(response.data.disputes);
        setTotalPages(response.data.totalPages);
      }
    } catch {
      setDisputes([]);
      setTotalPages(1);
    }
    setIsLoading(false);
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-500/20 text-gray-400',
      medium: 'badge-warning',
      high: 'bg-orange-500/20 text-orange-400',
      critical: 'badge-error',
    };
    return <span className={`badge ${styles[priority] || ''}`}>{priority}</span>;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'badge-warning',
      in_review: 'badge-info',
      resolved: 'badge-success',
      escalated: 'badge-error',
    };
    return <span className={`badge ${styles[status] || ''}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Disputes Management</h1>
        <p className="text-text-secondary mt-1">Handle and resolve P2P trade disputes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-status-warning">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-status-warning" />
            <div>
              <p className="text-text-secondary text-sm">Open</p>
              <p className="text-2xl font-bold text-text-primary">12</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-status-info">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-status-info" />
            <div>
              <p className="text-text-secondary text-sm">In Review</p>
              <p className="text-2xl font-bold text-text-primary">8</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-status-error">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-status-error" />
            <div>
              <p className="text-text-secondary text-sm">Escalated</p>
              <p className="text-2xl font-bold text-text-primary">3</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-status-success">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-status-success" />
            <div>
              <p className="text-text-secondary text-sm">Resolved Today</p>
              <p className="text-2xl font-bold text-text-primary">5</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background-secondary p-4 rounded-xl border border-border-divider flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input type="text" placeholder="Search disputes..." className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-40">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_review">In Review</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
        </select>
        <button className="btn-secondary flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</button>
      </div>

      <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Trade</th>
                <th>Initiator</th>
                <th>Respondent</th>
                <th>Reason</th>
                <th>Amount</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="text-center py-8"><div className="animate-spin w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : disputes.map((dispute) => (
                <tr key={dispute.id} className={dispute.priority === 'critical' ? 'bg-status-error/5' : ''}>
                  <td className="font-mono text-text-primary">{dispute.id}</td>
                  <td className="text-text-secondary">{dispute.tradeId}</td>
                  <td className="text-text-primary">{dispute.initiatorName}</td>
                  <td className="text-text-primary">{dispute.respondentName}</td>
                  <td className="text-text-secondary max-w-xs truncate">{dispute.reason}</td>
                  <td className="font-medium text-text-primary">{dispute.amount} {dispute.asset}</td>
                  <td>{getPriorityBadge(dispute.priority)}</td>
                  <td>{getStatusBadge(dispute.status)}</td>
                  <td className="text-text-secondary">{dispute.createdAt}</td>
                  <td>
                    <button onClick={() => navigate(`/disputes/${dispute.id}`)} className="btn-secondary text-sm flex items-center gap-1">
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </td>
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

export default DisputesPage;
