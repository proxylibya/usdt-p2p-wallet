import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield } from 'lucide-react';
import FormPageLayout from '../../components/ui/FormPageLayout';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface LimitRule {
  id: string;
  name: string;
  category: 'withdrawal' | 'deposit' | 'p2p' | 'transfer' | 'daily' | 'monthly';
  userType: 'all' | 'unverified' | 'verified' | 'vip' | 'merchant';
  minAmount: number;
  maxAmount: number;
  dailyLimit: number;
  monthlyLimit: number;
  requiresApproval: boolean;
  approvalThreshold: number;
}

const LIMIT_CATEGORIES = [
  { value: 'withdrawal', label: 'Withdrawal', description: 'Withdrawal limits' },
  { value: 'deposit', label: 'Deposit', description: 'Deposit limits' },
  { value: 'p2p', label: 'P2P Trading', description: 'P2P transaction limits' },
  { value: 'transfer', label: 'Transfer', description: 'Internal transfer limits' },
  { value: 'daily', label: 'Daily Overall', description: 'Daily transaction limits' },
  { value: 'monthly', label: 'Monthly Overall', description: 'Monthly transaction limits' },
];

const USER_TYPES = [
  { value: 'all', label: 'All Users', description: 'Applies to everyone' },
  { value: 'unverified', label: 'Unverified', description: 'Users without KYC' },
  { value: 'verified', label: 'Verified', description: 'KYC verified users' },
  { value: 'vip', label: 'VIP', description: 'VIP tier users' },
  { value: 'merchant', label: 'Merchant', description: 'Registered merchants' },
];

const LimitRuleFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  const [formData, setFormData] = useState({
    name: '',
    category: 'withdrawal' as LimitRule['category'],
    userType: 'all' as LimitRule['userType'],
    minAmount: 10,
    maxAmount: 10000,
    dailyLimit: 50000,
    monthlyLimit: 500000,
    requiresApproval: false,
    approvalThreshold: 10000,
  });

  useEffect(() => {
    if (isEditing) {
      fetchRule();
    }
  }, [id]);

  const fetchRule = async () => {
    try {
      const response = await apiClient.get<LimitRule>(`/admin/limits/rules/${id}`);
      if (response.success && response.data) {
        const data = response.data;
        setFormData({
          name: data.name,
          category: data.category,
          userType: data.userType,
          minAmount: data.minAmount,
          maxAmount: data.maxAmount,
          dailyLimit: data.dailyLimit,
          monthlyLimit: data.monthlyLimit,
          requiresApproval: data.requiresApproval,
          approvalThreshold: data.approvalThreshold,
        });
      }
    } catch {
      error('Error', 'Could not load limit rule');
      navigate('/limits');
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      error('Validation Error', 'Rule name is required');
      return;
    }

    if (formData.minAmount >= formData.maxAmount) {
      error('Validation Error', 'Max amount must be greater than min amount');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await apiClient.put(`/admin/limits/rules/${id}`, formData);
        success('Updated', 'Limit rule updated successfully');
      } else {
        await apiClient.post('/admin/limits/rules', formData);
        success('Created', 'Limit rule created successfully');
      }
      navigate('/limits');
    } catch {
      error('Failed', 'Could not save limit rule');
    }
    setIsSubmitting(false);
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  return (
    <FormPageLayout
      title={isEditing ? 'Edit Limit Rule' : 'Create Limit Rule'}
      subtitle={isEditing ? 'Update limit rule settings' : 'Configure transaction limits'}
      backPath="/limits"
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? 'Update Rule' : 'Create Rule'}
      icon={<Shield className="w-6 h-6 text-brand-yellow" />}
    >
      {/* Rule Name */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Rule Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field"
          placeholder="e.g., Verified User Withdrawal Limit"
        />
      </div>

      {/* Category & User Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3">Category *</label>
          <div className="space-y-2">
            {LIMIT_CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
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
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as LimitRule['category'] })}
                  className="w-4 h-4 accent-brand-yellow"
                />
                <div>
                  <span className="text-text-primary font-medium">{cat.label}</span>
                  <span className="text-text-secondary text-xs ml-2">- {cat.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3">User Type *</label>
          <div className="space-y-2">
            {USER_TYPES.map((type) => (
              <label
                key={type.value}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  formData.userType === type.value
                    ? 'border-brand-yellow bg-brand-yellow/10'
                    : 'border-border-divider bg-background-tertiary hover:border-brand-yellow/50'
                }`}
              >
                <input
                  type="radio"
                  name="userType"
                  value={type.value}
                  checked={formData.userType === type.value}
                  onChange={(e) => setFormData({ ...formData, userType: e.target.value as LimitRule['userType'] })}
                  className="w-4 h-4 accent-brand-yellow"
                />
                <div>
                  <span className="text-text-primary font-medium">{type.label}</span>
                  <span className="text-text-secondary text-xs ml-2">- {type.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Limits */}
      <div>
        <h3 className="text-text-primary font-medium mb-4">Transaction Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Min Amount ($)</label>
            <input
              type="number"
              value={formData.minAmount}
              onChange={(e) => setFormData({ ...formData, minAmount: +e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Max Amount ($)</label>
            <input
              type="number"
              value={formData.maxAmount}
              onChange={(e) => setFormData({ ...formData, maxAmount: +e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Daily Limit ($)</label>
            <input
              type="number"
              value={formData.dailyLimit}
              onChange={(e) => setFormData({ ...formData, dailyLimit: +e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Monthly Limit ($)</label>
            <input
              type="number"
              value={formData.monthlyLimit}
              onChange={(e) => setFormData({ ...formData, monthlyLimit: +e.target.value })}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Approval Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-background-tertiary rounded-xl">
          <input
            type="checkbox"
            id="requiresApproval"
            checked={formData.requiresApproval}
            onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
            className="w-5 h-5 accent-brand-yellow"
          />
          <label htmlFor="requiresApproval" className="cursor-pointer">
            <span className="text-text-primary font-medium">Require Manual Approval</span>
            <p className="text-text-secondary text-sm">Transactions above threshold need admin approval</p>
          </label>
        </div>

        {formData.requiresApproval && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Approval Threshold ($)</label>
            <input
              type="number"
              value={formData.approvalThreshold}
              onChange={(e) => setFormData({ ...formData, approvalThreshold: +e.target.value })}
              className="input-field"
            />
            <p className="text-xs text-text-secondary mt-1">Transactions above this amount require approval</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-background-tertiary rounded-xl p-4">
        <h3 className="text-text-primary font-medium mb-3">Limit Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-text-secondary">Per Transaction</p>
            <p className="text-text-primary font-medium">{formatCurrency(formData.minAmount)} - {formatCurrency(formData.maxAmount)}</p>
          </div>
          <div>
            <p className="text-text-secondary">Daily</p>
            <p className="text-text-primary font-medium">{formatCurrency(formData.dailyLimit)}</p>
          </div>
          <div>
            <p className="text-text-secondary">Monthly</p>
            <p className="text-text-primary font-medium">{formatCurrency(formData.monthlyLimit)}</p>
          </div>
          <div>
            <p className="text-text-secondary">Approval</p>
            <p className="text-text-primary font-medium">
              {formData.requiresApproval ? `> ${formatCurrency(formData.approvalThreshold)}` : 'Not required'}
            </p>
          </div>
        </div>
      </div>
    </FormPageLayout>
  );
};

export default LimitRuleFormPage;
