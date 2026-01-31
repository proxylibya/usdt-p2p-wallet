
import React from 'react';
import { P2POffer, PaymentMethod } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Edit, Trash2, CreditCard } from 'lucide-react';
import { ALL_PAYMENT_METHODS } from '../constants';

interface MyOfferCardProps {
  offer: P2POffer;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const MyOfferCard: React.FC<MyOfferCardProps> = ({ offer, onToggle, onEdit, onDelete }) => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const isSell = offer.type === 'SELL';

    return (
        <div className="bg-background-secondary p-4 rounded-lg space-y-3 border border-transparent hover:border-border-divider transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${isSell ? 'bg-error/20 text-error' : 'bg-success/20 text-success'}`}>
                            {t(offer.type.toLowerCase() as any)}
                        </span>
                        <span className="text-sm font-bold text-text-primary">{offer.asset}</span>
                    </div>
                    <p className="text-lg font-bold text-text-primary">
                        {offer.price.toFixed(2)} <span className="text-xs font-normal text-text-secondary">{offer.fiatCurrency}</span>
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => onEdit(offer.id)} 
                        className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors"
                        aria-label="Edit"
                    >
                        <Edit size={18}/>
                    </button>
                    <button 
                        onClick={() => onDelete(offer.id)} 
                        className="p-2 rounded-full text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
                        aria-label="Delete"
                    >
                        <Trash2 size={18}/>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-text-secondary bg-background-tertiary/30 p-3 rounded-md">
                <div>
                    <p className="opacity-70">{t('available')}</p>
                    <p className="font-semibold text-text-primary mt-0.5">{offer.available.toLocaleString()} {offer.asset}</p>
                </div>
                <div className="text-end">
                    <p className="opacity-70">{t('order_limits')}</p>
                    <p className="font-semibold text-text-primary mt-0.5">{offer.minLimit.toLocaleString()} - {offer.maxLimit.toLocaleString()} {offer.fiatCurrency}</p>
                </div>
            </div>
            
            {/* Payment Methods Section */}
            <div className="flex flex-wrap gap-1.5 pt-1">
                {offer.paymentMethods.map(methodKey => {
                     const method = ALL_PAYMENT_METHODS.find(m => m.key === methodKey);
                     return (
                        <span key={methodKey} className="inline-flex items-center gap-1 bg-background-tertiary text-text-secondary text-[10px] px-2 py-1 rounded border border-border-divider">
                            {method ? t(method.key as any) : methodKey}
                        </span>
                     )
                })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border-divider">
                <span className={`text-sm font-medium ${offer.isActive ? 'text-success' : 'text-text-secondary'}`}>
                    {offer.isActive ? t('active') : t('disabled_adj')}
                </span>
                 <button
                    onClick={() => onToggle(offer.id, !offer.isActive)}
                    role="switch"
                    aria-checked={offer.isActive}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-secondary ${offer.isActive ? (primaryColor === 'brand-yellow' ? 'bg-brand-yellow' : 'bg-brand-green') : 'bg-background-tertiary'}`}
                    style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${offer.isActive ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'}`} />
                </button>
            </div>
        </div>
    );
};
