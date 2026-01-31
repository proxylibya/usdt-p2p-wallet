import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, RefreshCw, Shield, Clock, Check, Copy } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface NewKeyData {
  key: string;
  secret: string;
}

interface ApiKeyFormData {
  name: string;
  permissions: string[];
  ipWhitelist: string;
  rateLimit: number;
  expiresIn: string;
}

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

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  ipWhitelist: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  createdBy: string;
}

const ApiKeysPage: React.FC = () => {
  const { success, error } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKey, setNewKey] = useState<NewKeyData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formData, setFormData] = useState<ApiKeyFormData>({
    name: '',
    permissions: [],
    ipWhitelist: '',
    rateLimit: 100,
    expiresIn: '90d',
  });

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ keys: ApiKey[] }>('/admin/api-keys');
      if (response.success && response.data) {
        setApiKeys(response.data.keys);
      }
    } catch {
      error('Error', 'Failed to fetch API keys');
      setApiKeys([]);
    }
    setIsLoading(false);
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
    try {
      await apiClient.delete(`/admin/api-keys/${id}`);
      success('Revoked', 'API key has been revoked');
      fetchApiKeys();
    } catch {
      error('Failed', 'Could not revoke API key');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await apiClient.patch(`/admin/api-keys/${id}/status`, { isActive: !isActive });
      success('Updated', `API key ${isActive ? 'disabled' : 'enabled'}`);
      fetchApiKeys();
    } catch {
      error('Failed', 'Could not update API key');
    }
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleCreate = async () => {
    try {
      const response = await apiClient.post<NewKeyData>('/admin/api-keys', {
        name: formData.name,
        permissions: formData.permissions,
        ipWhitelist: formData.ipWhitelist.split('\n').filter((ip: string) => ip.trim()),
        rateLimit: formData.rateLimit,
        expiresIn: formData.expiresIn,
      });
      if (response.success && response.data) {
        setNewKey(response.data);
        setShowCreateModal(false);
        setShowKeyModal(true);
        setFormData({ name: '', permissions: [], ipWhitelist: '', rateLimit: 100, expiresIn: '90d' });
        fetchApiKeys();
      }
    } catch {
      error('Failed', 'Could not create API key');
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><RefreshCw className="w-8 h-8 animate-spin text-brand-yellow" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">API Keys</h1>
          <p className="text-text-secondary mt-1">Manage API access keys for external integrations</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create API Key
        </button>
      </div>

      {/* Security Notice */}
      <div className="bg-status-warning/10 border border-status-warning/30 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-text-primary">Security Notice</p>
          <p className="text-sm text-text-secondary">API keys provide full access to your platform. Keep them secure and never share them publicly. Rotate keys periodically and revoke unused keys.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-yellow/20 rounded-xl">
              <Key className="w-6 h-6 text-brand-yellow" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Total Keys</p>
              <p className="text-2xl font-bold text-text-primary">{apiKeys.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-success/20 rounded-xl">
              <Check className="w-6 h-6 text-status-success" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Active</p>
              <p className="text-2xl font-bold text-text-primary">{apiKeys.filter(k => k.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-info/20 rounded-xl">
              <Clock className="w-6 h-6 text-status-info" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Used Today</p>
              <p className="text-2xl font-bold text-text-primary">{apiKeys.filter(k => k.lastUsedAt).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Keys Table */}
      <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Permissions</th>
              <th>Rate Limit</th>
              <th>Last Used</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.map((key) => (
              <tr key={key.id}>
                <td>
                  <div>
                    <p className="font-medium text-text-primary">{key.name}</p>
                    <p className="text-xs text-text-secondary">Created {key.createdAt}</p>
                  </div>
                </td>
                <td>
                  <code className="text-sm bg-background-tertiary px-2 py-1 rounded">{key.keyPrefix}...</code>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {key.permissions.slice(0, 2).map(p => (
                      <span key={p} className="badge badge-info text-xs">{p.split(':')[1]}</span>
                    ))}
                    {key.permissions.length > 2 && (
                      <span className="badge bg-background-tertiary text-text-secondary text-xs">+{key.permissions.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="text-text-secondary">{key.rateLimit}/min</td>
                <td className="text-text-secondary text-sm">
                  {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                </td>
                <td>
                  <button onClick={() => handleToggle(key.id, key.isActive)} className={`badge ${key.isActive ? 'badge-success' : 'badge-error'}`}>
                    {key.isActive ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td>
                  <button onClick={() => handleRevoke(key.id)} className="p-2 hover:bg-background-tertiary rounded-lg" title="Revoke Key">
                    <Trash2 className="w-4 h-4 text-status-error" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-backdrop-in">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-background-secondary rounded-xl border border-border-divider p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-modal-in">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Create API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Key Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="e.g., Production API" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Permissions</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label key={perm.key} className="flex items-start gap-3 p-2 hover:bg-background-tertiary rounded-lg cursor-pointer transition-colors">
                      <input type="checkbox" checked={formData.permissions.includes(perm.key)} onChange={() => togglePermission(perm.key)} className="w-4 h-4 mt-0.5" />
                      <div>
                        <p className="text-text-primary text-sm font-medium">{perm.label}</p>
                        <p className="text-text-secondary text-xs">{perm.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">IP Whitelist (optional)</label>
                <textarea value={formData.ipWhitelist} onChange={(e) => setFormData({...formData, ipWhitelist: e.target.value})} className="input-field h-20 resize-none font-mono text-sm" placeholder="192.168.1.0/24&#10;10.0.0.1" />
                <p className="text-xs text-text-secondary mt-1">One IP or CIDR per line. Leave empty for no restriction.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Rate Limit (req/min)</label>
                  <input type="number" value={formData.rateLimit} onChange={(e) => setFormData({...formData, rateLimit: +e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Expires In</label>
                  <select value={formData.expiresIn} onChange={(e) => setFormData({...formData, expiresIn: e.target.value})} className="input-field">
                    <option value="30d">30 Days</option>
                    <option value="90d">90 Days</option>
                    <option value="180d">180 Days</option>
                    <option value="365d">1 Year</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={handleCreate} disabled={!formData.name || formData.permissions.length === 0} className="flex-1 btn-primary disabled:opacity-50">Create Key</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Key Modal */}
      {showKeyModal && newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-backdrop-in">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-background-secondary rounded-xl border border-border-divider p-6 w-full max-w-lg mx-4 animate-modal-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-status-success/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                <Key className="w-8 h-8 text-status-success" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">API Key Created</h3>
              <p className="text-text-secondary text-sm mt-1">Save these credentials now. The secret will not be shown again.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">API Key</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background-tertiary px-3 py-2 rounded text-sm font-mono text-text-primary">{newKey.key}</code>
                  <button onClick={() => handleCopy(newKey.key, 'key')} className="p-2 hover:bg-background-tertiary rounded-lg transition-all duration-200 hover:scale-110">
                    {copiedField === 'key' ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4 text-text-secondary" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">API Secret</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background-tertiary px-3 py-2 rounded text-sm font-mono text-text-primary break-all">{newKey.secret}</code>
                  <button onClick={() => handleCopy(newKey.secret, 'secret')} className="p-2 hover:bg-background-tertiary rounded-lg transition-all duration-200 hover:scale-110">
                    {copiedField === 'secret' ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4 text-text-secondary" />}
                  </button>
                </div>
              </div>
              <div className="bg-status-warning/10 border border-status-warning/30 rounded-lg p-3 text-sm text-text-secondary">
                ⚠️ Store these credentials securely. The secret cannot be retrieved later.
              </div>
              <button onClick={() => { setShowKeyModal(false); setNewKey(null); }} className="w-full btn-primary mt-4">I've Saved These Credentials</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeysPage;
