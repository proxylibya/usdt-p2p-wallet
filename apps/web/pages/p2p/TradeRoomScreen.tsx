
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useP2P } from '../../context/P2PContext';
import { useCall } from '../../context/CallContext';
import { useSound } from '../../hooks/useSound';
import { P2PTrade, TradeStatusP2P } from '../../types';
import { SendIcon } from '../../components/icons/SendIcon';
import { ArrowLeft, ShieldCheck, Clock, Paperclip, CheckCheck, Phone, Video, MoreVertical, Mic, AlertTriangle, Copy, Banknote, Lock, Snowflake } from 'lucide-react';
import { ReleaseConfirmationModal } from '../../components/ReleaseConfirmationModal';
import { PaymentConfirmationModal } from '../../components/PaymentConfirmationModal';
import { AppealModal } from '../../components/AppealModal';
import { FeedbackModal } from '../../components/FeedbackModal';
import { useNotifications } from '../../context/NotificationContext';
import { SkeletonLoader } from '../../components/SkeletonLoader';

const TradeTimer: React.FC<{ expiresAt: string, onExpire?: () => void, status: TradeStatusP2P }> = ({ expiresAt, onExpire, status }) => {
    const [timeLeft, setTimeLeft] = useState<{m: number, s: number} | null>(null);
    
    useEffect(() => {
        if (status !== TradeStatusP2P.WAITING_FOR_PAYMENT) {
            setTimeLeft(null); 
            return;
        }

        const tick = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft({ m: 0, s: 0 });
                if (onExpire) onExpire();
                return;
            }

            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft({ m, s });
        };

        tick(); 
        const timerId = setInterval(tick, 1000);
        return () => clearInterval(timerId);
    }, [expiresAt, status]);

    if (!timeLeft && status !== TradeStatusP2P.WAITING_FOR_PAYMENT) return null;

    return (
        <div className="flex items-center gap-2 bg-background-tertiary/80 px-3 py-1.5 rounded-lg border border-border-divider/50 shadow-sm backdrop-blur-sm">
            <Clock className="w-4 h-4 text-brand-yellow" />
            <span className="font-mono font-bold text-text-primary text-sm">
                {timeLeft ? `${timeLeft.m.toString().padStart(2, '0')}:${timeLeft.s.toString().padStart(2, '0')}` : '--:--'}
            </span>
        </div>
    );
};

const TradeProgress: React.FC<{ status: TradeStatusP2P }> = ({ status }) => {
    const { t } = useLanguage();
    const steps = [
        { id: 'created', label: t('orders') },
        { id: 'paid', label: t('completed') }, 
        { id: 'completed', label: t('release_crypto') }
    ];

    let currentStepIndex = 0;
    if (status === TradeStatusP2P.PAID_CONFIRMED_BY_BUYER || status === TradeStatusP2P.WAITING_FOR_RELEASE) currentStepIndex = 1;
    if (status === TradeStatusP2P.COMPLETED) currentStepIndex = 2;
    if (status === TradeStatusP2P.CANCELLED || status === TradeStatusP2P.DISPUTED) currentStepIndex = 1; 

    return (
        <div className="px-6 py-4 bg-background-secondary border-b border-border-divider relative overflow-hidden transition-all duration-300">
            {status === TradeStatusP2P.DISPUTED && (
                <div className="absolute inset-0 bg-error/10 flex items-center justify-center z-20 backdrop-blur-[2px]">
                    <div className="bg-error text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
                        {t('mediation_pending')}
                    </div>
                </div>
            )}
            
            <div className="relative flex justify-between">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-background-tertiary -z-0"></div>
                <div 
                    className="absolute top-1/2 left-0 h-0.5 bg-brand-yellow transition-all duration-500 -z-0" 
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                ></div>
                
                {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isActive = index === currentStepIndex;
                    return (
                        <div key={step.id} className="flex flex-col items-center z-10 relative">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300 ${isCompleted ? 'bg-brand-yellow border-brand-yellow text-background-primary' : 'bg-background-secondary border-text-secondary text-text-secondary'}`}>
                                {isCompleted ? <CheckCheck className="w-3.5 h-3.5" /> : index + 1}
                            </div>
                            <span className={`text-[10px] mt-1.5 font-medium transition-colors ${isActive ? 'text-brand-yellow' : isCompleted ? 'text-text-primary' : 'text-text-secondary'}`}>{step.label}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

const PaymentInstructions: React.FC<{ 
    offer: any, 
    amount: number, 
    fiatAmount: number 
}> = ({ offer, amount, fiatAmount }) => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const [selectedMethodKey, setSelectedMethodKey] = useState<string>(offer.paymentMethods[0]);
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Retrieve details from offer based on selected method
    const paymentDetail = offer.paymentDetails ? offer.paymentDetails[selectedMethodKey] : null;

    return (
        <div className="bg-background-tertiary/20 p-4 rounded-xl border border-border-divider/50 mb-4 animate-fadeInDown">
            <h3 className="text-xs font-bold text-text-secondary uppercase mb-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full bg-${primaryColor} animate-pulse`}></span>
                {t('payment_details_section')}
            </h3>
            
            <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-text-secondary">{t('amount')}</span>
                    <span className={`font-mono font-bold text-lg text-${primaryColor}`}>{fiatAmount.toFixed(2)} {offer.fiatCurrency}</span>
                </div>
                
                {offer.paymentMethods.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {offer.paymentMethods.map((key: string) => (
                            <button 
                                key={key}
                                onClick={() => setSelectedMethodKey(key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${selectedMethodKey === key ? `bg-${primaryColor}/10 border-${primaryColor} text-${primaryColor}` : 'bg-background-secondary border-border-divider text-text-secondary'}`}
                            >
                                {t(key as any)}
                            </button>
                        ))}
                    </div>
                )}
                
                <div className="h-px bg-border-divider/50"></div>
                
                {paymentDetail ? (
                    <div className="space-y-3">
                        {Object.entries(paymentDetail).map(([label, value]) => (
                            <div key={label} className="flex justify-between items-center">
                                <span className="text-text-secondary text-xs font-medium">{label}</span>
                                <div className="flex items-center gap-2 max-w-[65%]">
                                    <span className="font-mono font-bold text-text-primary truncate text-right block w-full">{String(value)}</span>
                                    <button onClick={() => handleCopy(String(value))} className="text-text-secondary hover:text-text-primary shrink-0">
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-2 text-text-secondary text-xs italic">
                        No specific details provided. Please ask seller in chat.
                    </div>
                )}
                
                <div className="bg-brand-yellow/10 p-3 rounded text-[10px] text-text-secondary mt-2 border border-brand-yellow/20 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-brand-yellow shrink-0" />
                    <p>
                        <span className="font-bold text-brand-yellow block mb-0.5">IMPORTANT:</span>
                        Do not write "Crypto", "USDT" or "Binance" in the payment remarks. Use the Reference ID only if provided.
                    </p>
                </div>
            </div>
        </div>
    );
}

const TradeRoomScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { addNotification } = useNotifications();
    const { playSound } = useSound();
    const { startCall } = useCall();
    
    const { activeTrades, markP2PTradePaid, releaseP2PEscrow, cancelP2PTrade, sendP2PMessage, submitAppeal } = useP2P();
    
    const [trade, setTrade] = useState<P2PTrade | null>(() => {
        if (location.state && location.state.trade) {
            return location.state.trade;
        }
        return null;
    });

    const [newMessage, setNewMessage] = useState('');
    const [isReleaseModalOpen, setReleaseModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isAppealModalOpen, setAppealModalOpen] = useState(false);
    const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
    
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!id) return;
        const foundTrade = activeTrades.find(t => t.id === id);
        if (foundTrade) {
            // Check for new messages to play sound
            if (trade && foundTrade && foundTrade.chatHistory.length > trade.chatHistory.length) {
                const lastMsg = foundTrade.chatHistory[foundTrade.chatHistory.length - 1];
                if (lastMsg && lastMsg.sender !== 'me' && lastMsg.sender !== 'system') {
                    playSound('message');
                }
            }
            // Check for status change
            if (trade && trade.status !== foundTrade.status) {
                if (foundTrade.status === TradeStatusP2P.COMPLETED) {
                    playSound('cash');
                } else if (foundTrade.status === TradeStatusP2P.PAID_CONFIRMED_BY_BUYER) {
                    playSound('coin');
                }
            }
            setTrade(foundTrade);
        }
    }, [id, activeTrades, trade, playSound]); 

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [trade?.chatHistory]);

    const handleSendMessage = (e?: React.FormEvent, textOverride?: string) => {
        if (e) e.preventDefault();
        const content = textOverride || newMessage;
        
        if (!content.trim() || !trade) return;
        
        sendP2PMessage(trade.id, content, 'me');
        playSound('pop'); 
        setNewMessage('');
    };

    const handleConfirmPayment = async () => {
        if (trade) {
            await markP2PTradePaid(trade.id);
            setPaymentModalOpen(false);
            addNotification({ icon: 'success', title: t('success'), message: t('you_marked_as_paid') });
        }
    };

    const confirmRelease = async () => {
        if (trade) {
            await releaseP2PEscrow(trade.id);
            setReleaseModalOpen(false);
            setFeedbackModalOpen(true);
            addNotification({ icon: 'success', title: t('success'), message: t('you_released_crypto') });
        }
    };

    if (!trade) return <div className="p-4 pt-safe"><SkeletonLoader className="h-full w-full rounded-xl" /></div>;

    const isBuy = trade.isMyRoleBuyer;
    const counterpartyName = isBuy ? trade.sellerName : trade.buyerName;
    const isEscrowLocked = trade.status !== TradeStatusP2P.COMPLETED && trade.status !== TradeStatusP2P.CANCELLED;

    return (
        <div className="flex flex-col h-full bg-background-primary overflow-hidden">
            {/* Header */}
            <div className="flex-none p-4 pb-2 bg-background-secondary border-b border-border-divider z-20 pt-safe">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-background-tertiary transition-colors">
                            <ArrowLeft className="w-6 h-6 text-text-secondary rtl:rotate-180" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-text-primary flex items-center gap-1">
                                    {isBuy ? t('buy') : t('sell')} {trade.offer.asset}
                                </h1>
                                <span className="text-[10px] bg-background-tertiary px-1.5 py-0.5 rounded text-text-secondary border border-border-divider">#{trade.id.slice(-4)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-text-secondary">
                                <span className={`w-2 h-2 rounded-full ${trade.status === TradeStatusP2P.COMPLETED ? 'bg-success' : 'bg-brand-yellow'}`}></span>
                                {t(trade.status.toLowerCase().replace(/ /g, '_') as any)}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => startCall('audio', counterpartyName || 'User')} className="p-2 rounded-full hover:bg-background-tertiary text-text-secondary transition-colors"><Phone className="w-5 h-5" /></button>
                        <button className="p-2 rounded-full hover:bg-background-tertiary text-text-secondary transition-colors"><MoreVertical className="w-5 h-5" /></button>
                    </div>
                </div>
                
                <TradeProgress status={trade.status} />
                
                {/* IMPROVED ESCROW BANNER - TRUST INDICATOR */}
                {isEscrowLocked && (
                    <div className="mt-4 mx-1 rounded-xl overflow-hidden relative border border-brand-yellow/30 bg-background-secondary shadow-lg">
                        {/* Shimmer Effect for Activity */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-yellow/5 to-transparent skew-x-[-20deg] animate-[shimmer_2s_infinite]"></div>
                        
                        <div className="p-4 flex items-center gap-4 relative z-10">
                            {/* Icon Container */}
                            <div className="w-12 h-12 rounded-full bg-brand-yellow/10 flex items-center justify-center flex-shrink-0 border border-brand-yellow/20">
                                <ShieldCheck className="w-6 h-6 text-brand-yellow drop-shadow-md" />
                            </div>
                            
                            {/* Text Content */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-text-primary text-sm uppercase tracking-wide flex items-center gap-2">
                                        {t('escrow_protected')}
                                        <Lock className="w-3 h-3 text-success" />
                                    </h3>
                                    <div className="text-right">
                                        <TradeTimer expiresAt={trade.expiresAt || ''} status={trade.status} />
                                    </div>
                                </div>
                                <p className="text-xs text-text-secondary mt-1 leading-snug">
                                    <span className="font-bold text-brand-yellow">{trade.amount} {trade.offer.asset}</span> {t('is_frozen')} in a secure intermediary vault.
                                </p>
                                <p className="text-[10px] text-text-secondary/70 mt-1">
                                    {isBuy ? "Seller cannot withdraw funds." : "Funds are held until you confirm payment."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* SAFE P2P WARNING BANNER */}
                <div className="mt-2 bg-error/5 border border-error/20 p-2 rounded flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-text-secondary leading-tight">
                        {isBuy 
                            ? t('p2p_warning_buy')
                            : t('p2p_warning_sell')}
                    </p>
                </div>
            </div>

            {/* Chat & Instructions */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-background-primary relative">
                
                {/* Show Instructions for Buyer if Pending */}
                {isBuy && trade.status === TradeStatusP2P.WAITING_FOR_PAYMENT && (
                    <PaymentInstructions offer={trade.offer} amount={trade.amount} fiatAmount={trade.fiatAmount} />
                )}

                <div className="flex justify-center my-4">
                    <span className="bg-background-tertiary text-text-secondary text-[10px] px-3 py-1 rounded-full font-medium shadow-sm flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> {t('secure_chat_history')}
                    </span>
                </div>

                {trade.chatHistory.map(msg => (
                    msg.isSystem ? (
                        <div key={msg.id} className="flex justify-center my-2 animate-fadeIn w-full">
                            <span className="text-[10px] text-text-secondary italic bg-background-secondary/50 px-3 py-1.5 rounded-full border border-border-divider/50 flex items-center gap-1.5">
                                <ShieldCheck className="w-3 h-3" />
                                {msg.text} <span className="opacity-60 ml-1">{msg.timestamp}</span>
                            </span>
                        </div>
                    ) : (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} animate-slideInFromRight`}>
                            <div className={`max-w-[75%] p-3 rounded-2xl relative shadow-sm text-sm break-words ${
                                msg.sender === 'me' 
                                ? `bg-${primaryColor} text-background-primary rounded-br-none` 
                                : 'bg-background-secondary text-text-primary rounded-bl-none border border-border-divider'
                            }`}>
                                <p>{msg.text}</p>
                                <span className={`text-[9px] block text-end mt-1 ${msg.sender === 'me' ? 'text-black/60' : 'text-text-secondary'}`}>
                                    {msg.timestamp}
                                </span>
                            </div>
                        </div>
                    )
                ))}
                
                <div ref={chatEndRef} />
            </div>

            {/* Bottom Actions */}
            <div className="flex-none bg-background-secondary border-t border-border-divider pb-safe">
                <form onSubmit={(e) => handleSendMessage(e)} className="p-3 flex items-center gap-2">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('type_message')}
                        className="flex-grow bg-background-tertiary border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-yellow/50 focus:outline-none transition-shadow"
                    />
                    <div className="h-1 flex-1 rounded-full transition-colors duration-300 bg-brand-yellow"></div>
                    <button type="submit" className="p-2.5 rounded-full bg-brand-yellow text-background-primary shadow-md hover:brightness-110 active:scale-95 transition-all">
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>

                {/* Action Buttons based on State */}
                <div className="p-4 pt-0">
                    {/* Buyer: Pay */}
                    {trade.status === TradeStatusP2P.WAITING_FOR_PAYMENT && isBuy && (
                        <div className="flex gap-3">
                            <button className="flex-1 py-3.5 rounded-xl font-bold text-text-secondary bg-background-tertiary hover:bg-border-divider transition-colors text-sm">
                                {t('cancel_order')}
                            </button>
                            <button onClick={() => setPaymentModalOpen(true)} className="flex-1 py-3.5 rounded-xl font-bold text-background-primary bg-brand-yellow shadow-lg hover:brightness-110 active:scale-95 transition-all text-sm">
                                {t('trade_status_pay')}
                            </button>
                        </div>
                    )}

                    {/* Seller: Wait for Pay */}
                    {trade.status === TradeStatusP2P.WAITING_FOR_PAYMENT && !isBuy && (
                        <button disabled className="w-full py-3.5 rounded-xl font-bold text-text-secondary bg-background-tertiary opacity-70 cursor-not-allowed text-sm flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" /> {t('trade_status_waiting')}
                        </button>
                    )}

                    {/* Buyer: Wait for Release */}
                    {trade.status === TradeStatusP2P.PAID_CONFIRMED_BY_BUYER && isBuy && (
                        <div className="flex gap-3">
                            <button onClick={() => setAppealModalOpen(true)} className="flex-1 py-3.5 rounded-xl font-bold text-text-secondary bg-background-tertiary hover:bg-border-divider transition-colors text-sm border border-border-divider">
                                {t('appeal')}
                            </button>
                            <button disabled className="flex-[2] py-3.5 rounded-xl font-bold text-text-secondary bg-background-tertiary opacity-70 cursor-not-allowed text-sm flex items-center justify-center gap-2">
                                <Clock className="w-4 h-4" /> {t('trade_status_pending')}
                            </button>
                        </div>
                    )}

                    {/* Seller: Release */}
                    {trade.status === TradeStatusP2P.PAID_CONFIRMED_BY_BUYER && !isBuy && (
                        <div className="flex gap-3">
                            <button onClick={() => setAppealModalOpen(true)} className="flex-1 py-3.5 rounded-xl font-bold text-text-secondary bg-background-tertiary hover:bg-border-divider transition-colors text-sm border border-border-divider">
                                {t('appeal')}
                            </button>
                            <button onClick={() => setReleaseModalOpen(true)} className={`flex-[2] py-3.5 rounded-xl font-bold text-white bg-success shadow-lg hover:brightness-110 active:scale-[0.98] transition-all text-sm`}>
                                {t('trade_status_release')}
                            </button>
                        </div>
                    )}
                    
                    {/* Completed State */}
                    {trade.status === TradeStatusP2P.COMPLETED && (
                        <button onClick={() => navigate('/wallet')} className={`w-full py-3.5 rounded-xl font-bold text-background-primary bg-${primaryColor} shadow-lg transition-all active:scale-[0.98] text-sm`}>
                            {t('wallet')}
                        </button>
                    )}
                </div>
            </div>

            <ReleaseConfirmationModal isOpen={isReleaseModalOpen} onClose={() => setReleaseModalOpen(false)} onConfirm={confirmRelease} amount={trade.amount} asset={trade.offer.asset} />
            <PaymentConfirmationModal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} onConfirm={handleConfirmPayment} amount={trade.fiatAmount} currency={trade.offer.fiatCurrency} />
            <AppealModal isOpen={isAppealModalOpen} onClose={() => setAppealModalOpen(false)} onSubmit={(reason, desc) => submitAppeal(trade.id, reason, desc)} />
            <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} counterpartyName={counterpartyName || 'User'} />
        </div>
    );
};

export default TradeRoomScreen;
