
import { useState, useEffect, useRef, useCallback } from 'react';
import { P2POffer, P2PTrade, TradeStatusP2P, ChatMessage } from '../types';
import { p2pService } from '../services';

const toNumber = (value: unknown, fallback = 0): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    if (value && typeof value === 'object' && 'toString' in value) {
        const parsed = Number((value as { toString: () => string }).toString());
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
};

const formatTime = (value?: string) => {
    const date = value ? new Date(value) : new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const mapStatus = (status?: string): TradeStatusP2P => {
    if (!status) return TradeStatusP2P.WAITING_FOR_PAYMENT;
    const normalized = status.toUpperCase();
    if (normalized === 'WAITING_PAYMENT' || normalized === 'WAITING_FOR_PAYMENT') {
        return TradeStatusP2P.WAITING_FOR_PAYMENT;
    }
    if (normalized === 'PAID' || normalized === 'PAID_CONFIRMED_BY_BUYER') {
        return TradeStatusP2P.PAID_CONFIRMED_BY_BUYER;
    }
    if (normalized === 'WAITING_FOR_RELEASE') {
        return TradeStatusP2P.WAITING_FOR_RELEASE;
    }
    if (normalized === 'COMPLETED' || normalized === 'RELEASED' || normalized === 'RESOLVED') {
        return TradeStatusP2P.COMPLETED;
    }
    if (normalized === 'CANCELLED') return TradeStatusP2P.CANCELLED;
    if (normalized === 'DISPUTED') return TradeStatusP2P.DISPUTED;
    return TradeStatusP2P.WAITING_FOR_PAYMENT;
};

export const useP2PData = (
    user: any,
    wallets: any[],
    updateWalletBalance: (symbol: string, change: number, lock: number) => void,
    addTransaction: (tx: any) => void,
    t: (key: string, params?: any) => string,
    notify: (title: string, message: string) => void
) => {
    const [p2pOffers, setP2POffers] = useState<P2POffer[]>([]);
    const [activeTrades, setActiveTrades] = useState<P2PTrade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const normalizeOffer = useCallback((offer: any): P2POffer => {
        const userData = offer?.user || {};
        return {
            id: offer.id,
            type: offer.type,
            user: {
                name: userData.name || 'User',
                rating: toNumber(userData.rating, 0),
                trades: toNumber(offer.completedTrades ?? userData.trades, 0),
                avatarUrl: userData.avatarUrl || '',
                completionRate: toNumber(userData.completionRate, 0),
                isVerifiedMerchant: Boolean(userData.isVerifiedMerchant)
            },
            userId: offer.userId || userData.id,
            isActive: offer.isActive ?? true,
            asset: offer.asset as P2POffer['asset'],
            fiatCurrency: offer.fiatCurrency as P2POffer['fiatCurrency'],
            countryCode: (offer.countryCode || 'GLOBAL') as P2POffer['countryCode'],
            price: toNumber(offer.price),
            available: toNumber(offer.available),
            minLimit: toNumber(offer.minLimit),
            maxLimit: toNumber(offer.maxLimit),
            paymentMethods: Array.isArray(offer.paymentMethods) ? offer.paymentMethods : [],
            paymentDetails: offer.paymentDetails || undefined,
            terms: offer.terms || undefined
        };
    }, []);

    const normalizeMessage = useCallback((message: any): ChatMessage => {
        const isSystem = Boolean(message.isSystem) || message.senderId === 'system' || message.sender === 'system';
        const senderId = message.senderId || message.sender;
        const sender: ChatMessage['sender'] = isSystem
            ? 'system'
            : senderId === user?.id
                ? 'me'
                : 'counterparty';

        return {
            id: message.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            sender,
            text: message.text || message.message || '',
            attachmentUrl: message.attachmentUrl,
            timestamp: formatTime(message.createdAt || message.timestamp),
            isSystem
        };
    }, [user?.id]);

    const normalizeTrade = useCallback((trade: any, fallbackTrade?: P2PTrade, fallbackOffer?: P2POffer): P2PTrade => {
        const offer = trade.offer
            ? normalizeOffer(trade.offer)
            : fallbackOffer || fallbackTrade?.offer || {
                id: trade.offerId || 'unknown',
                type: 'BUY',
                user: {
                    name: 'User',
                    rating: 0,
                    trades: 0,
                    avatarUrl: '',
                    completionRate: 0,
                    isVerifiedMerchant: false
                },
                isActive: true,
                asset: 'USDT',
                fiatCurrency: 'USD',
                countryCode: 'GLOBAL',
                price: toNumber(trade.price),
                available: toNumber(trade.amount),
                minLimit: 0,
                maxLimit: 0,
                paymentMethods: []
            };

        const buyerId = trade.buyerId || trade.buyer?.id;
        const sellerId = trade.sellerId || trade.seller?.id;
        const isMyRoleBuyer = buyerId ? buyerId === user?.id : fallbackTrade?.isMyRoleBuyer || false;

        const chatSource = Array.isArray(trade.messages)
            ? trade.messages
            : Array.isArray(trade.chatHistory)
                ? trade.chatHistory
                : [];
        const chatHistory = chatSource.length > 0
            ? chatSource.map((msg: any) => normalizeMessage(msg))
            : fallbackTrade?.chatHistory || [];

        return {
            id: trade.id,
            offer,
            status: mapStatus(trade.status),
            amount: toNumber(trade.amount),
            fiatAmount: toNumber(trade.fiatAmount),
            createdAt: trade.createdAt || fallbackTrade?.createdAt || new Date().toISOString(),
            expiresAt: trade.expiresAt || fallbackTrade?.expiresAt,
            completedAt: trade.completedAt || trade.releasedAt || trade.cancelledAt || fallbackTrade?.completedAt,
            chatHistory,
            isMyRoleBuyer,
            unreadMessages: toNumber(trade.unreadMessages, fallbackTrade?.unreadMessages || 0),
            buyerName: trade.buyer?.name || trade.buyerName || fallbackTrade?.buyerName,
            sellerName: trade.seller?.name || trade.sellerName || fallbackTrade?.sellerName,
            disputeReason: trade.disputeReason || fallbackTrade?.disputeReason
        };
    }, [normalizeMessage, normalizeOffer, user?.id]);

    // Initial Load - Fetch from Backend API
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            try {
                const [offersRes, tradesRes] = await Promise.all([
                    p2pService.getOffers(),
                    p2pService.getActiveTrades()
                ]);
                
                if (isMounted.current) {
                    if (offersRes.success && offersRes.data) {
                        const items = (offersRes.data as any).items || offersRes.data;
                        const offers = Array.isArray(items) ? items.map(normalizeOffer) : [];
                        setP2POffers(offers);
                    } else {
                        setP2POffers([]);
                    }
                    if (tradesRes.success && tradesRes.data) {
                        const tradeItems = Array.isArray(tradesRes.data)
                            ? tradesRes.data
                            : (tradesRes.data as any).items || [];
                        setActiveTrades(tradeItems.map((trade: any) => normalizeTrade(trade)));
                    } else {
                        setActiveTrades([]);
                    }
                }
            } catch {
                // Silent fail - backend may be unavailable
            } finally {
                if (isMounted.current) setIsLoading(false);
            }
        };
        init();
    }, []);

    // --- Offer Management ---

    const addP2POffer = useCallback(async (offer: P2POffer) => {
        try {
            const res = await p2pService.createOffer({
                type: offer.type,
                asset: offer.asset as 'USDT' | 'USDC' | 'BUSD',
                fiatCurrency: offer.fiatCurrency,
                price: offer.price,
                available: offer.available,
                minLimit: offer.minLimit,
                maxLimit: offer.maxLimit,
                paymentMethods: offer.paymentMethods,
                terms: offer.terms
            });
            if (res.success && res.data) {
                const createdOffer = normalizeOffer(res.data);
                setP2POffers(prev => [createdOffer, ...prev]);
            }
        } catch {
            // Silent fail
        }
    }, [normalizeOffer]);

    const updateP2POffer = useCallback((updatedOffer: P2POffer) => {
        const update = async () => {
            try {
                const res = await p2pService.updateOffer(updatedOffer.id, {
                    price: updatedOffer.price,
                    available: updatedOffer.available,
                    minLimit: updatedOffer.minLimit,
                    maxLimit: updatedOffer.maxLimit,
                    paymentMethods: updatedOffer.paymentMethods,
                    terms: updatedOffer.terms,
                    isActive: updatedOffer.isActive,
                    fiatCurrency: updatedOffer.fiatCurrency,
                    asset: updatedOffer.asset
                });
                if (res.success && res.data) {
                    const normalized = normalizeOffer(res.data);
                    setP2POffers(prev => prev.map(o => o.id === normalized.id ? normalized : o));
                }
            } catch {
                // Silent fail
            }
        };
        void update();
    }, [normalizeOffer]);

    const deleteP2POffer = useCallback(async (id: string) => {
        try {
            const res = await p2pService.deleteOffer(id);
            if (res.success) {
                setP2POffers(prev => prev.filter(o => o.id !== id));
            }
        } catch {
            // Silent fail
        }
    }, []);

    // --- Trade & Chat Management ---

    const sendP2PMessage = useCallback(async (tradeId: string, message: string, sender: 'me' | 'counterparty' | 'system', attachmentUrl?: string) => {
        if (sender !== 'me') return;
        try {
            const res = await p2pService.sendMessage({ tradeId, text: message, attachmentUrl });
            if (res.success && res.data) {
                const newMsg = normalizeMessage(res.data);
                setActiveTrades(prev => prev.map(trade => {
                    if (trade.id !== tradeId) return trade;
                    return {
                        ...trade,
                        chatHistory: [...trade.chatHistory, newMsg]
                    };
                }));
            }
        } catch {
            // Silent fail
        }
    }, [normalizeMessage]);

    const releaseP2PEscrow = useCallback(async (tradeId: string) => {
        const res = await p2pService.releaseCrypto(tradeId);
        if (!res.success || !res.data) {
            throw new Error(res.error || 'Failed to release escrow');
        }
        setActiveTrades(prev => prev.map(trade => {
            if (trade.id !== tradeId) return trade;
            return normalizeTrade(res.data, trade, trade.offer);
        }));
    }, [normalizeTrade]);

    const createP2PTrade = useCallback(async (offer: P2POffer, cryptoAmount: number): Promise<P2PTrade> => {
        const res = await p2pService.startTrade({ offerId: offer.id, amount: cryptoAmount });
        if (!res.success || !res.data) {
            throw new Error(res.error || 'Failed to start trade');
        }
        const normalized = normalizeTrade(res.data, undefined, offer);
        setActiveTrades(prev => [normalized, ...prev]);
        return normalized;
    }, [normalizeTrade]);

    const markP2PTradePaid = useCallback(async (tradeId: string) => {
        const res = await p2pService.confirmPayment(tradeId);
        if (!res.success || !res.data) {
            throw new Error(res.error || 'Failed to confirm payment');
        }
        setActiveTrades(prev => prev.map(trade => {
            if (trade.id !== tradeId) return trade;
            return normalizeTrade(res.data, trade, trade.offer);
        }));
    }, [normalizeTrade]);

    const cancelP2PTrade = useCallback(async (tradeId: string) => {
        const res = await p2pService.cancelTrade(tradeId);
        if (!res.success || !res.data) {
            throw new Error(res.error || 'Failed to cancel trade');
        }
        setActiveTrades(prev => prev.map(trade => {
            if (trade.id !== tradeId) return trade;
            return normalizeTrade(res.data, trade, trade.offer);
        }));
    }, [normalizeTrade]);

    const submitAppeal = useCallback(async (tradeId: string, reason: string, description: string) => {
        const evidence = description ? [description] : undefined;
        const res = await p2pService.openDispute(tradeId, reason, evidence);
        if (!res.success || !res.data) {
            throw new Error(res.error || 'Failed to open dispute');
        }
        setActiveTrades(prev => prev.map(trade => {
            if (trade.id !== tradeId) return trade;
            return normalizeTrade(res.data, trade, trade.offer);
        }));
    }, [normalizeTrade]);

    const resolveDispute = useCallback(async (tradeId: string, resolution: 'buyer_wins' | 'seller_wins') => {
        const res = await p2pService.resolveDispute(tradeId, resolution);
        if (!res.success || !res.data) {
            throw new Error(res.error || 'Failed to resolve dispute');
        }
        setActiveTrades(prev => prev.map(trade => {
            if (trade.id !== tradeId) return trade;
            return normalizeTrade(res.data, trade, trade.offer);
        }));
    }, [normalizeTrade]);

    return {
        p2pOffers,
        activeTrades,
        isLoading,
        addP2POffer,
        updateP2POffer,
        deleteP2POffer,
        createP2PTrade,
        sendP2PMessage,
        markP2PTradePaid,
        releaseP2PEscrow,
        cancelP2PTrade,
        submitAppeal,
        resolveDispute
    };
};
