
import React, { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { authService } from '../../services';

const ChangePasswordScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { addNotification } = useNotifications();
    const navigate = useNavigate();

    const [current, setCurrent] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPass.length < 8) {
             addNotification({ icon: 'error', title: 'Weak Password', message: 'Password must be at least 8 characters.' });
             return;
        }
        if (newPass !== confirm) {
            addNotification({ icon: 'error', title: 'Error', message: 'New passwords do not match.' });
            return;
        }

        setIsSaving(true);
        const response = await authService.changePassword(current, newPass);
        if (response.success) {
            addNotification({ icon: 'success', title: 'Success', message: 'Password changed successfully.' });
            navigate('/security');
        } else {
            addNotification({ icon: 'error', title: 'Error', message: response.error || 'Failed to change password.' });
        }
        setIsSaving(false);
    };

    const PasswordInput = ({ label, value, onChange, placeholder }: any) => (
        <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary ms-1 uppercase tracking-wide">{label}</label>
            <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input 
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-background-secondary border border-border-divider rounded-xl p-4 ps-12 pe-12 focus:outline-none focus:border-brand-yellow transition-colors text-sm font-medium text-text-primary"
                    style={{'--tw-border-opacity': 1, borderColor: value ? `var(--tw-color-${primaryColor})` : ''} as any}
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1"
                >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );

    const Requirement = ({ met, text }: { met: boolean, text: string }) => (
        <div className={`flex items-center gap-2 text-xs transition-colors duration-300 ${met ? 'text-success' : 'text-text-secondary'}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${met ? 'border-success bg-success/10' : 'border-text-secondary/30'}`}>
                {met && <Check className="w-2.5 h-2.5" />}
            </div>
            <span>{text}</span>
        </div>
    );

    return (
        <PageLayout title={t('change_password')} scrollable={false}>
            <form onSubmit={handleSubmit} className="flex flex-col h-full bg-background-primary">
                <div className="flex-grow overflow-y-auto p-4 space-y-8">
                    <div className="bg-brand-yellow/10 p-4 rounded-xl border border-brand-yellow/20 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-brand-yellow flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-text-secondary leading-relaxed">
                            To secure your account, please use a strong password that you haven't used on other websites.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <PasswordInput label="Current Password" value={current} onChange={setCurrent} placeholder="Enter current password" />
                        
                        <div className="h-px bg-border-divider/50 w-full"></div>
                        
                        <div className="space-y-4">
                            <PasswordInput label="New Password" value={newPass} onChange={setNewPass} placeholder="Enter new password" />
                            <PasswordInput label="Confirm New Password" value={confirm} onChange={setConfirm} placeholder="Repeat new password" />
                        </div>
                    </div>

                    <div className={`bg-background-secondary p-5 rounded-xl border border-border-divider transition-all duration-300 ${newPass ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2'}`}>
                        <p className="text-xs font-bold text-text-primary mb-3 uppercase tracking-wide">Password Requirements:</p>
                        <div className="space-y-2">
                            <Requirement met={newPass.length >= 8} text="Minimum 8 characters" />
                            <Requirement met={/[A-Z]/.test(newPass)} text="At least 1 uppercase letter" />
                            <Requirement met={/[0-9]/.test(newPass)} text="At least 1 number" />
                        </div>
                    </div>
                </div>

                <div className="p-4 pb-8 bg-background-primary border-t border-border-divider/10 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
                    <button 
                        type="submit" 
                        disabled={isSaving || !current || !newPass || !confirm}
                        className={`w-full p-4 rounded-xl font-bold text-background-primary bg-${primaryColor} disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg`}
                    >
                        {isSaving ? t('saving') : 'Confirm Change'}
                    </button>
                </div>
            </form>
        </PageLayout>
    );
};

export default ChangePasswordScreen;
