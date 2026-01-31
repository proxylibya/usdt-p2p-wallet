
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { P2POffer } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useP2P } from '../context/P2PContext';
import { useNotifications } from '../context/NotificationContext';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: P2POffer;
}

export const TradeModal: React.FC<TradeModalProps> = ({ isOpen, onClose, offer }) => {
    const { primaryColor } = useTheme();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { createP2PTrade } = useP2P();
    const { addNotification } = useNotifications();
    
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const isBuy = offer.type === 'SELL'; // Taker is buying if Maker is selling

    const calculatedValue = useMemo(() => {
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0) return '0.00';
        
        if (isBuy) {
            // User enters fiat amount they want to pay, calculate crypto they receive
            return (numericAmount / offer.price).toFixed(4);
        } else {
            // User enters crypto amount they want to sell, calculate fiat they receive
            return (numericAmount * offer.price).toFixed(2);
        }
    }, [amount, offer.price, isBuy]);

    const handleConfirm = async () => {
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0) return;

        setIsSubmitting(true);
        try {
            // Calculate Crypto and Fiat amounts
            let cryptoAmt = 0;
            let fiatAmt = 0;

            if (isBuy) {
                // Input is Fiat
                fiatAmt = numericAmount;
                cryptoAmt = fiatAmt / offer.price;
            } else {
                // Input is Crypto
                cryptoAmt = numericAmount;
                fiatAmt = cryptoAmt * offer.price;
            }

            // Create Trade via Context
            const newTrade = await createP2PTrade(offer, cryptoAmt);
            
            addNotification({
                icon: 'success',
                title: t('success'),
                message: t('trade_created_message')
            });

            onClose();
            // Navigate to the newly created trade room with state to avoid race condition
            navigate(`/p2p/trade/${newTrade.id}`, { state: { trade: newTrade } });
        } catch (error: any) {
            addNotification({
                icon: 'error',
                title: t('error'),
                message: error.message || 'Failed to start trade'
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const payLabel = isBuy ? t('i_want_to_pay') : t('i_want_to_sell');
    const payUnit = isBuy ? offer.fiatCurrency : offer.asset;
    const receiveLabel = t('i_will_receive');
    const receiveUnit = isBuy ? offer.asset : offer.fiatCurrency;

    const inputAmount = amount;
    const outputAmount = calculatedValue;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t(isBuy ? 'buy' : 'sell')} ${offer.asset}`}>
            <div className="space-y-4">
                <div className="flex justify-between text-sm text-text-secondary">
                    <span>{t('price')}</span>
                    <span className="font-bold text-text-primary">{offer.price.toFixed(2)} {offer.fiatCurrency}</span>
                </div>
                <div className="flex justify-between text-sm text-text-secondary">
                    <span>{t('order_limits')}</span>
                    <span className="font-bold text-text-primary">{offer.minLimit.toLocaleString()} - {offer.maxLimit.toLocaleString()} {offer.fiatCurrency}</span>
                </div>

                <div className="bg-background-tertiary p-3 rounded-lg">
                    <label htmlFor="amount" className="text-sm text-text-secondary">{payLabel}</label>
                    <div className="relative mt-1">
                        <input
                            id="amount"
                            type="number"
                            value={inputAmount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-transparent text-xl font-bold focus:outline-none pe-16 text-start"
                            dir="ltr"
                            disabled={isSubmitting}
                        />
                        <span className="absolute end-0 top-1/2 -translate-y-1/2 font-semibold text-text-primary">{payUnit}</span>
                    </div>
                </div>

                 <div className="bg-background-tertiary p-3 rounded-lg">
                    <label htmlFor="receive" className="text-sm text-text-secondary">{receiveLabel} ({t('estimated')})</label>
                    <div className="relative mt-1">
                        <input
                            id="receive"
                            type="text"
                            value={outputAmount}
                            readOnly
                            className="w-full bg-transparent text-xl font-bold focus:outline-none pe-16 text-start"
                            dir="ltr"
                        />
                         <span className="absolute end-0 top-1/2 -translate-y-1/2 font-semibold text-text-primary">{receiveUnit}</span>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 p-3 rounded-lg font-semibold bg-background-tertiary text-text-primary" disabled={isSubmitting}>
                        {t('cancel')}
                    </button>
                     <button 
                        onClick={handleConfirm} 
                        disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                        className={`flex-1 p-3 rounded-lg font-bold text-white transition-opacity disabled:opacity-50 bg-${isBuy ? 'success' : 'error'}`}
                    >
                        {isSubmitting ? 'Processing...' : t('start_trade')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
