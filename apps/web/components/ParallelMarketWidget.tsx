
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowRightLeft, TrendingUp } from 'lucide-react';
import { LibyanDinarIcon } from './icons/LibyanDinarIcon';
import { Flag } from './Flag';

export const ParallelMarketWidget: React.FC = () => {
    const { t, language } = useLanguage();
    const { primaryColor } = useTheme();
    const [amount, setAmount] = useState('100');
    const [isUsdtToLyd, setIsUsdtToLyd] = useState(true);
    
    // Mock Rates (In real app, fetch from API)
    const RATES = {
        OFFICIAL: 4.85,
        PARALLEL: 7.15,
        EGP_PARALLEL: 51.50
    };

    const handleSwap = () => {
        setIsUsdtToLyd(!isUsdtToLyd);
    };

    const calculatedValue = isUsdtToLyd 
        ? (parseFloat(amount || '0') * RATES.PARALLEL).toFixed(2)
        : (parseFloat(amount || '0') / RATES.PARALLEL).toFixed(2);

    return (
        <div className="bg-background-secondary rounded-2xl p-4 border border-border-divider/50 shadow-lg relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${primaryColor}/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none`}></div>
            
            <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <TrendingUp className={`w-5 h-5 text-${primaryColor}`} />
                    <span className="font-bold text-text-primary">{t('parallel_market')}</span>
                </div>
                <div className="text-xs bg-background-tertiary px-2 py-1 rounded text-text-secondary border border-border-divider">
                    1 USDT ≈ <span className="font-bold text-text-primary">{RATES.PARALLEL} LYD</span>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-background-tertiary/30 p-1 rounded-xl relative z-10">
                <div className="flex-1">
                    <div className="flex items-center gap-2 px-3 py-1">
                        {isUsdtToLyd ? <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[8px] font-bold text-white">T</div> : <Flag code="LY" className="w-5 h-4 rounded-sm object-cover" />}
                        <span className="text-xs font-bold text-text-secondary">{isUsdtToLyd ? 'USDT' : 'LYD'}</span>
                    </div>
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-transparent text-lg font-bold text-text-primary px-3 pb-2 focus:outline-none placeholder-text-secondary/30"
                    />
                </div>

                <button onClick={handleSwap} className="p-2 rounded-full bg-background-tertiary hover:bg-background-secondary text-text-secondary transition-colors border border-border-divider/50">
                    <ArrowRightLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 text-end">
                    <div className="flex items-center justify-end gap-2 px-3 py-1">
                        {!isUsdtToLyd ? <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[8px] font-bold text-white">T</div> : <Flag code="LY" className="w-5 h-4 rounded-sm object-cover" />}
                        <span className="text-xs font-bold text-text-secondary">{!isUsdtToLyd ? 'USDT' : 'LYD'}</span>
                    </div>
                    <div className="text-lg font-bold text-text-primary px-3 pb-2 truncate">
                        {calculatedValue}
                    </div>
                </div>
            </div>
        </div>
    );
};
