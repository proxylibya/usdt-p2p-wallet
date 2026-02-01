import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { CreateSmsProviderDto, SmsProvider } from '../../types/sms';

export default function SmsProviderFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSmsProviderDto>({
    name: '',
    type: 'generic_http',
    config: {},
    priority: 0,
    isActive: true,
    costPerMsg: 0,
    currency: 'USD',
  });

  // Config string for JSON editor
  const [configString, setConfigString] = useState('{\n  "url": "https://api.example.com/send",\n  "method": "POST",\n  "headers": {\n    "Authorization": "Bearer KEY"\n  },\n  "bodyTemplate": {\n    "to": "{{phone}}",\n    "text": "{{message}}"\n  }\n}');

  useEffect(() => {
    if (isEdit) {
      fetchProvider();
    }
  }, [id]);

  const fetchProvider = async () => {
    try {
      const response = await apiClient.get<SmsProvider>(`/sms/providers/${id}`);
      if (response.success && response.data) {
        const { name, type, config, priority, isActive, costPerMsg, currency } = response.data;
        setFormData({ name, type, config, priority, isActive, costPerMsg, currency });
        setConfigString(JSON.stringify(config, null, 2));
      } else {
        error('Error', response.error || 'Failed to fetch provider');
        navigate('/sms/providers');
      }
    } catch (err) {
      error('Error', 'Network error');
      navigate('/sms/providers');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate JSON
      let parsedConfig;
      try {
        parsedConfig = JSON.parse(configString);
      } catch (e) {
        error('Validation Error', 'Invalid JSON in Configuration');
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        config: parsedConfig,
        priority: Number(formData.priority),
        costPerMsg: Number(formData.costPerMsg),
      };

      const response = isEdit
        ? await apiClient.put(`/sms/providers/${id}`, payload)
        : await apiClient.post('/sms/providers', payload);

      if (response.success) {
        success('Success', `Provider ${isEdit ? 'updated' : 'created'} successfully`);
        navigate('/sms/providers');
      } else {
        error('Error', response.error || 'Operation failed');
      }
    } catch (err) {
      error('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/sms/providers')}
          className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isEdit ? 'Edit SMS Provider' : 'Create SMS Provider'}
          </h1>
          <p className="text-text-secondary">Configure SMS gateway integration</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="label">Provider Name</label>
            <input
              type="text"
              required
              className="input w-full"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Twilio, Infobip"
            />
          </div>

          <div className="space-y-2">
            <label className="label">Type</label>
            <select
              className="input w-full"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="generic_http">Generic HTTP</option>
              <option value="twilio">Twilio (Coming Soon)</option>
              <option value="infobip">Infobip (Coming Soon)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="label">Priority (Higher runs first)</label>
            <input
              type="number"
              required
              className="input w-full"
              value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <label className="label">Cost Per Message</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.0001"
                className="input flex-1"
                value={formData.costPerMsg}
                onChange={e => setFormData({ ...formData, costPerMsg: Number(e.target.value) })}
              />
              <input
                type="text"
                className="input w-24"
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                placeholder="USD"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-border-divider bg-background-primary text-brand-primary focus:ring-brand-primary"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <span className="text-text-primary">Active</span>
          </label>
        </div>

        <div className="space-y-2">
          <label className="label">Configuration (JSON)</label>
          <p className="text-xs text-text-secondary mb-2">
            For Generic HTTP, define url, method, headers, and bodyTemplate. 
            Use <code>{`{{phone}}`}</code> and <code>{`{{message}}`}</code> as placeholders.
          </p>
          <textarea
            className="input w-full h-64 font-mono text-sm"
            value={configString}
            onChange={e => setConfigString(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border-divider">
          <button
            type="button"
            onClick={() => navigate('/sms/providers')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Provider'}
          </button>
        </div>
      </form>
    </div>
  );
}
