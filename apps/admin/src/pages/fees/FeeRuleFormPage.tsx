import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DollarSign } from 'lucide-react';
import FormPageLayout from '../../components/ui/FormPageLayout';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface FeeRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'tiered';
  category: 'trading' | 'withdrawal' | 'deposit' | 'p2p' | 'swap' | 'staking';
  value: number;
  minAmount?: number;
  maxAmount?: number;
  appliesTo: 'all' | 'verified' | 'vip' | 'merchant';
  description: string;
}

const FEE_CATEGORIES = [
  { value: 'trading', label: 'Trading', description: 'Buy/sell transactions' },
  { value: 'withdrawal', label: 'Withdrawal', description: 'Withdrawal fees' },
  { value: 'deposit', label: 'Deposit', description: 'Deposit fees' },
  { value: 'p2p', label: 'P2P', description: 'Peer-to-peer transactions' },
  { value: 'swap', label: 'Swap', description: 'Token swaps' },
  { value: 'staking', label: 'Staking', description: 'Staking rewards fee' },
];

const FEE_TYPES = [
  { value: 'percentage', label: 'Percentage', description: 'Fee as % of amount' },
  { value: 'fixed', label: 'Fixed Amount', description: 'Flat fee per transaction' },
  { value: 'tiered', label: 'Tiered', description: 'Volume-based fees' },
];

const USER_TYPES = [
  { value: 'all', label: 'All Users' },
  { value: 'verified', label: 'Verified Only' },
  { value: 'vip', label: 'VIP Users' },
  { value: 'merchant', label: 'Merchants' },
];

const FeeRuleFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage' as FeeRule['type'],
    category: 'trading' as FeeRule['category'],
    value: 0.1,
    minAmount: 0,
    maxAmount: 0,
    appliesTo: 'all' as FeeRule['appliesTo'],
    description: '',
  });

  useEffect(() => {
    if (isEditing) {
      fetchRule();
    }
  }, [id]);

  const fetchRule = async () => {
    try {
      const response = await apiClient.get<FeeRule>(`/admin/fees/rules/${id}`);
      if (response.success && response.data) {
        const data = response.data;
        setFormData({
          name: data.name,
          type: data.type,
          category: data.category,
          value: data.value,
          minAmount: data.minAmount || 0,
          maxAmount: data.maxAmount || 0,
          appliesTo: data.appliesTo,
          description: data.description,
        });
      }
    } catch {
      error('Error', 'Could not load fee rule');
      navigate('/fees');
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      error('Validation Error', 'Rule name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await apiClient.put(`/admin/fees/rules/${id}`, formData);
        success('Updated', 'Fee rule updated successfully');
      } else {
        await apiClient.post('/admin/fees/rules', formData);
        success('Created', 'Fee rule created successfully');
      }
      navigate('/fees');
    } catch {
      error('Failed', 'Could not save fee rule');
    }
    setIsSubmitting(false);
  };

  return (
    <FormPageLayout
      title={isEditing ? 'Edit Fee Rule' : 'Create Fee Rule'}
      subtitle={isEditing ? 'Update fee rule settings' : 'Configure a new platform fee'}
      backPath="/fees"
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? 'Update Rule' : 'Create Rule'}
      icon={<DollarSign className="w-6 h-6 text-brand-yellow" />}
    >
      {/* Rule Name */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Rule Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field"
          placeholder="e.g., Standard Trading Fee"
        />
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Category *</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FEE_CATEGORIES.map((cat) => (
            <label
              key={cat.value}
              className={`flex flex-col gap-1 p-4 rounded-xl border cursor-pointer transition-colors ${
                formData.category === cat.value
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-border-divider bg-background-tertiary hover:border-brand-yellow/50'
              }`}
            >
              <input
                type="radio"
                name="category"
                value={cat.value}
                checked={formData.category === cat.value}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as FeeRule['category'] })}
                className="sr-only"
              />
              <span className="text-text-primary font-medium">{cat.label}</span>
              <span className="text-text-secondary text-xs">{cat.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Fee Type */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Fee Type *</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FEE_TYPES.map((type) => (
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
                onChange={(e) => setFormData({ ...formData, type: e.target.value as FeeRule['type'] })}
                className="sr-only"
              />
              <span className="text-text-primary font-medium">{type.label}</span>
              <span className="text-text-secondary text-xs">{type.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Fee Value & User Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {formData.type === 'percentage' ? 'Fee Percentage *' : 'Fee Amount ($) *'}
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
              className="input-field pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">
              {formData.type === 'percentage' ? '%' : '$'}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Applies To *</label>
          <select
            value={formData.appliesTo}
            onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value as FeeRule['appliesTo'] })}
            className="input-field"
          >
            {USER_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Amount Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Min Transaction Amount</label>
          <div className="relative">
            <input
              type="number"
              value={formData.minAmount}
              onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) })}
              className="input-field pr-12"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">$</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">Leave 0 for no minimum</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Max Transaction Amount</label>
          <div className="relative">
            <input
              type="number"
              value={formData.maxAmount}
              onChange={(e) => setFormData({ ...formData, maxAmount: parseFloat(e.target.value) })}
              className="input-field pr-12"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">$</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">Leave 0 for no maximum</p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input-field h-24 resize-none"
          placeholder="Describe when this fee applies..."
        />
      </div>

      {/* Summary */}
      <div className="bg-background-tertiary rounded-xl p-4">
        <h3 className="text-text-primary font-medium mb-3">Fee Summary</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="px-3 py-1 bg-background-secondary rounded-lg">
            <span className="text-text-secondary">Category:</span>{' '}
            <span className="text-text-primary font-medium capitalize">{formData.category}</span>
          </div>
          <div className="px-3 py-1 bg-background-secondary rounded-lg">
            <span className="text-text-secondary">Fee:</span>{' '}
            <span className="text-status-success font-medium">
              {formData.type === 'percentage' ? `${formData.value}%` : `$${formData.value}`}
            </span>
          </div>
          <div className="px-3 py-1 bg-background-secondary rounded-lg">
            <span className="text-text-secondary">Users:</span>{' '}
            <span className="text-text-primary font-medium capitalize">{formData.appliesTo}</span>
          </div>
        </div>
      </div>
    </FormPageLayout>
  );
};

export default FeeRuleFormPage;
