import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

const AdminLoginScreen: React.FC = () => {
    const navigate = useNavigate();
    const { primaryColor } = useTheme();
    const { t } = useLanguage();
    const { login, isAuthenticated } = useAuth();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(email, password);
            
            if (result === 'direct') {
                localStorage.setItem('usdt_wallet_admin_token', 'authenticated');
                navigate('/admin/dashboard');
            } else if (result === 'otp') {
                setError('Admin login requires direct authentication. Please contact system administrator.');
            } else {
                setError('Invalid credentials. Please check your email and password.');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background-primary text-text-primary">
            <div className="w-full max-w-md p-8 space-y-8 bg-background-secondary rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-text-primary">{t('admin_login')}</h1>
                    <p className="text-text-secondary mt-2">{t('admin_panel')}</p>
                </div>
                
                {error && (
                    <div className="flex items-center gap-2 p-4 bg-status-error/10 border border-status-error/30 rounded-lg text-status-error">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label className="text-sm font-medium text-text-secondary" htmlFor="email">{t('email_address')}</label>
                        <div className="relative mt-2">
                            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('admin_email_placeholder')}
                                required
                                className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 ps-12 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:outline-none"
                                style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-text-secondary" htmlFor="password">{t('password')}</label>
                        <div className="relative mt-2">
                            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-background-tertiary border border-border-divider rounded-lg py-3 ps-12 pe-4 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:outline-none"
                                style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`w-full p-4 rounded-lg text-lg font-bold bg-${primaryColor} text-background-primary transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {isLoading ? t('loading') : t('login')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginScreen;
