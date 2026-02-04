import { useState, useEffect } from 'react';
import { 
  Settings, 
  Phone, 
  Mail, 
  Key, 
  Shield, 
  Lock,
  Smartphone,
  Globe,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';

interface AuthConfig {
  // Registration Methods
  enablePhoneRegistration: boolean;
  phoneRequired: boolean;
  phoneVerificationRequired: boolean;
  enableEmailRegistration: boolean;
  emailRequired: boolean;
  emailVerificationRequired: boolean;
  
  // Social Login
  enableGoogleLogin: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  googleAndroidClientId?: string;
  googleIosClientId?: string;
  enableAppleLogin: boolean;
  appleClientId?: string;
  appleTeamId?: string;
  appleKeyId?: string;
  applePrivateKey?: string;
  enableFacebookLogin: boolean;
  facebookAppId?: string;
  facebookAppSecret?: string;
  
  // Login Settings
  enableDirectLogin: boolean;
  enableOtpLogin: boolean;
  otpExpirationMinutes: number;
  otpLength: number;
  maxOtpAttempts: number;
  otpLockoutMinutes: number;
  
  // Password Policy
  minPasswordLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  
  // Session Settings
  accessTokenExpirationMins: number;
  refreshTokenExpirationDays: number;
  maxActiveSessions: number;
  
  // Security
  enableTwoFactor: boolean;
  enableBiometric: boolean;
  enableDeviceTracking: boolean;
  
  // Registration Fields
  requireName: boolean;
  requireAvatar: boolean;
  defaultCountryCode: string;
  defaultCurrency: string;
  defaultLanguage: string;
  
  // Terms & Privacy
  termsUrl?: string;
  termsUrlAr?: string;
  privacyUrl?: string;
  privacyUrlAr?: string;
  requireTermsAcceptance: boolean;
  
  // UI Customization
  loginScreenTitle: string;
  loginScreenTitleAr: string;
  registerScreenTitle: string;
  registerScreenTitleAr: string;
  loginBackgroundUrl?: string;
  registerBackgroundUrl?: string;
}

export default function AuthConfigPage() {
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('registration');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/auth-config');
      setConfig(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      setError('');
      await api.put('/admin/auth-config', config);
      setSuccess('Configuration saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: keyof AuthConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = [
    { id: 'registration', label: 'طرق التسجيل', labelEn: 'Registration Methods', icon: Phone },
    { id: 'social', label: 'التسجيل الاجتماعي', labelEn: 'Social Login', icon: Globe },
    { id: 'login', label: 'إعدادات الدخول', labelEn: 'Login Settings', icon: Key },
    { id: 'password', label: 'سياسة كلمة المرور', labelEn: 'Password Policy', icon: Lock },
    { id: 'security', label: 'الأمان', labelEn: 'Security', icon: Shield },
    { id: 'ui', label: 'واجهة المستخدم', labelEn: 'UI Settings', icon: Smartphone },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center text-red-500 py-8">
        Failed to load configuration
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-yellow-500" />
            إعدادات التسجيل والمصادقة
          </h1>
          <p className="text-gray-400 mt-1">Auth & Registration Configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === tab.id
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.labelEn}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-gray-800 rounded-xl p-6">
        {/* Registration Methods Tab */}
        {activeTab === 'registration' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">طرق التسجيل - Registration Methods</h2>
            
            {/* Phone Registration */}
            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium text-yellow-500 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                تسجيل برقم الهاتف - Phone Registration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ToggleSwitch
                  label="تفعيل التسجيل بالهاتف"
                  labelEn="Enable Phone Registration"
                  checked={config.enablePhoneRegistration}
                  onChange={(v) => updateConfig('enablePhoneRegistration', v)}
                />
                <ToggleSwitch
                  label="رقم الهاتف مطلوب"
                  labelEn="Phone Required"
                  checked={config.phoneRequired}
                  onChange={(v) => updateConfig('phoneRequired', v)}
                />
                <ToggleSwitch
                  label="التحقق من الهاتف (OTP)"
                  labelEn="Phone Verification (OTP)"
                  checked={config.phoneVerificationRequired}
                  onChange={(v) => updateConfig('phoneVerificationRequired', v)}
                />
              </div>
            </div>

            {/* Email Registration */}
            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium text-yellow-500 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                تسجيل بالبريد الإلكتروني - Email Registration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ToggleSwitch
                  label="تفعيل التسجيل بالإيميل"
                  labelEn="Enable Email Registration"
                  checked={config.enableEmailRegistration}
                  onChange={(v) => updateConfig('enableEmailRegistration', v)}
                />
                <ToggleSwitch
                  label="البريد الإلكتروني مطلوب"
                  labelEn="Email Required"
                  checked={config.emailRequired}
                  onChange={(v) => updateConfig('emailRequired', v)}
                />
                <ToggleSwitch
                  label="التحقق من البريد"
                  labelEn="Email Verification"
                  checked={config.emailVerificationRequired}
                  onChange={(v) => updateConfig('emailVerificationRequired', v)}
                />
              </div>
            </div>

            {/* Required Fields */}
            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium text-yellow-500">حقول التسجيل - Registration Fields</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ToggleSwitch
                  label="الاسم مطلوب"
                  labelEn="Name Required"
                  checked={config.requireName}
                  onChange={(v) => updateConfig('requireName', v)}
                />
                <ToggleSwitch
                  label="الصورة الشخصية مطلوبة"
                  labelEn="Avatar Required"
                  checked={config.requireAvatar}
                  onChange={(v) => updateConfig('requireAvatar', v)}
                />
                <ToggleSwitch
                  label="قبول الشروط مطلوب"
                  labelEn="Terms Acceptance Required"
                  checked={config.requireTermsAcceptance}
                  onChange={(v) => updateConfig('requireTermsAcceptance', v)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <TextInput
                  label="رمز الدولة الافتراضي"
                  labelEn="Default Country Code"
                  value={config.defaultCountryCode}
                  onChange={(v) => updateConfig('defaultCountryCode', v)}
                />
                <TextInput
                  label="العملة الافتراضية"
                  labelEn="Default Currency"
                  value={config.defaultCurrency}
                  onChange={(v) => updateConfig('defaultCurrency', v)}
                />
                <TextInput
                  label="اللغة الافتراضية"
                  labelEn="Default Language"
                  value={config.defaultLanguage}
                  onChange={(v) => updateConfig('defaultLanguage', v)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Social Login Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">التسجيل الاجتماعي - Social Login</h2>
            
            {/* Google */}
            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-red-400 flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google Login
                </h3>
                <ToggleSwitch
                  label=""
                  labelEn=""
                  checked={config.enableGoogleLogin}
                  onChange={(v) => updateConfig('enableGoogleLogin', v)}
                />
              </div>
              {config.enableGoogleLogin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SecretInput
                    label="Google Client ID (Web)"
                    value={config.googleClientId || ''}
                    onChange={(v) => updateConfig('googleClientId', v)}
                    show={showSecrets['googleClientId']}
                    onToggle={() => toggleSecret('googleClientId')}
                  />
                  <SecretInput
                    label="Google Client Secret"
                    value={config.googleClientSecret || ''}
                    onChange={(v) => updateConfig('googleClientSecret', v)}
                    show={showSecrets['googleClientSecret']}
                    onToggle={() => toggleSecret('googleClientSecret')}
                  />
                  <SecretInput
                    label="Google Android Client ID"
                    value={config.googleAndroidClientId || ''}
                    onChange={(v) => updateConfig('googleAndroidClientId', v)}
                    show={showSecrets['googleAndroidClientId']}
                    onToggle={() => toggleSecret('googleAndroidClientId')}
                  />
                  <SecretInput
                    label="Google iOS Client ID"
                    value={config.googleIosClientId || ''}
                    onChange={(v) => updateConfig('googleIosClientId', v)}
                    show={showSecrets['googleIosClientId']}
                    onToggle={() => toggleSecret('googleIosClientId')}
                  />
                </div>
              )}
            </div>

            {/* Apple */}
            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Apple Login
                </h3>
                <ToggleSwitch
                  label=""
                  labelEn=""
                  checked={config.enableAppleLogin}
                  onChange={(v) => updateConfig('enableAppleLogin', v)}
                />
              </div>
              {config.enableAppleLogin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SecretInput
                    label="Apple Client ID (Service ID)"
                    value={config.appleClientId || ''}
                    onChange={(v) => updateConfig('appleClientId', v)}
                    show={showSecrets['appleClientId']}
                    onToggle={() => toggleSecret('appleClientId')}
                  />
                  <SecretInput
                    label="Apple Team ID"
                    value={config.appleTeamId || ''}
                    onChange={(v) => updateConfig('appleTeamId', v)}
                    show={showSecrets['appleTeamId']}
                    onToggle={() => toggleSecret('appleTeamId')}
                  />
                  <SecretInput
                    label="Apple Key ID"
                    value={config.appleKeyId || ''}
                    onChange={(v) => updateConfig('appleKeyId', v)}
                    show={showSecrets['appleKeyId']}
                    onToggle={() => toggleSecret('appleKeyId')}
                  />
                  <SecretInput
                    label="Apple Private Key"
                    value={config.applePrivateKey || ''}
                    onChange={(v) => updateConfig('applePrivateKey', v)}
                    show={showSecrets['applePrivateKey']}
                    onToggle={() => toggleSecret('applePrivateKey')}
                    multiline
                  />
                </div>
              )}
            </div>

            {/* Facebook */}
            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-blue-400 flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook Login
                </h3>
                <ToggleSwitch
                  label=""
                  labelEn=""
                  checked={config.enableFacebookLogin}
                  onChange={(v) => updateConfig('enableFacebookLogin', v)}
                />
              </div>
              {config.enableFacebookLogin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SecretInput
                    label="Facebook App ID"
                    value={config.facebookAppId || ''}
                    onChange={(v) => updateConfig('facebookAppId', v)}
                    show={showSecrets['facebookAppId']}
                    onToggle={() => toggleSecret('facebookAppId')}
                  />
                  <SecretInput
                    label="Facebook App Secret"
                    value={config.facebookAppSecret || ''}
                    onChange={(v) => updateConfig('facebookAppSecret', v)}
                    show={showSecrets['facebookAppSecret']}
                    onToggle={() => toggleSecret('facebookAppSecret')}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login Settings Tab */}
        {activeTab === 'login' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">إعدادات تسجيل الدخول - Login Settings</h2>
            
            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium text-yellow-500">طريقة تسجيل الدخول - Login Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ToggleSwitch
                  label="تسجيل دخول مباشر (كلمة مرور فقط)"
                  labelEn="Direct Login (Password Only)"
                  checked={config.enableDirectLogin}
                  onChange={(v) => updateConfig('enableDirectLogin', v)}
                />
                <ToggleSwitch
                  label="تسجيل دخول بـ OTP"
                  labelEn="OTP Login"
                  checked={config.enableOtpLogin}
                  onChange={(v) => updateConfig('enableOtpLogin', v)}
                />
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium text-yellow-500">إعدادات OTP</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <NumberInput
                  label="مدة صلاحية OTP (دقائق)"
                  labelEn="OTP Expiration (mins)"
                  value={config.otpExpirationMinutes}
                  onChange={(v) => updateConfig('otpExpirationMinutes', v)}
                  min={1}
                  max={30}
                />
                <NumberInput
                  label="طول كود OTP"
                  labelEn="OTP Length"
                  value={config.otpLength}
                  onChange={(v) => updateConfig('otpLength', v)}
                  min={4}
                  max={8}
                />
                <NumberInput
                  label="الحد الأقصى للمحاولات"
                  labelEn="Max Attempts"
                  value={config.maxOtpAttempts}
                  onChange={(v) => updateConfig('maxOtpAttempts', v)}
                  min={3}
                  max={10}
                />
                <NumberInput
                  label="مدة الحظر (دقائق)"
                  labelEn="Lockout Duration (mins)"
                  value={config.otpLockoutMinutes}
                  onChange={(v) => updateConfig('otpLockoutMinutes', v)}
                  min={5}
                  max={60}
                />
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium text-yellow-500">إعدادات الجلسة - Session Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <NumberInput
                  label="مدة صلاحية Access Token (دقائق)"
                  labelEn="Access Token Expiration (mins)"
                  value={config.accessTokenExpirationMins}
                  onChange={(v) => updateConfig('accessTokenExpirationMins', v)}
                  min={5}
                  max={1440}
                />
                <NumberInput
                  label="مدة صلاحية Refresh Token (أيام)"
                  labelEn="Refresh Token Expiration (days)"
                  value={config.refreshTokenExpirationDays}
                  onChange={(v) => updateConfig('refreshTokenExpirationDays', v)}
                  min={1}
                  max={90}
                />
                <NumberInput
                  label="الحد الأقصى للجلسات النشطة"
                  labelEn="Max Active Sessions"
                  value={config.maxActiveSessions}
                  onChange={(v) => updateConfig('maxActiveSessions', v)}
                  min={1}
                  max={20}
                />
              </div>
            </div>
          </div>
        )}

        {/* Password Policy Tab */}
        {activeTab === 'password' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">سياسة كلمة المرور - Password Policy</h2>
            
            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <NumberInput
                  label="الحد الأدنى لطول كلمة المرور"
                  labelEn="Min Password Length"
                  value={config.minPasswordLength}
                  onChange={(v) => updateConfig('minPasswordLength', v)}
                  min={6}
                  max={32}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <ToggleSwitch
                  label="أحرف كبيرة مطلوبة"
                  labelEn="Require Uppercase"
                  checked={config.requireUppercase}
                  onChange={(v) => updateConfig('requireUppercase', v)}
                />
                <ToggleSwitch
                  label="أحرف صغيرة مطلوبة"
                  labelEn="Require Lowercase"
                  checked={config.requireLowercase}
                  onChange={(v) => updateConfig('requireLowercase', v)}
                />
                <ToggleSwitch
                  label="أرقام مطلوبة"
                  labelEn="Require Numbers"
                  checked={config.requireNumbers}
                  onChange={(v) => updateConfig('requireNumbers', v)}
                />
                <ToggleSwitch
                  label="رموز خاصة مطلوبة"
                  labelEn="Require Special Chars"
                  checked={config.requireSpecialChars}
                  onChange={(v) => updateConfig('requireSpecialChars', v)}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-500 mb-4">معاينة المتطلبات - Requirements Preview</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-300">كلمة المرور يجب أن تكون:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                  <li>على الأقل {config.minPasswordLength} أحرف</li>
                  {config.requireUppercase && <li>تحتوي على حرف كبير واحد على الأقل (A-Z)</li>}
                  {config.requireLowercase && <li>تحتوي على حرف صغير واحد على الأقل (a-z)</li>}
                  {config.requireNumbers && <li>تحتوي على رقم واحد على الأقل (0-9)</li>}
                  {config.requireSpecialChars && <li>تحتوي على رمز خاص واحد على الأقل (!@#$%^&*)</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">إعدادات الأمان - Security Settings</h2>
            
            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ToggleSwitch
                  label="المصادقة الثنائية"
                  labelEn="Two-Factor Auth"
                  checked={config.enableTwoFactor}
                  onChange={(v) => updateConfig('enableTwoFactor', v)}
                />
                <ToggleSwitch
                  label="المصادقة البيومترية"
                  labelEn="Biometric Auth"
                  checked={config.enableBiometric}
                  onChange={(v) => updateConfig('enableBiometric', v)}
                />
                <ToggleSwitch
                  label="تتبع الأجهزة"
                  labelEn="Device Tracking"
                  checked={config.enableDeviceTracking}
                  onChange={(v) => updateConfig('enableDeviceTracking', v)}
                />
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium text-yellow-500">روابط الشروط والخصوصية - Terms & Privacy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="رابط الشروط والأحكام"
                  labelEn="Terms URL"
                  value={config.termsUrl || ''}
                  onChange={(v) => updateConfig('termsUrl', v)}
                  placeholder="https://..."
                />
                <TextInput
                  label="رابط الشروط (عربي)"
                  labelEn="Terms URL (Arabic)"
                  value={config.termsUrlAr || ''}
                  onChange={(v) => updateConfig('termsUrlAr', v)}
                  placeholder="https://..."
                />
                <TextInput
                  label="رابط سياسة الخصوصية"
                  labelEn="Privacy URL"
                  value={config.privacyUrl || ''}
                  onChange={(v) => updateConfig('privacyUrl', v)}
                  placeholder="https://..."
                />
                <TextInput
                  label="رابط الخصوصية (عربي)"
                  labelEn="Privacy URL (Arabic)"
                  value={config.privacyUrlAr || ''}
                  onChange={(v) => updateConfig('privacyUrlAr', v)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        )}

        {/* UI Settings Tab */}
        {activeTab === 'ui' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">تخصيص الواجهة - UI Customization</h2>
            
            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium text-yellow-500">شاشة تسجيل الدخول - Login Screen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="عنوان شاشة الدخول (إنجليزي)"
                  labelEn="Login Screen Title"
                  value={config.loginScreenTitle}
                  onChange={(v) => updateConfig('loginScreenTitle', v)}
                />
                <TextInput
                  label="عنوان شاشة الدخول (عربي)"
                  labelEn="Login Screen Title (Arabic)"
                  value={config.loginScreenTitleAr}
                  onChange={(v) => updateConfig('loginScreenTitleAr', v)}
                />
                <TextInput
                  label="صورة خلفية شاشة الدخول"
                  labelEn="Login Background URL"
                  value={config.loginBackgroundUrl || ''}
                  onChange={(v) => updateConfig('loginBackgroundUrl', v)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium text-yellow-500">شاشة التسجيل - Register Screen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="عنوان شاشة التسجيل (إنجليزي)"
                  labelEn="Register Screen Title"
                  value={config.registerScreenTitle}
                  onChange={(v) => updateConfig('registerScreenTitle', v)}
                />
                <TextInput
                  label="عنوان شاشة التسجيل (عربي)"
                  labelEn="Register Screen Title (Arabic)"
                  value={config.registerScreenTitleAr}
                  onChange={(v) => updateConfig('registerScreenTitleAr', v)}
                />
                <TextInput
                  label="صورة خلفية شاشة التسجيل"
                  labelEn="Register Background URL"
                  value={config.registerBackgroundUrl || ''}
                  onChange={(v) => updateConfig('registerBackgroundUrl', v)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function ToggleSwitch({ label, labelEn, checked, onChange }: {
  label: string;
  labelEn: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition">
      <div>
        <span className="block text-white text-sm">{label}</span>
        <span className="block text-gray-500 text-xs">{labelEn}</span>
      </div>
      <div 
        className={`relative w-12 h-6 rounded-full transition ${checked ? 'bg-yellow-500' : 'bg-gray-600'}`}
        onClick={() => onChange(!checked)}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
      </div>
    </label>
  );
}

function TextInput({ label, labelEn, value, onChange, placeholder }: {
  label: string;
  labelEn: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-white mb-1">{label}</label>
      <span className="block text-xs text-gray-500 mb-2">{labelEn}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
      />
    </div>
  );
}

function NumberInput({ label, labelEn, value, onChange, min, max }: {
  label: string;
  labelEn: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="block text-sm text-white mb-1">{label}</label>
      <span className="block text-xs text-gray-500 mb-2">{labelEn}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min={min}
        max={max}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
      />
    </div>
  );
}

function SecretInput({ label, value, onChange, show, onToggle, multiline }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-white mb-2">{label}</label>
      <div className="relative">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none font-mono text-sm"
          />
        ) : (
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none font-mono text-sm"
          />
        )}
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
