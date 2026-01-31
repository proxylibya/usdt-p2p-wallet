import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import FormPageLayout from '../../components/ui/FormPageLayout';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

const ADMIN_ROLES = [
  { value: 'SUPPORT', label: 'Support Agent', description: 'Handle customer support tickets' },
  { value: 'MODERATOR', label: 'Moderator', description: 'Moderate content and users' },
  { value: 'ADMIN', label: 'Admin', description: 'Full administrative access' },
  { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Complete system control' },
];

const CreateAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'MODERATOR',
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      error('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      error('Validation Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      error('Validation Error', 'Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/admin/admins', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      
      if (response.success) {
        success('Admin Created', 'New admin account has been created');
        navigate('/admins');
      } else {
        error('Failed', response.error || 'Could not create admin');
      }
    } catch {
      error('Failed', 'Could not create admin');
    }
    setIsSubmitting(false);
  };

  return (
    <FormPageLayout
      title="Create Admin Account"
      subtitle="Add a new administrator to the system"
      backPath="/admins"
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitLabel="Create Admin"
      icon={<UserPlus className="w-6 h-6 text-brand-yellow" />}
    >
      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Full Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field"
          placeholder="Enter full name"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Email Address *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="input-field"
          placeholder="admin@example.com"
        />
      </div>

      {/* Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-field pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Confirm Password *</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="input-field"
            placeholder="••••••••"
          />
        </div>
      </div>

      {/* Role Selection */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Role *</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ADMIN_ROLES.map((role) => (
            <label
              key={role.value}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                formData.role === role.value
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-border-divider bg-background-tertiary hover:border-brand-yellow/50'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={formData.role === role.value}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-5 h-5 mt-0.5 accent-brand-yellow"
              />
              <div>
                <p className="text-text-primary font-medium">{role.label}</p>
                <p className="text-text-secondary text-sm">{role.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-status-warning/10 border border-status-warning/30 rounded-xl p-4">
        <p className="text-status-warning font-medium">⚠️ Security Notice</p>
        <p className="text-text-secondary text-sm mt-1">
          The new admin will receive login credentials. Ensure you share them securely.
        </p>
      </div>
    </FormPageLayout>
  );
};

export default CreateAdminPage;
