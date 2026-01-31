
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { P2PTrade, TradeStatusP2P } from '../types';
import PageLayout from '../components/PageLayout';
import { EmptyState } from '../components/EmptyState';
import { ListChecks, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLiveData } from '../context/LiveDataContext';

// ActiveTradeCard component (adapted from P2PScreen)
const ActiveTradeCard: React.FC<{ trade: P2PTrade }> = ({ trade }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState('');
    const lastMessage = trade.chatHistory.length > 0 ? trade.chatHistory[trade.chatHistory.length - 1] : null;

    useEffect(() => {
        if (!trade || trade.status !== TradeStatusP2P.WAITING_FOR_PAYMENT || !trade.expiresAt) {
            setTimeLeft('');
            return;
        }
        
        const tick = () => {
            const expiry = new Date(trade.expiresAt!).getTime();
            const now = new Date().getTime();
            const distance = expiry - now;

            if (distance < 0) {
                setTimeLeft(t('expired'));
                return;
            }

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        tick();
        const interval = setInterval(tick, 1000);

        return () => clearInterval(interval);
    }, [trade, t]);
    
    const getTranslatedStatus = (trade: P2PTrade) => {
        const { status, isMyRoleBuyer } = trade;
        
        if (status === TradeStatusP2P.WAITING_FOR_PAYMENT) {
            return t(isMyRoleBuyer ? 'awaiting_your_payment' : 'awaiting_buyers_payment');
        }
        
        if (status === TradeStatusP2P.PAID_CONFIRMED_BY_BUYER || status === TradeStatusP2P.WAITING_FOR_RELEASE) {
            return t(isMyRoleBuyer ? 'waiting_for_seller_to_release' : 'release_crypto_to_buyer');
        }

        if (status === TradeStatusP2P.DISPUTED) {
            return t('mediation_pending');
        }

        // Normalize status string for translation key lookup (remove parentheses like in 'Paid (Waiting Release)')
        const key = status.toLowerCase().replace(/[()]/g, '').replace(/ /g, '_');
        return t(key as any) || status;
    }

    return (
        <div onClick={() => navigate(`/p2p/trade/${trade.id}`)} className="bg-background-secondary p-4 rounded-lg cursor-pointer hover:bg-background-tertiary/50 space-y-3 shadow-sm border border-border-divider/30">
            <div className="flex justify-between items-start text-sm">
                <div className="flex items-center gap-3">
                    <img src={trade.offer.user.avatarUrl} alt="user" className="w-10 h-10 rounded-full border border-border-divider" />
                    <div className="flex flex-col">
                        <span className="font-bold text-text-primary">{trade.offer.user.name}</span>
                        <span className={`text-xs font-bold ${trade.isMyRoleBuyer ? 'text-success' : 'text-error'}`}>
                           {t(trade.isMyRoleBuyer ? 'buy' : 'sell')} {trade.amount} {trade.offer.asset}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className={`font-bold text-brand-yellow text-xs px-2 py-1 bg-brand-yellow/10 rounded-md`}>
                        {trade.status === TradeStatusP2P.WAITING_FOR_PAYMENT && timeLeft ? timeLeft : getTranslatedStatus(trade)}
                    </div>
                     {trade.unreadMessages && trade.unreadMessages > 0 && (
                        <span className="h-5 w-5 flex items-center justify-center rounded-full bg-error text-white text-xs font-bold ring-2 ring-background-primary">
                            {trade.unreadMessages}
                        </span>
                    )}
                </div>
            </div>
             {lastMessage && (
                <div className="text-sm text-text-secondary truncate pt-2 border-t border-border-divider flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-yellow"></div>
                    {lastMessage.sender === 'me' && <span className="font-semibold text-text-primary">{t('you')}: </span>}
                    {lastMessage.sender === 'system' ? <span className="italic opacity-70">{lastMessage.text}</span> : <span className="opacity-90">{lastMessage.text}</span>}
                </div>
            )}
        </div>
    );
};


const CompletedTradeCard: React.FC<{ trade: P2PTrade }> = ({ trade }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const getStatusInfo = (status: TradeStatusP2P) => {
        // Fallback key generation for translation, removing parentheses
        const key = status.toLowerCase().replace(/[()]/g, '').replace(/ /g, '_');
        
        switch (status) {
            case TradeStatusP2P.COMPLETED:
                return { text: t('completed'), icon: <CheckCircle className="w-4 h-4 text-success" /> };
            case TradeStatusP2P.CANCELLED:
                return { text: t('cancelled'), icon: <XCircle className="w-4 h-4 text-error" /> };
            case TradeStatusP2P.DISPUTED:
                return { text: t('mediation_pending'), icon: <AlertTriangle className="w-4 h-4 text-brand-yellow" /> };
            default:
                // Ensure we try to translate the status, falling back to the English string if key missing
                return { text: t(key as any) || status, icon: <Clock className="w-4 h-4 text-text-secondary" /> };
        }
    };
    
    const statusInfo = getStatusInfo(trade.status);

    return (
        <div onClick={() => navigate(`/p2p/trade/${trade.id}`)} className="bg-background-secondary p-4 rounded-lg cursor-pointer hover:bg-background-tertiary/50 border border-border-divider/30 opacity-90 hover:opacity-100 transition-opacity">
            <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <img src={trade.offer.user.avatarUrl} alt="user" className="w-10 h-10 rounded-full grayscale opacity-80" />
                    <div>
                        <p className="font-bold text-text-primary text-sm">{trade.offer.user.name}</p>
                        <p className="text-xs text-text-secondary">{new Date(trade.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="text-end">
                    <p className={`font-bold text-sm ${trade.isMyRoleBuyer ? 'text-success' : 'text-error'}`}>
                        {trade.isMyRoleBuyer ? '+' : '-'} {trade.amount.toLocaleString()} {trade.offer.asset}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 text-xs mt-1 font-medium text-text-secondary">
                        {statusInfo.icon}
                        <span>{statusInfo.text}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}


const TradesScreen: React.FC = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
    const { isAuthenticated } = useAuth();
    const { activeTrades } = useLiveData();
    
    const tabs = (
        <div className="flex bg-background-tertiary p-1 rounded-lg mb-4 flex-shrink-0">
            <button onClick={() => setActiveTab('active')} className={`flex-1 p-2 rounded-md font-semibold text-sm transition ${activeTab === 'active' ? `bg-background-secondary text-text-primary shadow` : 'text-text-secondary'}`}>{t('active')}</button>
            <button onClick={() => setActiveTab('completed')} className={`flex-1 p-2 rounded-md font-semibold text-sm transition ${activeTab === 'completed' ? `bg-background-secondary text-text-primary shadow` : 'text-text-secondary'}`}>{t('completed')}</button>
        </div>
    );
    
    if (!isAuthenticated) {
        return (
            <PageLayout title={t('my_trades')}>
                <div className="flex flex-col h-full pb-6">
                    {tabs}
                    <div className="flex-grow overflow-y-auto">
                        {activeTab === 'active' && (
                            <EmptyState icon={ListChecks} title={t('no_active_trades')} message={t('no_active_trades_message')} />
                        )}
                        {activeTab === 'completed' && (
                            <EmptyState icon={ListChecks} title={t('no_completed_trades')} message={t('no_completed_trades_message')} />
                        )}
                    </div>
                </div>
            </PageLayout>
        );
    }

    const filteredActive = activeTrades.filter(t => t.status !== TradeStatusP2P.COMPLETED && t.status !== TradeStatusP2P.CANCELLED);
    const filteredCompleted = activeTrades.filter(t => t.status === TradeStatusP2P.COMPLETED || t.status === TradeStatusP2P.CANCELLED);
    
    return (
        <PageLayout title={t('my_trades')} scrollable={false}>
             <div className="flex flex-col h-full px-4 pt-4">
                {tabs}
                <div className="flex-grow overflow-y-auto pb-32 no-scrollbar">
                    {activeTab === 'active' && (
                        <div className="space-y-3">
                            {filteredActive.length > 0 ? (
                                filteredActive.map(trade => <ActiveTradeCard key={trade.id} trade={trade} />)
                            ) : (
                                <EmptyState icon={ListChecks} title={t('no_active_trades')} message={t('no_active_trades_message')} />
                            )}
                        </div>
                    )}
                    {activeTab === 'completed' && (
                        <div className="space-y-3">
                            {filteredCompleted.length > 0 ? (
                                filteredCompleted.map(trade => <CompletedTradeCard key={trade.id} trade={trade} />)
                             ) : (
                                <EmptyState icon={ListChecks} title={t('no_completed_trades')} message={t('no_completed_trades_message')} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default TradesScreen;
