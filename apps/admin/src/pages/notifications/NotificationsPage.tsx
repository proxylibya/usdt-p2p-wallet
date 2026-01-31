import { useState, useEffect } from 'react';
import { Bell, Send, Plus, Trash2, Users, User, Globe, CheckCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target: 'all' | 'users' | 'merchants' | 'specific';
  targetCount: number;
  sentAt: string;
  readCount: number;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    target: 'all' as const,
  });
  const { success, error } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ notifications: Notification[] }>('/admin/notifications');
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
      }
    } catch {
      // Keep placeholder if fetch fails for demo but ideally show error
      console.error('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newNotification.title || !newNotification.message) {
      error('Validation Error', 'Please fill in all fields');
      return;
    }
    try {
      const response = await apiClient.post('/admin/notifications', newNotification);
      if (response.success) {
        success('Notification Sent', 'Notification has been sent successfully');
        setShowCreateModal(false);
        setNewNotification({ title: '', message: '', type: 'info', target: 'all' });
        fetchNotifications();
      } else {
        error('Failed', response.error || 'Could not send notification');
      }
    } catch {
      error('Failed', 'Could not send notification');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    try {
      const response = await apiClient.delete(`/admin/notifications/${id}`);
      if (response.success) {
        success('Deleted', 'Notification has been deleted');
        fetchNotifications();
      } else {
        error('Failed', response.error || 'Could not delete notification');
      }
    } catch {
      error('Failed', 'Could not delete notification');
    }
  };

  const getTargetIcon = (target: string) => {
    switch (target) {
      case 'all': return <Globe className="w-4 h-4" />;
      case 'users': return <Users className="w-4 h-4" />;
      case 'merchants': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      info: 'badge-info',
      warning: 'badge-warning',
      success: 'badge-success',
      error: 'badge-error',
    };
    return <span className={`badge ${styles[type] || ''}`}>{type}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Push Notifications</h1>
          <p className="text-text-secondary mt-1">Send and manage platform notifications</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Notification
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-yellow/20 rounded-xl"><Bell className="w-6 h-6 text-brand-yellow" /></div>
            <div>
              <p className="text-text-secondary text-sm">Total Sent</p>
              <p className="text-2xl font-bold text-text-primary">{notifications.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-success/20 rounded-xl"><CheckCircle className="w-6 h-6 text-status-success" /></div>
            <div>
              <p className="text-text-secondary text-sm">Avg. Read Rate</p>
              <p className="text-2xl font-bold text-text-primary">78.5%</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-info/20 rounded-xl"><Users className="w-6 h-6 text-status-info" /></div>
            <div>
              <p className="text-text-secondary text-sm">Total Reach</p>
              <p className="text-2xl font-bold text-text-primary">48.2K</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
        <div className="p-4 border-b border-border-divider">
          <h3 className="font-semibold text-text-primary">Recent Notifications</h3>
        </div>
        <div className="divide-y divide-border-divider">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="animate-spin w-6 h-6 text-brand-yellow mx-auto" /></div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">No notifications found</div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className="p-4 hover:bg-background-tertiary transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeBadge(notif.type)}
                      <span className="text-sm text-text-secondary flex items-center gap-1">
                        {getTargetIcon(notif.target)} {notif.target}
                      </span>
                    </div>
                    <h4 className="font-semibold text-text-primary">{notif.title}</h4>
                    <p className="text-text-secondary text-sm mt-1">{notif.message}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-text-secondary">
                      <span>Sent: {new Date(notif.sentAt).toLocaleString()}</span>
                      <span>Target: {notif.targetCount.toLocaleString()}</span>
                      <span className="text-status-success">Read: {notif.readCount.toLocaleString()}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(notif.id)} className="p-2 hover:bg-status-error/20 rounded-lg text-text-secondary hover:text-status-error transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background-secondary rounded-xl border border-border-divider w-full max-w-md">
            <div className="p-4 border-b border-border-divider flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">New Notification</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-text-secondary hover:text-text-primary">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Title</label>
                <input type="text" value={newNotification.title} onChange={(e) => setNewNotification({...newNotification, title: e.target.value})} className="input-field" placeholder="Notification title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Message</label>
                <textarea value={newNotification.message} onChange={(e) => setNewNotification({...newNotification, message: e.target.value})} className="input-field h-24 resize-none" placeholder="Notification message" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Type</label>
                  <select value={newNotification.type} onChange={(e) => setNewNotification({...newNotification, type: e.target.value as 'info'})} className="input-field">
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Target</label>
                  <select value={newNotification.target} onChange={(e) => setNewNotification({...newNotification, target: e.target.value as 'all'})} className="input-field">
                    <option value="all">All Users</option>
                    <option value="users">Regular Users</option>
                    <option value="merchants">Merchants Only</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border-divider flex gap-3 justify-end">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
                <Send className="w-4 h-4" /> Send Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
