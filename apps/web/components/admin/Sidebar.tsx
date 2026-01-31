
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { HomeIcon } from '../icons/HomeIcon';
import { Users, X, ShieldAlert, FileText, Settings } from 'lucide-react';
import { SwapIcon } from '../icons/SwapIcon';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose, isMobile = false }) => {
    const { t } = useLanguage();

    const navItems = [
        { path: '/admin/dashboard', label: t('dashboard'), icon: HomeIcon },
        { path: '/admin/users', label: t('users'), icon: Users },
        { path: '/admin/transactions', label: t('transactions'), icon: SwapIcon },
        { path: '/admin/disputes', label: 'Disputes', icon: ShieldAlert },
        { path: '/admin/reports', label: t('reports'), icon: FileText },
        { path: '/admin/settings', label: t('admin_settings'), icon: Settings },
    ];

    const getActiveClassName = ({ isActive }: { isActive: boolean }): string => {
        let baseClasses = 'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200';
        return isActive
            ? `${baseClasses} bg-background-tertiary text-text-primary font-semibold`
            : `${baseClasses} text-text-secondary hover:bg-background-tertiary hover:text-text-primary`;
    };

    const containerClasses = isMobile
        ? `fixed inset-y-0 left-0 z-50 w-64 bg-background-secondary border-r border-border-divider p-4 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
        : 'w-64 bg-background-secondary border-e border-border-divider p-4 flex-shrink-0 hidden md:block';

    return (
        <>
            {isMobile && isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose}></div>
            )}
            <div className={containerClasses}>
                <div className="flex items-center justify-between mb-6 py-2">
                    <h1 className="text-2xl font-bold text-brand-yellow text-center w-full">{t('admin_panel')}</h1>
                    {isMobile && (
                        <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary">
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>
                <nav className="space-y-2">
                    {navItems.map(({ path, label, icon: Icon }) => (
                        <NavLink 
                            key={path} 
                            to={path} 
                            className={getActiveClassName}
                            onClick={isMobile ? onClose : undefined}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </>
    );
};
