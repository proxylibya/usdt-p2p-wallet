import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban } from 'lucide-react';
import FormPageLayout from '../../components/ui/FormPageLayout';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

const ENTITY_TYPES = [
  { value: 'ip', label: 'IP Address', icon: '🌐', description: 'Block specific IP address or range', placeholder: '192.168.1.1 or 192.168.1.0/24' },
  { value: 'device', label: 'Device ID', icon: '📱', description: 'Block a specific device identifier', placeholder: 'device_abc123' },
  { value: 'user', label: 'User ID', icon: '👤', description: 'Block a user account', placeholder: 'user_12345' },
  { value: 'country', label: 'Country', icon: '🌍', description: 'Block access from a country', placeholder: 'KP (use ISO code)' },
];

const DURATION_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'permanent', label: 'Permanent' },
];

const BlockEntityPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'ip',
    value: '',
    reason: '',
    duration: '24h',
  });

  const selectedType = ENTITY_TYPES.find(t => t.value === formData.type);

  const handleSubmit = async () => {
    if (!formData.value) {
      error('Validation Error', 'Value is required');
      return;
    }

    if (!formData.reason) {
      error('Validation Error', 'Reason is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/admin/security/block', formData);
      
      if (response.success) {
        success('Blocked', `${formData.type.toUpperCase()} blocked successfully`);
        navigate('/security');
      } else {
        error('Failed', response.error || 'Could not block entity');
      }
    } catch {
      error('Failed', 'Could not block entity');
    }
    setIsSubmitting(false);
  };

  return (
    <FormPageLayout
      title="Block Entity"
      subtitle="Add a new security block rule"
      backPath="/security"
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitLabel="Block Entity"
      icon={<Ban className="w-6 h-6 text-status-error" />}
    >
      {/* Entity Type */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">What do you want to block? *</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ENTITY_TYPES.map((type) => (
            <label
              key={type.value}
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                formData.type === type.value
                  ? 'border-status-error bg-status-error/10'
                  : 'border-border-divider bg-background-tertiary hover:border-status-error/50'
              }`}
            >
              <input
                type="radio"
                name="type"
                value={type.value}
                checked={formData.type === type.value}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, value: '' })}
                className="sr-only"
              />
              <span className="text-2xl">{type.icon}</span>
              <div>
                <span className="text-text-primary font-medium">{type.label}</span>
                <p className="text-text-secondary text-xs mt-1">{type.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Value */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">{selectedType?.label} Value *</label>
        <input
          type="text"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          className="input-field font-mono"
          placeholder={selectedType?.placeholder}
        />
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Reason for Blocking *</label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className="input-field h-24 resize-none"
          placeholder="Explain why this entity is being blocked..."
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Block Duration *</label>
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
          {DURATION_OPTIONS.map((duration) => (
            <label
              key={duration.value}
              className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-colors text-sm ${
                formData.duration === duration.value
                  ? 'border-brand-yellow bg-brand-yellow/10 text-text-primary'
                  : 'border-border-divider bg-background-tertiary hover:border-brand-yellow/50 text-text-secondary'
              }`}
            >
              <input
                type="radio"
                name="duration"
                value={duration.value}
                checked={formData.duration === duration.value}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="sr-only"
              />
              <span className="font-medium">{duration.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-status-error/10 border border-status-error/30 rounded-xl p-4">
        <h3 className="text-status-error font-medium mb-3">⚠️ Blocking Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-text-secondary">Type:</span>
            <span className="text-text-primary capitalize">{formData.type}</span>
          </div>
          {formData.value && (
            <div className="flex gap-2">
              <span className="text-text-secondary">Value:</span>
              <code className="text-text-primary bg-background-tertiary px-2 py-0.5 rounded">{formData.value}</code>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-text-secondary">Duration:</span>
            <span className="text-text-primary">{DURATION_OPTIONS.find(d => d.value === formData.duration)?.label}</span>
          </div>
        </div>
        <p className="text-text-secondary text-xs mt-4">
          This action will take effect immediately. The entity will be blocked from accessing the platform.
        </p>
      </div>
    </FormPageLayout>
  );
};

export default BlockEntityPage;
