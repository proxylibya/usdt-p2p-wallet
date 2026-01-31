import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Shield, Key, Ban, CheckCircle, MoreVertical, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  permissions: string[];
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'badge-error',
  ADMIN: 'badge-warning',
  MODERATOR: 'badge-info',
  SUPPORT: 'badge-success',
};

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ admins: AdminUser[] }>('/admin/admins');
      if (response.success && response.data) {
        setAdmins(response.data.admins);
      }
    } catch {
      setAdmins([]);
    }
    setIsLoading(false);
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await apiClient.patch(`/admin/admins/${id}/status`, { isActive: !isActive });
      success('Status Updated', `Admin has been ${isActive ? 'disabled' : 'enabled'}`);
      fetchAdmins();
    } catch {
      error('Failed', 'Could not update status');
    }
    setSelectedAdmin(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Users</h1>
          <p className="text-text-secondary mt-1">Manage administrator accounts and permissions</p>
        </div>
        <button onClick={() => navigate('/admins/create')} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Admin
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-error/20 rounded-xl">
              <Shield className="w-6 h-6 text-status-error" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Super Admins</p>
              <p className="text-2xl font-bold text-text-primary">{admins.filter(a => a.role === 'SUPER_ADMIN').length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-warning/20 rounded-xl">
              <Shield className="w-6 h-6 text-status-warning" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Admins</p>
              <p className="text-2xl font-bold text-text-primary">{admins.filter(a => a.role === 'ADMIN').length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-info/20 rounded-xl">
              <Shield className="w-6 h-6 text-status-info" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Moderators</p>
              <p className="text-2xl font-bold text-text-primary">{admins.filter(a => a.role === 'MODERATOR').length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-success/20 rounded-xl">
              <Shield className="w-6 h-6 text-status-success" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Support</p>
              <p className="text-2xl font-bold text-text-primary">{admins.filter(a => a.role === 'SUPPORT').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input type="text" placeholder="Search admins..." className="input-field pl-10" />
      </div>

      {/* Table */}
      <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-yellow" /></td></tr>
            ) : admins.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-text-secondary">No admin users found</td></tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                        <span className="text-brand-yellow font-semibold">{admin.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{admin.name}</p>
                        <p className="text-sm text-text-secondary">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${roleColors[admin.role]}`}>{admin.role.replace('_', ' ')}</span></td>
                  <td>
                    <span className={`badge ${admin.isActive ? 'badge-success' : 'badge-error'}`}>
                      {admin.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="text-text-secondary">{admin.lastLoginAt || 'Never'}</td>
                  <td className="text-text-secondary">{admin.createdAt}</td>
                  <td>
                    <div className="relative">
                      <button onClick={() => setSelectedAdmin(selectedAdmin === admin.id ? null : admin.id)} className="p-2 hover:bg-background-tertiary rounded-lg">
                        <MoreVertical className="w-4 h-4 text-text-secondary" />
                      </button>
                      {selectedAdmin === admin.id && (
                        <div className="absolute right-0 top-full mt-1 bg-background-tertiary border border-border-divider rounded-lg shadow-xl z-10 py-1 min-w-40">
                          <button className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-background-secondary flex items-center gap-2">
                            <Key className="w-4 h-4" /> Reset Password
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(admin.id, admin.isActive)}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-background-secondary flex items-center gap-2 ${admin.isActive ? 'text-status-error' : 'text-status-success'}`}
                          >
                            {admin.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            {admin.isActive ? 'Disable' : 'Enable'}
                          </button>
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

    </div>
  );
};

export default AdminUsersPage;
