import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Validation Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      navigate('/dashboard');
    } else {
      error('Login Failed', 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-yellow/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-yellow/3 rounded-full blur-3xl animate-float-soft" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Animated Logo */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-yellow/20 rounded-2xl mb-4 animate-bounce-in hover:scale-110 transition-transform duration-300">
            <Shield className="w-8 h-8 text-brand-yellow" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary animate-fade-in" style={{ animationDelay: '200ms' }}>
            Admin Dashboard
          </h1>
          <p className="text-text-secondary mt-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
            Sign in to manage the platform
          </p>
        </div>

        {/* Animated Login Form */}
        <form 
          onSubmit={handleSubmit} 
          className="bg-background-secondary p-8 rounded-2xl border border-border-divider shadow-2xl animate-fade-in-up hover:shadow-brand-yellow/5 transition-shadow duration-500"
          style={{ animationDelay: '200ms' }}
        >
          <div className="space-y-6">
            {/* Email */}
            <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@example.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-text-disabled text-sm mt-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
          USDT P2P Platform Admin Panel v1.0
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
