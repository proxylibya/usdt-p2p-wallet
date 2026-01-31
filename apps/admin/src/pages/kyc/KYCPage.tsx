import { useState, useEffect } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, ChevronLeft, ChevronRight, FileText, User } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface KYCRequest {
  id: string;
  userId: string;
  userName: string;
  email: string;
  documentType: 'passport' | 'national_id' | 'drivers_license';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  documents: string[];
}

const KYCPage: React.FC = () => {
  const [requests, setRequests] = useState<KYCRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<KYCRequest | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    fetchRequests();
  }, [currentPage, statusFilter]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const endpoint = statusFilter === 'pending' ? '/admin/kyc/pending' : '/admin/kyc/pending'; // Fallback to pending for now as backend mainly supports it
      const response = await apiClient.get<{ requests: KYCRequest[]; totalPages: number }>(`${endpoint}?page=${currentPage}&limit=20`);
      if (response.success && response.data) {
        setRequests(response.data.requests);
        setTotalPages(response.data.totalPages);
      }
    } catch {
      setRequests([]);
      setTotalPages(1);
    }
    setIsLoading(false);
  };

  const handleApprove = async (userId: string) => {
    try {
      const response = await apiClient.put(`/admin/kyc/${userId}/verify`, { status: 'VERIFIED' });
      if (response.success) {
        success('KYC Approved', 'User verification has been approved');
        setSelectedRequest(null);
        fetchRequests();
      } else {
        error('Failed', response.error || 'Could not approve KYC');
      }
    } catch {
      error('Failed', 'Could not approve KYC');
    }
  };

  const handleReject = async (userId: string, reason?: string) => {
    try {
      const response = await apiClient.put(`/admin/kyc/${userId}/verify`, { 
        status: 'REJECTED', 
        reason: reason || 'Documents did not meet requirements' 
      });
      if (response.success) {
        success('KYC Rejected', 'User verification has been rejected');
        setSelectedRequest(null);
        fetchRequests();
      } else {
        error('Failed', response.error || 'Could not reject KYC');
      }
    } catch {
      error('Failed', 'Could not reject KYC');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">KYC Verification</h1>
        <p className="text-text-secondary mt-1">Review and verify user identity documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card border-l-4 border-status-warning">
          <p className="text-text-secondary text-sm">Pending Review</p>
          <p className="text-3xl font-bold text-status-warning mt-1">156</p>
        </div>
        <div className="stat-card border-l-4 border-status-success">
          <p className="text-text-secondary text-sm">Approved Today</p>
          <p className="text-3xl font-bold text-status-success mt-1">23</p>
        </div>
        <div className="stat-card border-l-4 border-status-error">
          <p className="text-text-secondary text-sm">Rejected Today</p>
          <p className="text-3xl font-bold text-status-error mt-1">5</p>
        </div>
      </div>

      <div className="bg-background-secondary p-4 rounded-xl border border-border-divider flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input type="text" placeholder="Search by name or email..." className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-40">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
        <button className="btn-secondary flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests List */}
        <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
          <div className="p-4 border-b border-border-divider">
            <h3 className="font-semibold text-text-primary">Verification Requests</h3>
          </div>
          <div className="divide-y divide-border-divider max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full mx-auto" /></div>
            ) : requests.map((req) => (
              <div
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className={`p-4 cursor-pointer hover:bg-background-tertiary transition-colors ${selectedRequest?.id === req.id ? 'bg-background-tertiary' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-brand-yellow" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{req.userName}</p>
                      <p className="text-sm text-text-secondary">{req.email}</p>
                    </div>
                  </div>
                  <span className={`badge ${req.status === 'pending' ? 'badge-warning' : req.status === 'approved' ? 'badge-success' : 'badge-error'}`}>
                    {req.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-text-secondary">
                  <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {req.documentType.replace('_', ' ')}</span>
                  <span>{req.submittedAt}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border-divider flex items-center justify-between">
            <p className="text-sm text-text-secondary">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="btn-secondary p-2 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="btn-secondary p-2 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Document Preview */}
        <div className="bg-background-secondary rounded-xl border border-border-divider">
          {selectedRequest ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">Document Review</h3>
                <span className="text-sm text-text-secondary">ID: {selectedRequest.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedRequest.documents.map((doc, idx) => (
                  <div key={idx} className="aspect-video bg-background-tertiary rounded-lg flex items-center justify-center border border-border-divider hover:border-brand-yellow cursor-pointer transition-colors">
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-text-secondary mx-auto mb-2" />
                      <p className="text-sm text-text-secondary">{doc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between p-3 bg-background-tertiary rounded-lg">
                  <span className="text-text-secondary">Document Type</span>
                  <span className="text-text-primary capitalize">{selectedRequest.documentType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between p-3 bg-background-tertiary rounded-lg">
                  <span className="text-text-secondary">Submitted</span>
                  <span className="text-text-primary">{selectedRequest.submittedAt}</span>
                </div>
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3">
                  <button onClick={() => handleReject(selectedRequest.userId)} className="flex-1 btn-danger flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button onClick={() => handleApprove(selectedRequest.userId)} className="flex-1 btn-success flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Eye className="w-12 h-12 text-text-disabled mx-auto mb-3" />
              <p className="text-text-secondary">Select a request to review documents</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCPage;
