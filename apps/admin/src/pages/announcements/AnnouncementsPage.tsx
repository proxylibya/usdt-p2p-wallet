import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Megaphone, Calendar, Users, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface Announcement {
  id: string;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  type: 'info' | 'warning' | 'success' | 'promo';
  target: 'all' | 'verified' | 'merchants';
  isActive: boolean;
  isPinned: boolean;
  startDate: string;
  endDate?: string;
  viewCount: number;
  createdAt: string;
}

const typeColors: Record<string, string> = {
  info: 'badge-info',
  warning: 'badge-warning',
  success: 'badge-success',
  promo: 'bg-purple-500/20 text-purple-400',
};

const AnnouncementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ announcements: Announcement[] }>('/admin/announcements');
      if (response.success && response.data) {
        setAnnouncements(response.data.announcements);
      }
    } catch {
      setAnnouncements([]);
    }
    setIsLoading(false);
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await apiClient.patch(`/admin/announcements/${id}/status`, { isActive: !isActive });
      success('Updated', `Announcement ${isActive ? 'hidden' : 'published'}`);
      fetchAnnouncements();
    } catch {
      error('Failed', 'Could not update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await apiClient.delete(`/admin/announcements/${id}`);
      success('Deleted', 'Announcement deleted');
      fetchAnnouncements();
    } catch {
      error('Failed', 'Could not delete announcement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Announcements</h1>
          <p className="text-text-secondary mt-1">Manage platform announcements and banners</p>
        </div>
        <button onClick={() => navigate('/announcements/create')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-success/20 rounded-xl">
              <Eye className="w-6 h-6 text-status-success" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Active</p>
              <p className="text-2xl font-bold text-text-primary">{announcements.filter(a => a.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-yellow/20 rounded-xl">
              <Megaphone className="w-6 h-6 text-brand-yellow" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Total</p>
              <p className="text-2xl font-bold text-text-primary">{announcements.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-info/20 rounded-xl">
              <Users className="w-6 h-6 text-status-info" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Total Views</p>
              <p className="text-2xl font-bold text-text-primary">{announcements.reduce((sum, a) => sum + a.viewCount, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Scheduled</p>
              <p className="text-2xl font-bold text-text-primary">{announcements.filter(a => new Date(a.startDate) > new Date()).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Announcement</th>
              <th>Type</th>
              <th>Target</th>
              <th>Views</th>
              <th>Period</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-yellow" /></td></tr>
            ) : announcements.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-text-secondary">No announcements yet</td></tr>
            ) : (
              announcements.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div>
                      <p className="font-medium text-text-primary">{item.title}</p>
                      <p className="text-sm text-text-secondary line-clamp-1">{item.content}</p>
                    </div>
                  </td>
                  <td><span className={`badge ${typeColors[item.type]}`}>{item.type}</span></td>
                  <td className="text-text-primary capitalize">{item.target}</td>
                  <td className="text-text-primary">{item.viewCount.toLocaleString()}</td>
                  <td className="text-text-secondary text-sm">
                    {item.startDate.split('T')[0]}
                    {item.endDate && ` - ${item.endDate.split('T')[0]}`}
                  </td>
                  <td>
                    <button onClick={() => handleToggleStatus(item.id, item.isActive)} className={`badge ${item.isActive ? 'badge-success' : 'badge-error'}`}>
                      {item.isActive ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/announcements/${item.id}/edit`)} className="p-2 hover:bg-background-tertiary rounded-lg">
                        <Edit2 className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-background-tertiary rounded-lg">
                        <Trash2 className="w-4 h-4 text-status-error" />
                      </button>
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

export default AnnouncementsPage;
