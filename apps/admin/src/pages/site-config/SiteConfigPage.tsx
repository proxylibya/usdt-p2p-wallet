import { useState, useEffect } from 'react';
import { 
  Save, Globe, Image, Palette, CreditCard, Coins, 
  MessageSquare, Link2, Loader2, Plus, Trash2, 
  Edit2, Eye, EyeOff, Smartphone, Mail, Phone, 
  ExternalLink, Layout
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';

interface SiteConfig {
  id: string;
  appName: string;
  appTagline: string;
  appTaglineAr: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  heroTitle: string;
  heroTitleAr: string;
  heroSubtitle: string;
  heroSubtitleAr: string;
  heroImageUrl: string | null;
  features: any[];
  currencies: string[];
  socialLinks: Record<string, string>;
  supportEmail: string;
  supportPhone: string | null;
  telegramUrl: string | null;
  whatsappUrl: string | null;
  androidAppUrl: string | null;
  iosAppUrl: string | null;
  footerText: string;
  footerTextAr: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string | null;
}

interface PaymentMethod {
  id: string;
  key: string;
  label: string;
  labelAr: string | null;
  iconUrl: string | null;
  scope: string;
  countryCode: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface Currency {
  id: string;
  symbol: string;
  name: string;
  nameAr: string | null;
  iconUrl: string | null;
  networks: string[];
  isActive: boolean;
  sortOrder: number;
}

interface Banner {
  id: string;
  title: string;
  titleAr: string | null;
  subtitle: string | null;
  subtitleAr: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkType: string;
  position: string;
  isActive: boolean;
  sortOrder: number;
}

type TabType = 'branding' | 'hero' | 'payments' | 'currencies' | 'banners' | 'contact' | 'seo';

const COUNTRIES = [
  { code: 'LY', name: 'Libya' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'AE', name: 'UAE' },
  { code: 'GLOBAL', name: 'Global' },
];

const SiteConfigPage: React.FC = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('branding');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Data states
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [configRes, paymentsRes, currenciesRes, bannersRes] = await Promise.all([
        apiClient.get<SiteConfig>('/admin/site-config'),
        apiClient.get<{ methods: PaymentMethod[] }>('/admin/config/payment-methods'),
        apiClient.get<{ currencies: Currency[] }>('/admin/currencies'),
        apiClient.get<{ banners: Banner[] }>('/admin/banners'),
      ]);

      if (configRes.success && configRes.data) setConfig(configRes.data);
      if (paymentsRes.success && paymentsRes.data) setPaymentMethods(paymentsRes.data.methods || []);
      if (currenciesRes.success && currenciesRes.data) setCurrencies(currenciesRes.data.currencies || []);
      if (bannersRes.success && bannersRes.data) setBanners(bannersRes.data.banners || []);
    } catch {
      error('Error', 'Failed to load site configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const response = await apiClient.put('/admin/site-config', config);
      if (response.success) {
        success('Success', 'Site configuration saved successfully');
      } else {
        error('Error', 'Failed to save configuration');
      }
    } catch {
      error('Error', 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePaymentMethod = async (data: Partial<PaymentMethod>) => {
    try {
      if (editingItem?.id) {
        await apiClient.put(`/admin/config/payment-methods/${editingItem.id}`, data);
        success('Success', 'Payment method updated');
      } else {
        await apiClient.post('/admin/config/payment-methods', data);
        success('Success', 'Payment method created');
      }
      fetchAllData();
      setShowPaymentModal(false);
      setEditingItem(null);
    } catch {
      error('Error', 'Failed to save payment method');
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    try {
      await apiClient.delete(`/admin/config/payment-methods/${id}`);
      success('Success', 'Payment method deleted');
      fetchAllData();
    } catch {
      error('Error', 'Failed to delete payment method');
    }
  };

  const handleTogglePaymentStatus = async (id: string, isActive: boolean) => {
    try {
      await apiClient.patch(`/admin/config/payment-methods/${id}/status`, { isActive });
      fetchAllData();
    } catch {
      error('Error', 'Failed to update status');
    }
  };

  const handleSaveCurrency = async (data: Partial<Currency>) => {
    try {
      if (editingItem?.id) {
        await apiClient.put(`/admin/currencies/${editingItem.id}`, data);
        success('Success', 'Currency updated');
      } else {
        await apiClient.post('/admin/currencies', data);
        success('Success', 'Currency created');
      }
      fetchAllData();
      setShowCurrencyModal(false);
      setEditingItem(null);
    } catch {
      error('Error', 'Failed to save currency');
    }
  };

  const handleDeleteCurrency = async (id: string) => {
    if (!confirm('Are you sure you want to delete this currency?')) return;
    try {
      await apiClient.delete(`/admin/currencies/${id}`);
      success('Success', 'Currency deleted');
      fetchAllData();
    } catch {
      error('Error', 'Failed to delete currency');
    }
  };

  const handleSaveBanner = async (data: Partial<Banner>) => {
    try {
      if (editingItem?.id) {
        await apiClient.put(`/admin/banners/${editingItem.id}`, data);
        success('Success', 'Banner updated');
      } else {
        await apiClient.post('/admin/banners', data);
        success('Success', 'Banner created');
      }
      fetchAllData();
      setShowBannerModal(false);
      setEditingItem(null);
    } catch {
      error('Error', 'Failed to save banner');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await apiClient.delete(`/admin/banners/${id}`);
      success('Success', 'Banner deleted');
      fetchAllData();
    } catch {
      error('Error', 'Failed to delete banner');
    }
  };

  const handleToggleBannerStatus = async (id: string, isActive: boolean) => {
    try {
      await apiClient.patch(`/admin/banners/${id}/status`, { isActive });
      fetchAllData();
    } catch {
      error('Error', 'Failed to update status');
    }
  };

  const tabs = [
    { id: 'branding' as TabType, label: 'Branding', icon: <Palette className="w-4 h-4" /> },
    { id: 'hero' as TabType, label: 'Hero Section', icon: <Layout className="w-4 h-4" /> },
    { id: 'payments' as TabType, label: 'Payment Methods', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'currencies' as TabType, label: 'Currencies', icon: <Coins className="w-4 h-4" /> },
    { id: 'banners' as TabType, label: 'Banners', icon: <Image className="w-4 h-4" /> },
    { id: 'contact' as TabType, label: 'Contact & Links', icon: <Link2 className="w-4 h-4" /> },
    { id: 'seo' as TabType, label: 'SEO', icon: <Globe className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Site Configuration</h1>
          <p className="text-text-secondary mt-1">Manage your mobile app appearance and content</p>
        </div>
        <button
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="btn-primary flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-divider overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-brand-yellow border-brand-yellow'
                : 'text-text-secondary hover:text-text-primary border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
        {/* Branding Tab */}
        {activeTab === 'branding' && config && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-bold text-text-primary mb-4">App Branding</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">App Name</label>
                <input
                  type="text"
                  value={config.appName}
                  onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                  className="input-field"
                  placeholder="UbinPay"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="input-field flex-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Tagline (English)</label>
              <input
                type="text"
                value={config.appTagline}
                onChange={(e) => setConfig({ ...config, appTagline: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Tagline (Arabic)</label>
              <input
                type="text"
                value={config.appTaglineAr}
                onChange={(e) => setConfig({ ...config, appTaglineAr: e.target.value })}
                className="input-field text-right"
                dir="rtl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Logo URL</label>
                <input
                  type="text"
                  value={config.logoUrl || ''}
                  onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Secondary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.secondaryColor}
                    onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                    className="input-field flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section Tab */}
        {activeTab === 'hero' && config && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-bold text-text-primary mb-4">Hero Section</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Hero Title (English)</label>
                <input
                  type="text"
                  value={config.heroTitle}
                  onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Hero Title (Arabic)</label>
                <input
                  type="text"
                  value={config.heroTitleAr}
                  onChange={(e) => setConfig({ ...config, heroTitleAr: e.target.value })}
                  className="input-field text-right"
                  dir="rtl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Subtitle (English)</label>
              <textarea
                value={config.heroSubtitle}
                onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                className="input-field min-h-[80px]"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Subtitle (Arabic)</label>
              <textarea
                value={config.heroSubtitleAr}
                onChange={(e) => setConfig({ ...config, heroSubtitleAr: e.target.value })}
                className="input-field min-h-[80px] text-right"
                dir="rtl"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Hero Image URL</label>
              <input
                type="text"
                value={config.heroImageUrl || ''}
                onChange={(e) => setConfig({ ...config, heroImageUrl: e.target.value })}
                className="input-field"
                placeholder="https://..."
              />
            </div>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">Payment Methods</h2>
              <button
                onClick={() => { setEditingItem(null); setShowPaymentModal(true); }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Payment Method
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-divider">
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Key</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Label</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Arabic</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Country</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Scope</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Status</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethods.map((method) => (
                    <tr key={method.id} className="border-b border-border-divider/50 hover:bg-background-tertiary/50">
                      <td className="py-3 px-4 font-mono text-sm">{method.key}</td>
                      <td className="py-3 px-4">{method.label}</td>
                      <td className="py-3 px-4 text-right" dir="rtl">{method.labelAr || '-'}</td>
                      <td className="py-3 px-4">{method.countryCode || 'Global'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${method.scope === 'global' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                          {method.scope}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleTogglePaymentStatus(method.id, !method.isActive)}
                          className={`px-2 py-1 rounded text-xs ${method.isActive ? 'bg-status-success/20 text-status-success' : 'bg-status-error/20 text-status-error'}`}
                        >
                          {method.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingItem(method); setShowPaymentModal(true); }}
                            className="p-2 hover:bg-background-tertiary rounded"
                          >
                            <Edit2 className="w-4 h-4 text-text-secondary" />
                          </button>
                          <button
                            onClick={() => handleDeletePaymentMethod(method.id)}
                            className="p-2 hover:bg-status-error/20 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-status-error" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paymentMethods.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-text-secondary">
                        No payment methods configured. Click "Add Payment Method" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Currencies Tab */}
        {activeTab === 'currencies' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">Supported Currencies</h2>
              <button
                onClick={() => { setEditingItem(null); setShowCurrencyModal(true); }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Currency
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currencies.map((currency) => (
                <div key={currency.id} className="bg-background-tertiary p-4 rounded-xl border border-border-divider">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                        <span className="text-brand-yellow font-bold">{currency.symbol.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary">{currency.symbol}</h3>
                        <p className="text-sm text-text-secondary">{currency.name}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${currency.isActive ? 'bg-status-success/20 text-status-success' : 'bg-status-error/20 text-status-error'}`}>
                      {currency.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(currency.networks as string[]).map((network) => (
                      <span key={network} className="px-2 py-0.5 bg-background-secondary rounded text-xs text-text-secondary">
                        {network}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setEditingItem(currency); setShowCurrencyModal(true); }}
                      className="p-2 hover:bg-background-secondary rounded"
                    >
                      <Edit2 className="w-4 h-4 text-text-secondary" />
                    </button>
                    <button
                      onClick={() => handleDeleteCurrency(currency.id)}
                      className="p-2 hover:bg-status-error/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-status-error" />
                    </button>
                  </div>
                </div>
              ))}
              {currencies.length === 0 && (
                <div className="col-span-full py-8 text-center text-text-secondary">
                  No currencies configured. Click "Add Currency" to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Banners Tab */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">Promotional Banners</h2>
              <button
                onClick={() => { setEditingItem(null); setShowBannerModal(true); }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Banner
              </button>
            </div>

            <div className="space-y-4">
              {banners.map((banner) => (
                <div key={banner.id} className="bg-background-tertiary p-4 rounded-xl border border-border-divider flex items-center gap-4">
                  {banner.imageUrl && (
                    <img src={banner.imageUrl} alt={banner.title} className="w-24 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-text-primary">{banner.title}</h3>
                    {banner.subtitle && <p className="text-sm text-text-secondary">{banner.subtitle}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-background-secondary rounded text-xs text-text-secondary">
                        {banner.position}
                      </span>
                      {banner.linkUrl && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Link
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleBannerStatus(banner.id, !banner.isActive)}
                      className={`p-2 rounded ${banner.isActive ? 'bg-status-success/20 text-status-success' : 'bg-background-secondary text-text-secondary'}`}
                    >
                      {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { setEditingItem(banner); setShowBannerModal(true); }}
                      className="p-2 hover:bg-background-secondary rounded"
                    >
                      <Edit2 className="w-4 h-4 text-text-secondary" />
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-2 hover:bg-status-error/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-status-error" />
                    </button>
                  </div>
                </div>
              ))}
              {banners.length === 0 && (
                <div className="py-8 text-center text-text-secondary">
                  No banners configured. Click "Add Banner" to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact & Links Tab */}
        {activeTab === 'contact' && config && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-bold text-text-primary mb-4">Contact Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />Support Email
                </label>
                <input
                  type="email"
                  value={config.supportEmail}
                  onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />Support Phone
                </label>
                <input
                  type="text"
                  value={config.supportPhone || ''}
                  onChange={(e) => setConfig({ ...config, supportPhone: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />Telegram URL
                </label>
                <input
                  type="text"
                  value={config.telegramUrl || ''}
                  onChange={(e) => setConfig({ ...config, telegramUrl: e.target.value })}
                  className="input-field"
                  placeholder="https://t.me/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />WhatsApp URL
                </label>
                <input
                  type="text"
                  value={config.whatsappUrl || ''}
                  onChange={(e) => setConfig({ ...config, whatsappUrl: e.target.value })}
                  className="input-field"
                  placeholder="https://wa.me/..."
                />
              </div>
            </div>

            <h3 className="text-lg font-bold text-text-primary mt-8 mb-4">App Store Links</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <Smartphone className="w-4 h-4 inline mr-2" />Android App URL
                </label>
                <input
                  type="text"
                  value={config.androidAppUrl || ''}
                  onChange={(e) => setConfig({ ...config, androidAppUrl: e.target.value })}
                  className="input-field"
                  placeholder="https://play.google.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <Smartphone className="w-4 h-4 inline mr-2" />iOS App URL
                </label>
                <input
                  type="text"
                  value={config.iosAppUrl || ''}
                  onChange={(e) => setConfig({ ...config, iosAppUrl: e.target.value })}
                  className="input-field"
                  placeholder="https://apps.apple.com/..."
                />
              </div>
            </div>

            <h3 className="text-lg font-bold text-text-primary mt-8 mb-4">Footer</h3>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Footer Text (English)</label>
              <input
                type="text"
                value={config.footerText}
                onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Footer Text (Arabic)</label>
              <input
                type="text"
                value={config.footerTextAr}
                onChange={(e) => setConfig({ ...config, footerTextAr: e.target.value })}
                className="input-field text-right"
                dir="rtl"
              />
            </div>
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && config && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-bold text-text-primary mb-4">SEO Settings</h2>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Meta Title</label>
              <input
                type="text"
                value={config.metaTitle}
                onChange={(e) => setConfig({ ...config, metaTitle: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Meta Description</label>
              <textarea
                value={config.metaDescription}
                onChange={(e) => setConfig({ ...config, metaDescription: e.target.value })}
                className="input-field min-h-[100px]"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Meta Keywords</label>
              <input
                type="text"
                value={config.metaKeywords || ''}
                onChange={(e) => setConfig({ ...config, metaKeywords: e.target.value })}
                className="input-field"
                placeholder="usdt, p2p, crypto, libya..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <PaymentMethodModal
          item={editingItem}
          onSave={handleSavePaymentMethod}
          onClose={() => { setShowPaymentModal(false); setEditingItem(null); }}
        />
      )}

      {/* Currency Modal */}
      {showCurrencyModal && (
        <CurrencyModal
          item={editingItem}
          onSave={handleSaveCurrency}
          onClose={() => { setShowCurrencyModal(false); setEditingItem(null); }}
        />
      )}

      {/* Banner Modal */}
      {showBannerModal && (
        <BannerModal
          item={editingItem}
          onSave={handleSaveBanner}
          onClose={() => { setShowBannerModal(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
};

// Payment Method Modal Component
const PaymentMethodModal: React.FC<{
  item: PaymentMethod | null;
  onSave: (data: Partial<PaymentMethod>) => void;
  onClose: () => void;
}> = ({ item, onSave, onClose }) => {
  const [form, setForm] = useState({
    key: item?.key || '',
    label: item?.label || '',
    labelAr: item?.labelAr || '',
    iconUrl: item?.iconUrl || '',
    scope: item?.scope || 'local',
    countryCode: item?.countryCode || '',
    sortOrder: item?.sortOrder || 0,
    isActive: item?.isActive ?? true,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-secondary p-6 rounded-xl border border-border-divider w-full max-w-lg">
        <h2 className="text-xl font-bold text-text-primary mb-4">
          {item ? 'Edit Payment Method' : 'Add Payment Method'}
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Key (unique)</label>
              <input
                type="text"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                className="input-field"
                placeholder="sadad"
                disabled={!!item}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Scope</label>
              <select
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value })}
                className="input-field"
              >
                <option value="local">Local</option>
                <option value="global">Global</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Label (English)</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Label (Arabic)</label>
              <input
                type="text"
                value={form.labelAr}
                onChange={(e) => setForm({ ...form, labelAr: e.target.value })}
                className="input-field text-right"
                dir="rtl"
              />
            </div>
          </div>

          {form.scope === 'local' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Country</label>
              <select
                value={form.countryCode}
                onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                className="input-field"
              >
                <option value="">Select Country</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Icon URL</label>
            <input
              type="text"
              value={form.iconUrl}
              onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
              className="input-field"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="input-field"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-text-primary">Active</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(form)} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
};

// Currency Modal Component
const CurrencyModal: React.FC<{
  item: Currency | null;
  onSave: (data: Partial<Currency>) => void;
  onClose: () => void;
}> = ({ item, onSave, onClose }) => {
  const [form, setForm] = useState({
    symbol: item?.symbol || '',
    name: item?.name || '',
    nameAr: item?.nameAr || '',
    iconUrl: item?.iconUrl || '',
    networks: (item?.networks as string[])?.join(', ') || '',
    sortOrder: item?.sortOrder || 0,
    isActive: item?.isActive ?? true,
  });

  const handleSave = () => {
    onSave({
      ...form,
      networks: form.networks.split(',').map(n => n.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-secondary p-6 rounded-xl border border-border-divider w-full max-w-lg">
        <h2 className="text-xl font-bold text-text-primary mb-4">
          {item ? 'Edit Currency' : 'Add Currency'}
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Symbol</label>
              <input
                type="text"
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                className="input-field"
                placeholder="USDT"
                disabled={!!item}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Name (English)</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                placeholder="Tether"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Name (Arabic)</label>
              <input
                type="text"
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                className="input-field text-right"
                dir="rtl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Networks (comma separated)</label>
            <input
              type="text"
              value={form.networks}
              onChange={(e) => setForm({ ...form, networks: e.target.value })}
              className="input-field"
              placeholder="TRC20, ERC20, BEP20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Icon URL</label>
            <input
              type="text"
              value={form.iconUrl}
              onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
              className="input-field"
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-text-primary">Active</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
};

// Banner Modal Component
const BannerModal: React.FC<{
  item: Banner | null;
  onSave: (data: Partial<Banner>) => void;
  onClose: () => void;
}> = ({ item, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: item?.title || '',
    titleAr: item?.titleAr || '',
    subtitle: item?.subtitle || '',
    subtitleAr: item?.subtitleAr || '',
    imageUrl: item?.imageUrl || '',
    linkUrl: item?.linkUrl || '',
    linkType: item?.linkType || 'internal',
    position: item?.position || 'home_top',
    sortOrder: item?.sortOrder || 0,
    isActive: item?.isActive ?? true,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-secondary p-6 rounded-xl border border-border-divider w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-text-primary mb-4">
          {item ? 'Edit Banner' : 'Add Banner'}
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Title (English)</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Title (Arabic)</label>
              <input
                type="text"
                value={form.titleAr}
                onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                className="input-field text-right"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Subtitle (English)</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Subtitle (Arabic)</label>
              <input
                type="text"
                value={form.subtitleAr}
                onChange={(e) => setForm({ ...form, subtitleAr: e.target.value })}
                className="input-field text-right"
                dir="rtl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Image URL</label>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="input-field"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Link URL</label>
              <input
                type="text"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Link Type</label>
              <select
                value={form.linkType}
                onChange={(e) => setForm({ ...form, linkType: e.target.value })}
                className="input-field"
              >
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Position</label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="input-field"
              >
                <option value="home_top">Home - Top</option>
                <option value="home_middle">Home - Middle</option>
                <option value="wallet">Wallet Page</option>
                <option value="p2p">P2P Page</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-text-primary">Active</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(form)} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
};

export default SiteConfigPage;
