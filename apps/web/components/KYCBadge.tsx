
import React from 'react';
import { KYCStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, Clock, AlertCircle, Shield } from 'lucide-react';

interface KYCBadgeProps {
    status: KYCStatus;
    className?: string;
    showLabel?: boolean;
    onClick?: () => void;
}

export const KYCBadge: React.FC<KYCBadgeProps> = ({ status, className = '', showLabel = true, onClick }) => {
    const { t } = useLanguage();

    const styles = {
        [KYCStatus.VERIFIED]: {
            bg: 'bg-[#0ECB81]/10',
            text: 'text-[#0ECB81]',
            border: 'border-[#0ECB81]/20',
            icon: CheckCircle2,
            label: 'verified'
        },
        [KYCStatus.PENDING]: {
            bg: 'bg-[#F0B90B]/10',
            text: 'text-[#F0B90B]',
            border: 'border-[#F0B90B]/20',
            icon: Clock,
            label: 'pending_verification'
        },
        [KYCStatus.REJECTED]: {
            bg: 'bg-[#F6465D]/10',
            text: 'text-[#F6465D]',
            border: 'border-[#F6465D]/20',
            icon: AlertCircle,
            label: 'rejected'
        },
        [KYCStatus.NOT_VERIFIED]: {
            bg: 'bg-[#2B3139]',
            text: 'text-[#848E9C]',
            border: 'border-[#2B3139]',
            icon: Shield,
            label: 'unverified'
        }
    };

    const config = styles[status] || styles[KYCStatus.NOT_VERIFIED];
    const Icon = config.icon;

    return (
        <div 
            onClick={onClick}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm transition-colors ${config.bg} ${config.text} ${config.border} ${className} ${onClick ? 'cursor-pointer hover:brightness-110' : ''}`}
        >
            <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
            {showLabel && <span>{t(config.label as any)}</span>}
        </div>
    );
};
