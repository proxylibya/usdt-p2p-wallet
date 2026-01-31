import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, UserPlus, ChevronLeft, ChevronRight, Eye, Ban, CheckCircle, MoreVertical, Download, Shield } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { exportToCSV } from '../../utils/exportCSV';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended' | 'pending';
  kycStatus: 'verified' | 'pending' | 'rejected' | 'none';
  role: 'user' | 'merchant' | 'admin';
  balance: number;
  trades: number;
  createdAt: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const navigate = useNavigate();
  const { success, error } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, statusFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ users: User[]; total: number; totalPages: number }>(
        `/admin/users?page=${currentPage}&status=${statusFilter}&search=${searchTerm}`
      );
      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotalPages(response.data.totalPages);
      }
    } catch (err) {
      error('Load Failed', 'Failed to fetch users');
      setUsers([]);
      setTotalPages(1);
    }
    setIsLoading(false);
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const response = await apiClient.patch(`/admin/users/${userId}/suspend`);
      if (response.success) {
        success('User Suspended', 'User has been suspended successfully');
        fetchUsers();
      }
    } catch {
      error('Action Failed', 'Failed to suspend user');
    }
    setSelectedUser(null);
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const response = await apiClient.patch(`/admin/users/${userId}/activate`);
      if (response.success) {
        success('User Activated', 'User has been activated successfully');
        fetchUsers();
      }
    } catch {
      error('Action Failed', 'Failed to activate user');
    }
    setSelectedUser(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="badge badge-success">Active</span>;
      case 'suspended': return <span className="badge badge-error">Suspended</span>;
      case 'pending': return <span className="badge badge-warning">Pending</span>;
      default: return <span className="badge badge-info">{status}</span>;
    }
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'verified': return <span className="badge badge-success">Verified</span>;
      case 'pending': return <span className="badge badge-warning">Pending</span>;
      case 'rejected': return <span className="badge badge-error">Rejected</span>;
      default: return <span className="badge badge-info">None</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with animation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Users Management</h1>
          <p className="text-text-secondary mt-1">Manage all platform users</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => exportToCSV(users as unknown as Record<string, unknown>[], 'users')}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={() => navigate('/users/create')}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters with animation */}
      <div className="bg-background-secondary p-4 rounded-xl border border-border-divider flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Table with animation */}
      <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="overflow-x-auto">
          <table className="data-table data-table-animated">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Status</th>
                <th>KYC</th>
                <th>Role</th>
                <th>Balance</th>
                <th>Trades</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-text-secondary">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                          <span className="text-brand-yellow font-semibold">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{user.name}</p>
                          <p className="text-sm text-text-secondary">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-text-primary">{user.phone}</td>
                    <td>{getStatusBadge(user.status)}</td>
                    <td>{getKycBadge(user.kycStatus)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {user.role === 'merchant' && <Shield className="w-4 h-4 text-brand-yellow" />}
                        <span className="capitalize text-text-primary">{user.role}</span>
                      </div>
                    </td>
                    <td className="text-text-primary font-medium">${user.balance.toLocaleString()}</td>
                    <td className="text-text-primary">{user.trades}</td>
                    <td className="text-text-secondary">{user.createdAt}</td>
                    <td>
                      <div className="relative">
                        <button
                          onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                          className="p-2 hover:bg-background-tertiary rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                        >
                          <MoreVertical className="w-4 h-4 text-text-secondary" />
                        </button>
                        {selectedUser === user.id && (
                          <div className="absolute right-0 top-full mt-1 bg-background-tertiary border border-border-divider rounded-lg shadow-xl z-10 py-1 min-w-40 dropdown-menu">
                            <button
                              onClick={() => navigate(`/users/${user.id}`)}
                              className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-background-secondary flex items-center gap-2 dropdown-item"
                            >
                              <Eye className="w-4 h-4" /> View Details
                            </button>
                            {user.status === 'active' ? (
                              <button
                                onClick={() => handleSuspendUser(user.id)}
                                className="w-full px-4 py-2 text-left text-sm text-status-error hover:bg-background-secondary flex items-center gap-2 dropdown-item"
                              >
                                <Ban className="w-4 h-4" /> Suspend User
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(user.id)}
                                className="w-full px-4 py-2 text-left text-sm text-status-success hover:bg-background-secondary flex items-center gap-2 dropdown-item"
                              >
                                <CheckCircle className="w-4 h-4" /> Activate User
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-divider">
          <p className="text-sm text-text-secondary">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn-secondary p-2 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary p-2 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
