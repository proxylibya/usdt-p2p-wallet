import React from 'react';
import { VerifiedIcon } from './icons/VerifiedIcon';
import { useLanguage } from '../context/LanguageContext';

const VerifiedBadge: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="flex items-center gap-1 text-xs font-semibold text-brand-yellow">
            <VerifiedIcon className="w-4 h-4" />
            <span>{t('verified')}</span>
        </div>
    );
};

export default VerifiedBadge;
