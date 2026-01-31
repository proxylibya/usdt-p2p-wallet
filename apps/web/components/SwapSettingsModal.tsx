
import React, { useState } from 'react';
import { Modal } from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface SwapSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    slippage: number;
    setSlippage: (val: number) => void;
    deadline: number;
    setDeadline: (val: number) => void;
}

export const SwapSettingsModal: React.FC<SwapSettingsModalProps> = ({
    isOpen,
    onClose,
    slippage,
    setSlippage,
    deadline,
    setDeadline,
}) => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const [customSlippage, setCustomSlippage] = useState('');

    const handleCustomSlippage = (val: string) => {
        setCustomSlippage(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            setSlippage(num);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Swap Settings">
            <div className="space-y-6">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-text-primary text-sm">{t('slippage_tolerance')}</h3>
                        <span className="text-xs text-brand-yellow font-medium">{slippage}%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                        {[0.1, 0.5, 1.0].map((val) => (
                            <button
                                key={val}
                                onClick={() => { setSlippage(val); setCustomSlippage(''); }}
                                className={`py-2 rounded-lg text-xs font-bold transition-colors ${slippage === val && !customSlippage ? `bg-${primaryColor} text-background-primary` : 'bg-background-tertiary text-text-secondary hover:text-text-primary'}`}
                            >
                                {val}%
                            </button>
                        ))}
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="Custom"
                                value={customSlippage}
                                onChange={(e) => handleCustomSlippage(e.target.value)}
                                className={`w-full h-full bg-background-tertiary rounded-lg text-center text-xs font-bold focus:outline-none focus:ring-2 focus:ring-${primaryColor} ${customSlippage ? `text-${primaryColor}` : 'text-text-primary'}`}
                            />
                            {customSlippage && <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary">%</span>}
                        </div>
                    </div>
                    {slippage > 1 && (
                        <p className="text-xs text-brand-yellow mt-1 bg-brand-yellow/10 p-2 rounded">
                            {t('high_slippage_warning')}
                        </p>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-text-primary text-sm">{t('transaction_deadline')}</h3>
                        <span className="text-xs text-text-secondary">{deadline} {t('minutes')}</span>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            value={deadline}
                            onChange={(e) => setDeadline(Number(e.target.value))}
                            className={`w-full bg-background-tertiary border border-border-divider rounded-lg p-3 pr-16 text-sm font-bold focus:outline-none focus:border-${primaryColor}`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-secondary font-medium">{t('minutes')}</span>
                    </div>
                </div>

                <button 
                    onClick={onClose} 
                    className={`w-full py-3 rounded-lg font-bold text-background-primary bg-${primaryColor} mt-2`}
                >
                    {t('save_changes')}
                </button>
            </div>
        </Modal>
    );
};
