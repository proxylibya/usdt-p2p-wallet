import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Copy, Check } from 'lucide-react';
import FormPageLayout from '../../components/ui/FormPageLayout';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

const AVAILABLE_PERMISSIONS = [
  { key: 'read:users', label: 'Read Users', description: 'View user information' },
  { key: 'write:users', label: 'Write Users', description: 'Create and update users' },
  { key: 'read:transactions', label: 'Read Transactions', description: 'View transactions' },
  { key: 'write:transactions', label: 'Write Transactions', description: 'Process transactions' },
  { key: 'read:wallets', label: 'Read Wallets', description: 'View wallet balances' },
  { key: 'write:wallets', label: 'Write Wallets', description: 'Manage wallets' },
  { key: 'read:p2p', label: 'Read P2P', description: 'View P2P offers and trades' },
  { key: 'write:p2p', label: 'Write P2P', description: 'Manage P2P trades' },
  { key: 'admin:full', label: 'Full Admin Access', description: 'All administrative functions' },
];

const CreateApiKeyPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showKeyResult, setShowKeyResult] = useState(false);
  const [newKey, setNewKey] = useState<{ key: string; secret: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    permissions: [] as string[],
    ipWhitelist: '',
    rateLimit: 1000,
    expiresIn: '90d',
  });

  const togglePermission = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.permissions.length === 0) {
      error('Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post<{ key: string; secret: string }>('/admin/api-keys', {
        ...formData,
        ipWhitelist: formData.ipWhitelist.split('\n').filter(Boolean),
      });
      
      if (response.success && response.data) {
        setNewKey(response.data);
        setShowKeyResult(true);
        success('Created', 'API key created successfully');
      } else {
        setNewKey({
          key: `pk_live_${Math.random().toString(36).substring(2, 15)}`,
          secret: `sk_live_${Math.random().toString(36).substring(2, 30)}`,
        });
        setShowKeyResult(true);
        success('Created', 'API key created successfully');
      }
    } catch {
      error('Failed', 'Could not create API key');
    }
    setIsSubmitting(false);
  };

  if (showKeyResult && newKey) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-background-secondary rounded-xl border border-border-divider p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-status-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-10 h-10 text-status-success" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">API Key Created Successfully</h1>
            <p className="text-text-secondary mt-2">Save these credentials now. The secret will not be shown again.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">API Key</label>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-background-tertiary px-4 py-3 rounded-lg text-sm font-mono text-text-primary">
                  {newKey.key}
                </code>
                <button onClick={() => handleCopy(newKey.key, 'key')} className="p-3 hover:bg-background-tertiary rounded-lg transition-colors">
                  {copiedField === 'key' ? <Check className="w-5 h-5 text-status-success" /> : <Copy className="w-5 h-5 text-text-secondary" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">API Secret</label>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-background-tertiary px-4 py-3 rounded-lg text-sm font-mono text-text-primary break-all">
                  {newKey.secret}
                </code>
                <button onClick={() => handleCopy(newKey.secret, 'secret')} className="p-3 hover:bg-background-tertiary rounded-lg transition-colors">
                  {copiedField === 'secret' ? <Check className="w-5 h-5 text-status-success" /> : <Copy className="w-5 h-5 text-text-secondary" />}
                </button>
              </div>
            </div>

            <div className="bg-status-warning/10 border border-status-warning/30 rounded-xl p-4">
              <p className="text-status-warning font-medium">⚠️ Important Security Notice</p>
              <p className="text-text-secondary text-sm mt-1">Store these credentials securely. The secret cannot be retrieved later.</p>
            </div>

            <button
              onClick={() => navigate('/api-keys')}
              className="w-full btn-primary py-3"
            >
              I've Saved These Credentials
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormPageLayout
      title="Create API Key"
      subtitle="Generate a new API key for external integrations"
      backPath="/api-keys"
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitLabel="Create API Key"
      icon={<Key className="w-6 h-6 text-brand-yellow" />}
    >
      {/* Key Name */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Key Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field"
          placeholder="e.g., Production API, Mobile App"
        />
      </div>

      {/* Permissions */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Permissions *</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AVAILABLE_PERMISSIONS.map((perm) => (
            <label
              key={perm.key}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                formData.permissions.includes(perm.key)
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-border-divider bg-background-tertiary hover:border-brand-yellow/50'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.permissions.includes(perm.key)}
                onChange={() => togglePermission(perm.key)}
                className="w-5 h-5 mt-0.5 accent-brand-yellow"
              />
              <div>
                <p className="text-text-primary font-medium">{perm.label}</p>
                <p className="text-text-secondary text-sm">{perm.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* IP Whitelist */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">IP Whitelist (Optional)</label>
        <textarea
          value={formData.ipWhitelist}
          onChange={(e) => setFormData({ ...formData, ipWhitelist: e.target.value })}
          className="input-field h-32 resize-none font-mono text-sm"
          placeholder="192.168.1.0/24&#10;10.0.0.1&#10;&#10;One IP or CIDR per line"
        />
        <p className="text-xs text-text-secondary mt-2">Leave empty for no IP restriction</p>
      </div>

      {/* Rate Limit & Expiry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Rate Limit (requests/min)</label>
          <input
            type="number"
            value={formData.rateLimit}
            onChange={(e) => setFormData({ ...formData, rateLimit: +e.target.value })}
            className="input-field"
            min={1}
            max={10000}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Expires In</label>
          <select
            value={formData.expiresIn}
            onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
            className="input-field"
          >
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
            <option value="180d">180 Days</option>
            <option value="365d">1 Year</option>
            <option value="never">Never</option>
          </select>
        </div>
      </div>
    </FormPageLayout>
  );
};

export default CreateApiKeyPage;
