
import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import { MarketCoin, Wallet } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { Wallet as WalletIcon, ArrowDown } from 'lucide-react';

interface QuickTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    coin: MarketCoin;
    initialType: 'buy' | 'sell';
    wallets: Wallet[];
    onConfirm: (type: 'buy' | 'sell', amount: number, total: number) => void;
}

export const QuickTradeModal: React.FC<QuickTradeModalProps> = ({ 
    isOpen, 
    onClose, 
    coin, 
    initialType, 
    wallets, 
    onConfirm 
}) => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { formatCurrency } = useCurrency();
    const { isAuthenticated } = useAuth();

    const [type, setType] = useState<'buy' | 'sell'>(initialType);
    const [amount, setAmount] = useState(''); // Amount in Crypto
    const [total, setTotal] = useState('');   // Total in USDT
    const [percentage, setPercentage] = useState<number | null>(null);

    // Get Balances
    const usdtWallet = wallets.find(w => w.symbol === 'USDT');
    const assetWallet = wallets.find(w => w.symbol === coin.symbol);

    const availableUsdt = usdtWallet ? usdtWallet.balance : 0;
    const availableAsset = assetWallet ? assetWallet.balance : 0;

    useEffect(() => {
        setType(initialType);
        setAmount('');
        setTotal('');
        setPercentage(null);
    }, [initialType, isOpen]);

    const handleAmountChange = (val: string) => {
        setAmount(val);
        setPercentage(null);
        if (!val || parseFloat(val) < 0) {
            setTotal('');
            return;
        }
        setTotal((parseFloat(val) * coin.price).toFixed(2));
    };

    const handleTotalChange = (val: string) => {
        setTotal(val);
        setPercentage(null);
        if (!val || parseFloat(val) < 0) {
            setAmount('');
            return;
        }
        setAmount((parseFloat(val) / coin.price).toFixed(6));
    };

    const handlePercentageClick = (pct: number) => {
        setPercentage(pct);
        if (type === 'buy') {
            const useUsdt = availableUsdt * (pct / 100);
            setTotal(useUsdt.toFixed(2));
            setAmount((useUsdt / coin.price).toFixed(6));
        } else {
            const useAsset = availableAsset * (pct / 100);
            setAmount(useAsset.toFixed(6));
            setTotal((useAsset * coin.price).toFixed(2));
        }
    };

    const handleSubmit = () => {
        if (!amount || !total) return;
        onConfirm(type, parseFloat(amount), parseFloat(total));
    };

    const isValid = useMemo(() => {
        const numTotal = parseFloat(total);
        const numAmount = parseFloat(amount);
        if (!numTotal || !numAmount || numTotal <= 0) return false;

        if (type === 'buy') {
            return numTotal <= availableUsdt;
        } else {
            return numAmount <= availableAsset;
        }
    }, [type, total, amount, availableUsdt, availableAsset]);

    const activeColor = type === 'buy' ? 'bg-success' : 'bg-error';
    const activeText = type === 'buy' ? 'text-success' : 'text-error';

    return (
        <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none ${isOpen ? '' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className={`bg-background-secondary w-full max-w-md sm:rounded-2xl rounded-t-3xl p-5 shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-y-0 pointer-events-auto' : 'translate-y-full sm:translate-y-10 sm:scale-95 pointer-events-none'}`}>
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-border-divider rounded-full mx-auto mb-4 sm:hidden"></div>

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            {coin.symbol} / USDT
                        </h2>
                        <span className={`text-sm font-mono font-bold ${coin.change24h >= 0 ? 'text-success' : 'text-error'}`}>
                            ${coin.price.toLocaleString()}
                        </span>
                    </div>
                    
                    {/* Toggle */}
                    <div className="flex bg-background-tertiary p-1 rounded-lg">
                        <button 
                            onClick={() => setType('buy')}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${type === 'buy' ? 'bg-success text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            {t('buy')}
                        </button>
                        <button 
                            onClick={() => setType('sell')}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${type === 'sell' ? 'bg-error text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            {t('sell')}
                        </button>
                    </div>
                </div>

                {/* Order Form */}
                <div className="space-y-4">
                    
                    {/* Inputs */}
                    <div className="space-y-3">
                        {/* Price Input (Readonly for Market) */}
                        <div className="bg-background-tertiary rounded-xl p-3 border border-border-divider opacity-70">
                            <div className="flex justify-between text-xs text-text-secondary mb-1">
                                <span>Market Price</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-mono font-bold text-text-primary">Best Market Price</span>
                                <span className="text-xs font-bold text-text-secondary">Market</span>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="bg-background-tertiary rounded-xl p-3 border border-border-divider focus-within:border-brand-yellow transition-colors">
                            <div className="flex justify-between text-xs text-text-secondary mb-1">
                                <span>Amount ({coin.symbol})</span>
                            </div>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-transparent text-lg font-bold text-text-primary focus:outline-none placeholder-text-secondary/30"
                            />
                        </div>

                        <div className="flex justify-center -my-2 relative z-10">
                            <div className="bg-background-secondary p-1 rounded-full border border-border-divider">
                                <ArrowDown className="w-4 h-4 text-text-secondary" />
                            </div>
                        </div>

                        {/* Total Input */}
                        <div className="bg-background-tertiary rounded-xl p-3 border border-border-divider focus-within:border-brand-yellow transition-colors">
                            <div className="flex justify-between text-xs text-text-secondary mb-1">
                                <span>Total (USDT)</span>
                            </div>
                            <input 
                                type="number" 
                                value={total}
                                onChange={(e) => handleTotalChange(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-transparent text-lg font-bold text-text-primary focus:outline-none placeholder-text-secondary/30"
                            />
                        </div>
                    </div>

                    {/* Percentage Slider */}
                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-text-secondary">Available</span>
                            <span className="font-bold text-text-primary flex items-center gap-1">
                                <WalletIcon className="w-3 h-3 text-text-secondary" />
                                {type === 'buy' ? `${availableUsdt.toFixed(2)} USDT` : `${availableAsset.toFixed(4)} ${coin.symbol}`}
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[25, 50, 75, 100].map(pct => (
                                <button
                                    key={pct}
                                    onClick={() => handlePercentageClick(pct)}
                                    className={`py-1.5 rounded-lg text-xs font-bold transition-colors border ${percentage === pct ? `border-${type === 'buy' ? 'success' : 'error'} ${activeText} bg-${type === 'buy' ? 'success' : 'error'}/10` : 'border-border-divider bg-background-tertiary text-text-secondary hover:bg-background-primary'}`}
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || !isAuthenticated}
                        className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed ${activeColor}`}
                    >
                        {isAuthenticated ? (
                            isValid 
                                ? `${type === 'buy' ? t('buy') : t('sell')} ${coin.symbol}` 
                                : t('insufficient_balance')
                        ) : (
                            t('login_required')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
