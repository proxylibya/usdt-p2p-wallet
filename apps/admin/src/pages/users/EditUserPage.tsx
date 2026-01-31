import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Shield, Save, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface UserData {
  id: string;
  name: string;
  phone: string;
  email: string;
  isActive: boolean;
  isBanned: boolean;
  kycStatus: string;
}

const EditUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    id: '',
    name: '',
    phone: '',
    email: '',
    isActive: true,
    isBanned: false,
    kycStatus: 'NOT_VERIFIED',
  });

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<UserData>(`/admin/users/${id}`);
      if (response.success && response.data) {
        setFormData(response.data);
      }
    } catch {
      error('Load Failed', 'Failed to load user data');
      navigate('/users');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await apiClient.put(`/admin/users/${id}`, {
        name: formData.name,
        email: formData.email,
        avatarUrl: formData.avatarUrl,
        isActive: formData.isActive,
        isBanned: formData.isBanned,
      });
      if (response.success) {
        success('User Updated', 'User information has been updated successfully');
        navigate(`/users/${id}`);
      } else {
        error('Update Failed', response.error || 'Failed to update user');
      }
    } catch {
      error('Error', 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (action: 'activate' | 'suspend' | 'ban') => {
    try {
      const endpoint = `/admin/users/${id}/status`;
      let body = {};
      
      if (action === 'activate') {
        body = { isActive: true, isBanned: false };
      } else if (action === 'suspend') {
        body = { isActive: false };
      } else if (action === 'ban') {
        body = { isBanned: true, isActive: false };
      }

      const response = await apiClient.put(endpoint, body);
      if (response.success) {
        success('Status Updated', `User has been ${action}d`);
        fetchUser();
      }
    } catch {
      error('Action Failed', `Failed to ${action} user`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/users/${id}`)}
          className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Edit User</h1>
          <p className="text-text-secondary mt-1">Update user information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-background-secondary rounded-xl border border-border-divider p-6 space-y-6">
            <h3 className="text-lg font-semibold text-text-primary">Basic Information</h3>
            
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Phone (Read-only) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="tel"
                  value={formData.phone}
                  disabled
                  className="input-field pl-10 bg-background-tertiary cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-text-secondary">Phone number cannot be changed</p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field pl-10"
                  placeholder="user@example.com"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border-divider">
              <button
                type="button"
                onClick={() => navigate(`/users/${id}`)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar - Status & KYC */}
        <div className="space-y-6">
          {/* Account Status */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" /> Account Status
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                <span className="text-text-secondary">Status</span>
                <span className={`badge ${formData.isActive && !formData.isBanned ? 'badge-success' : formData.isBanned ? 'badge-error' : 'badge-warning'}`}>
                  {formData.isBanned ? 'Banned' : formData.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                <span className="text-text-secondary">KYC Status</span>
                <span className={`badge ${formData.kycStatus === 'VERIFIED' ? 'badge-success' : formData.kycStatus === 'PENDING' ? 'badge-warning' : 'badge-info'}`}>
                  {formData.kycStatus}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {formData.isActive && !formData.isBanned ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('suspend')}
                    className="w-full btn-secondary text-status-warning"
                  >
                    Suspend Account
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('ban')}
                    className="w-full btn-danger"
                  >
                    Ban Account
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStatusChange('activate')}
                  className="w-full btn-success"
                >
                  Activate Account
                </button>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">User ID</span>
                <span className="text-text-primary font-mono">{formData.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserPage;
