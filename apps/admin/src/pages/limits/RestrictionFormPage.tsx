import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban } from 'lucide-react';
import FormPageLayout from '../../components/ui/FormPageLayout';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

const RESTRICTION_TYPES = [
  { value: 'country', label: 'Country', description: 'Block by country code', placeholder: 'e.g., KP, IR' },
  { value: 'ip_range', label: 'IP Range', description: 'Block IP addresses', placeholder: 'e.g., 192.168.1.0/24' },
  { value: 'device', label: 'Device Type', description: 'Block device types', placeholder: 'e.g., emulator, rooted' },
  { value: 'time', label: 'Time-based', description: 'Time restrictions', placeholder: 'e.g., 00:00-06:00' },
];

const RESTRICTION_ACTIONS = [
  { value: 'block', label: 'Block Access', description: 'Completely deny access', color: 'bg-status-error/20 text-status-error' },
  { value: 'warn', label: 'Show Warning', description: 'Display warning message', color: 'bg-status-warning/20 text-status-warning' },
  { value: 'require_2fa', label: 'Require 2FA', description: 'Force 2FA verification', color: 'bg-status-info/20 text-status-info' },
];

const RestrictionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'country' as 'country' | 'ip_range' | 'device' | 'time',
    value: '',
    action: 'block' as 'block' | 'warn' | 'require_2fa',
    reason: '',
  });

  const selectedType = RESTRICTION_TYPES.find(t => t.value === formData.type);

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
      const response = await apiClient.post('/admin/limits/restrictions', formData);
      
      if (response.success) {
        success('Created', 'Restriction added successfully');
        navigate('/limits');
      } else {
        error('Failed', response.error || 'Could not add restriction');
      }
    } catch {
      error('Failed', 'Could not add restriction');
    }
    setIsSubmitting(false);
  };

  return (
    <FormPageLayout
      title="Add Restriction"
      subtitle="Create a new access restriction rule"
      backPath="/limits"
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitLabel="Add Restriction"
      icon={<Ban className="w-6 h-6 text-brand-yellow" />}
    >
      {/* Restriction Type */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Restriction Type *</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RESTRICTION_TYPES.map((type) => (
            <label
              key={type.value}
              className={`flex flex-col gap-1 p-4 rounded-xl border cursor-pointer transition-colors ${
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
                onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type, value: '' })}
                className="sr-only"
              />
              <span className="text-text-primary font-medium">{type.label}</span>
              <span className="text-text-secondary text-xs">{type.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Value */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Value *</label>
        <input
          type="text"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          className="input-field font-mono"
          placeholder={selectedType?.placeholder}
        />
        <p className="text-xs text-text-secondary mt-2">
          {formData.type === 'country' && 'Use ISO 2-letter country codes (e.g., US, KP, IR)'}
          {formData.type === 'ip_range' && 'Enter IP address or CIDR range'}
          {formData.type === 'device' && 'Enter device identifier pattern'}
          {formData.type === 'time' && 'Enter time range in 24h format (HH:MM-HH:MM)'}
        </p>
      </div>

      {/* Action */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Action *</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {RESTRICTION_ACTIONS.map((action) => (
            <label
              key={action.value}
              className={`flex flex-col gap-2 p-4 rounded-xl border cursor-pointer transition-colors ${
                formData.action === action.value
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-border-divider bg-background-tertiary hover:border-brand-yellow/50'
              }`}
            >
              <input
                type="radio"
                name="action"
                value={action.value}
                checked={formData.action === action.value}
                onChange={(e) => setFormData({ ...formData, action: e.target.value as typeof formData.action })}
                className="sr-only"
              />
              <span className={`px-2 py-1 rounded text-sm font-medium w-fit ${action.color}`}>
                {action.label}
              </span>
              <span className="text-text-secondary text-xs">{action.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Reason *</label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className="input-field h-24 resize-none"
          placeholder="Explain why this restriction is being added..."
        />
      </div>

      {/* Warning */}
      <div className="bg-status-warning/10 border border-status-warning/30 rounded-xl p-4">
        <p className="text-status-warning font-medium">⚠️ Important</p>
        <p className="text-text-secondary text-sm mt-1">
          This restriction will take effect immediately. Make sure you understand the impact before proceeding.
        </p>
      </div>
    </FormPageLayout>
  );
};

export default RestrictionFormPage;
