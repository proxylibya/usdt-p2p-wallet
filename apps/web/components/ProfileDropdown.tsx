
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User as UserIcon, Shield, Settings as SettingsIcon, LogOut, CreditCard } from 'lucide-react';
import { KYCBadge } from './KYCBadge';
import { KYCStatus } from '../types';

interface ProfileDropdownProps {
    onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);
    
    const handleLogout = () => {
        onClose();
        logout();
    };

    const handleNavigate = (path: string) => {
        onClose();
        navigate(path);
    };

    const menuItems = [
        { path: '/profile', label: t('my_profile'), icon: UserIcon },
        { path: '/profile/payment-methods', label: t('payment_methods'), icon: CreditCard },
        { path: '/security', label: t('security'), icon: Shield },
        { path: '/settings', label: t('settings'), icon: SettingsIcon },
    ];

    return (
        <div 
            ref={dropdownRef} 
            className="absolute top-full mt-2 w-64 bg-background-secondary rounded-2xl shadow-xl border border-border-divider z-50 animate-fadeInDown start-0 overflow-hidden"
        >
            <div className="p-4 border-b border-border-divider bg-background-tertiary/30">
                <div className="flex justify-between items-start gap-2">
                    <div className="overflow-hidden">
                        <p className="font-bold text-text-primary text-lg truncate text-start">{user?.name}</p>
                        <p className="text-xs text-text-secondary truncate text-start">{user?.phoneNumber}</p>
                    </div>
                    <KYCBadge status={user?.kycStatus || KYCStatus.NOT_VERIFIED} showLabel={false} onClick={() => handleNavigate('/profile/kyc')} />
                </div>
            </div>
            
            <div className="p-2">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-background-tertiary text-text-secondary hover:text-text-primary transition-colors text-start"
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                    </button>
                ))}
                
                <div className="h-px bg-border-divider my-1"></div>
                
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-error/10 text-text-secondary hover:text-error transition-colors text-start group"
                >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform rtl:rotate-180" />
                    <span className="text-sm font-medium">{t('logout')}</span>
                </button>
            </div>
        </div>
    );
};

export default ProfileDropdown;
