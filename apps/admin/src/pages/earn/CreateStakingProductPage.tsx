import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import FormPageLayout from '../../components/ui/FormPageLayout';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

const ASSETS = [
  { value: 'USDT', label: 'USDT', icon: '💵' },
  { value: 'USDC', label: 'USDC', icon: '💲' },
  { value: 'BTC', label: 'Bitcoin', icon: '₿' },
  { value: 'ETH', label: 'Ethereum', icon: 'Ξ' },
  { value: 'BNB', label: 'BNB', icon: '🔶' },
];

const DURATION_PRESETS = [
  { value: 0, label: 'Flexible', description: 'Withdraw anytime' },
  { value: 7, label: '7 Days', description: 'Weekly lock' },
  { value: 30, label: '30 Days', description: 'Monthly lock' },
  { value: 60, label: '60 Days', description: '2 months lock' },
  { value: 90, label: '90 Days', description: '3 months lock' },
  { value: 180, label: '180 Days', description: '6 months lock' },
  { value: 365, label: '365 Days', description: '1 year lock' },
];

const CreateStakingProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    asset: 'USDT',
    apy: 5.0,
    durationDays: 0,
    minAmount: 1,
    maxAmount: 10000,
  });

  const handleSubmit = async () => {
    if (formData.apy <= 0) {
      error('Validation Error', 'APY must be greater than 0');
      return;
    }

    if (formData.minAmount <= 0 || formData.maxAmount <= 0) {
      error('Validation Error', 'Amount limits must be greater than 0');
      return;
    }

    if (formData.minAmount >= formData.maxAmount) {
      error('Validation Error', 'Max amount must be greater than min amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/admin/earn/products', formData);
      
      if (response.success) {
        success('Success', 'Staking product created successfully');
        navigate('/earn/products');
      } else {
        error('Error', response.error || 'Failed to create product');
      }
    } catch {
      error('Error', 'Failed to create product');
    }
    setIsSubmitting(false);
  };

  return (
    <FormPageLayout
      title="Create Staking Product"
      subtitle="Add a new earn product for users"
      backPath="/earn/products"
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitLabel="Create Product"
      icon={<TrendingUp className="w-6 h-6 text-brand-yellow" />}
    >
      {/* Asset Selection */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Asset *</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ASSETS.map((asset) => (
            <label
              key={asset.value}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-colors ${
                formData.asset === asset.value
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-border-divider bg-background-tertiary hover:border-brand-yellow/50'
              }`}
            >
              <input
                type="radio"
                name="asset"
                value={asset.value}
                checked={formData.asset === asset.value}
                onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                className="sr-only"
              />
              <span className="text-2xl">{asset.icon}</span>
              <span className="text-text-primary font-medium">{asset.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* APY */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Annual Percentage Yield (APY) *</label>
        <div className="relative">
          <input
            type="number"
            step="0.1"
            value={formData.apy}
            onChange={(e) => setFormData({ ...formData, apy: parseFloat(e.target.value) })}
            className="input-field pr-12"
            placeholder="5.0"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">%</span>
        </div>
        <p className="text-xs text-text-secondary mt-2">Yearly return rate for users</p>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Lock Duration *</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DURATION_PRESETS.map((preset) => (
            <label
              key={preset.value}
              className={`flex flex-col items-center gap-1 p-4 rounded-xl border cursor-pointer transition-colors ${
                formData.durationDays === preset.value
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-border-divider bg-background-tertiary hover:border-brand-yellow/50'
              }`}
            >
              <input
                type="radio"
                name="duration"
                value={preset.value}
                checked={formData.durationDays === preset.value}
                onChange={() => setFormData({ ...formData, durationDays: preset.value })}
                className="sr-only"
              />
              <span className="text-text-primary font-medium">{preset.label}</span>
              <span className="text-text-secondary text-xs">{preset.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Amount Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Minimum Amount *</label>
          <div className="relative">
            <input
              type="number"
              value={formData.minAmount}
              onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) })}
              className="input-field pr-16"
              placeholder="1"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">{formData.asset}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Maximum Amount *</label>
          <div className="relative">
            <input
              type="number"
              value={formData.maxAmount}
              onChange={(e) => setFormData({ ...formData, maxAmount: parseFloat(e.target.value) })}
              className="input-field pr-16"
              placeholder="10000"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">{formData.asset}</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-background-tertiary rounded-xl p-4">
        <h3 className="text-text-primary font-medium mb-3">Product Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-text-secondary">Asset</p>
            <p className="text-text-primary font-medium">{formData.asset}</p>
          </div>
          <div>
            <p className="text-text-secondary">APY</p>
            <p className="text-status-success font-medium">{formData.apy}%</p>
          </div>
          <div>
            <p className="text-text-secondary">Duration</p>
            <p className="text-text-primary font-medium">{formData.durationDays === 0 ? 'Flexible' : `${formData.durationDays} Days`}</p>
          </div>
          <div>
            <p className="text-text-secondary">Limits</p>
            <p className="text-text-primary font-medium">{formData.minAmount} - {formData.maxAmount}</p>
          </div>
        </div>
      </div>
    </FormPageLayout>
  );
};

export default CreateStakingProductPage;
