import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import FormPageLayout from '../../components/ui/FormPageLayout';
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
  isPinned: boolean;
  startDate: string;
  endDate?: string;
}

const ANNOUNCEMENT_TYPES = [
  { value: 'info', label: 'Information', color: 'bg-status-info/20 text-status-info' },
  { value: 'warning', label: 'Warning', color: 'bg-status-warning/20 text-status-warning' },
  { value: 'success', label: 'Success', color: 'bg-status-success/20 text-status-success' },
  { value: 'promo', label: 'Promotion', color: 'bg-purple-500/20 text-purple-400' },
];

const TARGET_AUDIENCES = [
  { value: 'all', label: 'All Users', description: 'Everyone on the platform' },
  { value: 'verified', label: 'Verified Users', description: 'Users with completed KYC' },
  { value: 'merchants', label: 'Merchants Only', description: 'P2P merchants and sellers' },
];

const AnnouncementFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    content: '',
    contentAr: '',
    type: 'info' as Announcement['type'],
    target: 'all' as Announcement['target'],
    isPinned: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  useEffect(() => {
    if (isEditing) {
      fetchAnnouncement();
    }
  }, [id]);

  const fetchAnnouncement = async () => {
    try {
      const response = await apiClient.get<Announcement>(`/admin/announcements/${id}`);
      if (response.success && response.data) {
        const data = response.data;
        setFormData({
          title: data.title,
          titleAr: data.titleAr,
          content: data.content,
          contentAr: data.contentAr,
          type: data.type,
          target: data.target,
          isPinned: data.isPinned,
          startDate: data.startDate.split('T')[0],
          endDate: data.endDate?.split('T')[0] || '',
        });
      }
    } catch {
      error('Error', 'Could not load announcement');
      navigate('/announcements');
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      error('Validation Error', 'Title and content are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await apiClient.put(`/admin/announcements/${id}`, formData);
        success('Updated', 'Announcement updated successfully');
      } else {
        await apiClient.post('/admin/announcements', formData);
        success('Created', 'Announcement created successfully');
      }
      navigate('/announcements');
    } catch {
      error('Failed', 'Could not save announcement');
    }
    setIsSubmitting(false);
  };

  return (
    <FormPageLayout
      title={isEditing ? 'Edit Announcement' : 'New Announcement'}
      subtitle={isEditing ? 'Update announcement details' : 'Create a new platform announcement'}
      backPath="/announcements"
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? 'Update' : 'Create Announcement'}
      icon={<Megaphone className="w-6 h-6 text-brand-yellow" />}
    >
      {/* Title - English & Arabic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Title (English) *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input-field"
            placeholder="Announcement title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Title (Arabic)</label>
          <input
            type="text"
            value={formData.titleAr}
            onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
            className="input-field"
            dir="rtl"
            placeholder="عنوان الإعلان"
          />
        </div>
      </div>

      {/* Content - English */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Content (English) *</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="input-field h-32 resize-none"
          placeholder="Announcement content..."
        />
      </div>

      {/* Content - Arabic */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Content (Arabic)</label>
        <textarea
          value={formData.contentAr}
          onChange={(e) => setFormData({ ...formData, contentAr: e.target.value })}
          className="input-field h-32 resize-none"
          dir="rtl"
          placeholder="محتوى الإعلان..."
        />
      </div>

      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Type *</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ANNOUNCEMENT_TYPES.map((type) => (
            <label
              key={type.value}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-colors ${
                formData.type === type.value
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-border-divider bg-background-tertiary hover:border-brand-yellow/50'
              }`}
            >
              <input
                type="radio"
                name="type"
                value={type.value}
                checked={formData.type === type.value}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Announcement['type'] })}
                className="sr-only"
              />
              <span className={`px-2 py-1 rounded text-sm font-medium ${type.color}`}>{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Target Audience *</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TARGET_AUDIENCES.map((target) => (
            <label
              key={target.value}
              className={`flex flex-col gap-1 p-4 rounded-xl border cursor-pointer transition-colors ${
                formData.target === target.value
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-border-divider bg-background-tertiary hover:border-brand-yellow/50'
              }`}
            >
              <input
                type="radio"
                name="target"
                value={target.value}
                checked={formData.target === target.value}
                onChange={(e) => setFormData({ ...formData, target: e.target.value as Announcement['target'] })}
                className="sr-only"
              />
              <span className="text-text-primary font-medium">{target.label}</span>
              <span className="text-text-secondary text-xs">{target.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Start Date *</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">End Date (Optional)</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="input-field"
          />
          <p className="text-xs text-text-secondary mt-1">Leave empty for no end date</p>
        </div>
      </div>

      {/* Pin Option */}
      <div className="flex items-center gap-4 p-4 bg-background-tertiary rounded-xl">
        <input
          type="checkbox"
          id="isPinned"
          checked={formData.isPinned}
          onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
          className="w-5 h-5 accent-brand-yellow"
        />
        <label htmlFor="isPinned" className="cursor-pointer">
          <span className="text-text-primary font-medium">Pin to Top</span>
          <p className="text-text-secondary text-sm">This announcement will appear at the top of the list</p>
        </label>
      </div>
    </FormPageLayout>
  );
};

export default AnnouncementFormPage;
