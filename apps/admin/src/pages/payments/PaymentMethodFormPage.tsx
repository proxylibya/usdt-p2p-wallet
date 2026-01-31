import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import FormPageLayout from '../../components/ui/FormPageLayout';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface PaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  type: 'bank' | 'ewallet' | 'cash';
  requiresDetails: string[];
  countries: string[];
  processingTime: string;
}

const PAYMENT_TYPES = [
  { value: 'bank', label: 'Bank Transfer', icon: '🏦', description: 'Traditional bank transfers' },
  { value: 'ewallet', label: 'E-Wallet', icon: '📱', description: 'Mobile wallets and digital payments' },
  { value: 'cash', label: 'Cash', icon: '💵', description: 'Cash transactions in person' },
];

const AVAILABLE_FIELDS = [
  { value: 'bankName', label: 'Bank Name' },
  { value: 'accountNumber', label: 'Account Number' },
  { value: 'accountName', label: 'Account Holder Name' },
  { value: 'iban', label: 'IBAN' },
  { value: 'swiftCode', label: 'SWIFT/BIC Code' },
  { value: 'phoneNumber', label: 'Phone Number' },
  { value: 'email', label: 'Email Address' },
  { value: 'location', label: 'Meeting Location' },
  { value: 'walletId', label: 'Wallet ID' },
];

const PROCESSING_TIMES = [
  { value: 'Instant', label: 'Instant' },
  { value: '1-15 minutes', label: '1-15 minutes' },
  { value: '1-2 hours', label: '1-2 hours' },
  { value: '1-3 business days', label: '1-3 business days' },
];

const PaymentMethodFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    type: 'bank' as PaymentMethod['type'],
    requiresDetails: ['accountNumber', 'accountName'] as string[],
    countries: ['LY'],
    processingTime: 'Instant',
  });

  useEffect(() => {
    if (isEditing) {
      fetchMethod();
    }
  }, [id]);

  const fetchMethod = async () => {
    try {
      const response = await apiClient.get<PaymentMethod>(`/admin/payment-methods/${id}`);
      if (response.success && response.data) {
        const data = response.data;
        setFormData({
          name: data.name,
          nameAr: data.nameAr,
          type: data.type,
          requiresDetails: data.requiresDetails,
          countries: data.countries,
          processingTime: data.processingTime,
        });
      }
    } catch {
      error('Error', 'Could not load payment method');
      navigate('/p2p/payment-methods');
    }
    setIsLoading(false);
  };

  const toggleField = (field: string) => {
    setFormData(prev => ({
      ...prev,
      requiresDetails: prev.requiresDetails.includes(field)
        ? prev.requiresDetails.filter(f => f !== field)
        : [...prev.requiresDetails, field],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      error('Validation Error', 'Method name is required');
      return;
    }

    if (formData.requiresDetails.length === 0) {
      error('Validation Error', 'At least one required field must be selected');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await apiClient.put(`/admin/payment-methods/${id}`, formData);
        success('Updated', 'Payment method updated successfully');
      } else {
        await apiClient.post('/admin/payment-methods', formData);
        success('Created', 'Payment method created successfully');
      }
      navigate('/p2p/payment-methods');
    } catch {
      error('Failed', 'Could not save payment method');
    }
    setIsSubmitting(false);
  };

  return (
    <FormPageLayout
      title={isEditing ? 'Edit Payment Method' : 'Add Payment Method'}
      subtitle={isEditing ? 'Update payment method details' : 'Add a new P2P payment method'}
      backPath="/p2p/payment-methods"
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? 'Update Method' : 'Add Method'}
      icon={<CreditCard className="w-6 h-6 text-brand-yellow" />}
    >
      {/* Names */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Name (English) *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
            placeholder="e.g., Bank Transfer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Name (Arabic)</label>
          <input
            type="text"
            value={formData.nameAr}
            onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
            className="input-field"
            dir="rtl"
            placeholder="مثال: تحويل بنكي"
          />
        </div>
      </div>

      {/* Payment Type */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Payment Type *</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PAYMENT_TYPES.map((type) => (
            <label
              key={type.value}
              className={`flex flex-col items-center gap-2 p-6 rounded-xl border cursor-pointer transition-colors ${
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
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PaymentMethod['type'] })}
                className="sr-only"
              />
              <span className="text-3xl">{type.icon}</span>
              <span className="text-text-primary font-medium">{type.label}</span>
              <span className="text-text-secondary text-xs text-center">{type.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Required Fields */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Required Fields *</label>
        <p className="text-text-secondary text-sm mb-4">Select the information users must provide when using this method</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AVAILABLE_FIELDS.map((field) => (
            <label
              key={field.value}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                formData.requiresDetails.includes(field.value)
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-border-divider bg-background-tertiary hover:border-brand-yellow/50'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.requiresDetails.includes(field.value)}
                onChange={() => toggleField(field.value)}
                className="w-5 h-5 accent-brand-yellow"
              />
              <span className="text-text-primary">{field.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Processing Time */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Processing Time *</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PROCESSING_TIMES.map((time) => (
            <label
              key={time.value}
              className={`flex items-center justify-center p-4 rounded-xl border cursor-pointer transition-colors ${
                formData.processingTime === time.value
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-border-divider bg-background-tertiary hover:border-brand-yellow/50'
              }`}
            >
              <input
                type="radio"
                name="processingTime"
                value={time.value}
                checked={formData.processingTime === time.value}
                onChange={(e) => setFormData({ ...formData, processingTime: e.target.value })}
                className="sr-only"
              />
              <span className="text-text-primary font-medium">{time.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-background-tertiary rounded-xl p-4">
        <h3 className="text-text-primary font-medium mb-3">Method Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-text-secondary">Type:</span>
            <span className="text-text-primary capitalize">{formData.type}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-text-secondary">Required fields:</span>
            <span className="text-text-primary">{formData.requiresDetails.length} field(s)</span>
          </div>
          <div className="flex gap-2">
            <span className="text-text-secondary">Processing:</span>
            <span className="text-text-primary">{formData.processingTime}</span>
          </div>
        </div>
      </div>
    </FormPageLayout>
  );
};

export default PaymentMethodFormPage;
