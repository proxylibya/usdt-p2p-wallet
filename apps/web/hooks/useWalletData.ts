import { useState, useEffect, useRef, useCallback } from 'react';
import { Wallet, Transaction, AddressBookEntry, TransactionType } from '../types';
import { walletService } from '../services';

const STORAGE_KEYS = {
    ADDRESS_BOOK: 'usdt_wallet_address_book',
};

// --- Enterprise-Grade Safe Math Helper ---
// Eliminates IEEE 754 floating point errors (e.g. 0.1 + 0.2 = 0.300000004)
const safeFloat = (num: number, precision = 8) => {
    // Handle extremely small numbers or scientific notation better
    if (Math.abs(num) < 1e-9) return 0;
    const factor = Math.pow(10, precision);
    return Math.round((num + Number.EPSILON) * factor) / factor;
};

const ASSET_NAME_MAP: Record<string, string> = {
    USDT: 'Tether',
    USDC: 'USD Coin',
    BUSD: 'Binance USD',
    DAI: 'DAI',
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
};

const formatDateTime = (value?: string | Date | null) => {
    if (!value) return new Date().toISOString().slice(0, 16).replace('T', ' ');
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString().slice(0, 16).replace('T', ' ');
};

const mapWallet = (wallet: any): Wallet => {
    const asset = wallet?.asset || wallet?.symbol || 'USDT';
    return {
        id: wallet.id,
        name: ASSET_NAME_MAP[asset] || asset,
        symbol: asset,
        network: (wallet.network || 'TRC20') as Wallet['network'],
        address: wallet.address || undefined,
        balance: safeFloat(Number(wallet.balance || 0)),
        lockedBalance: safeFloat(Number(wallet.lockedBalance || 0)),
        usdValue: safeFloat(Number(wallet.usdValue || 0), 2),
        change24h: Number(wallet.change24h || 0),
    };
};

const mapTransactionStatus = (status?: string): Transaction['status'] => {
    switch (status) {
        case 'COMPLETED':
            return 'Completed';
        case 'FAILED':
        case 'CANCELLED':
            return 'Failed';
        case 'PENDING':
        case 'PROCESSING':
        default:
            return 'Pending';
    }
};

const mapTransactionType = (type?: string): TransactionType => {
    switch (type) {
        case 'DEPOSIT':
            return TransactionType.DEPOSIT;
        case 'WITHDRAW':
            return TransactionType.WITHDRAW;
        case 'TRANSFER_IN':
        case 'TRANSFER_OUT':
            return TransactionType.TRANSFER;
        case 'P2P_BUY':
            return TransactionType.P2P_BUY;
        case 'P2P_SELL':
            return TransactionType.P2P_SELL;
        case 'SWAP_IN':
            return TransactionType.SWAP_IN;
        case 'SWAP_OUT':
            return TransactionType.SWAP_OUT;
        case 'ESCROW_LOCK':
            return TransactionType.LOCK;
        case 'ESCROW_RELEASE':
        case 'ESCROW_REFUND':
            return TransactionType.UNLOCK;
        default:
            return TransactionType.TRANSFER;
    }
};

const mapTransaction = (transaction: any): Transaction => {
    const amount = Number(transaction.amount || 0);
    const outflowTypes = new Set(['WITHDRAW', 'TRANSFER_OUT', 'P2P_SELL', 'SWAP_OUT', 'ESCROW_LOCK']);
    const signedAmount = outflowTypes.has(transaction.type) ? -amount : amount;

    return {
        id: transaction.id,
        type: mapTransactionType(transaction.type),
        asset: transaction.asset || 'USDT',
        amount: safeFloat(signedAmount),
        usdValue: safeFloat(signedAmount, 2),
        date: formatDateTime(transaction.completedAt || transaction.createdAt),
        status: mapTransactionStatus(transaction.status),
        network: transaction.network || undefined,
        txId: transaction.txHash || undefined,
        fromAddress: transaction.fromAddress || undefined,
        toAddress: transaction.toAddress || undefined,
        networkFee: Number(transaction.fee || 0),
    };
};

// Generic loader with error handling
const loadFromStorage = <T,>(key: string, initial: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : initial;
    } catch {
        return initial;
    }
};

type PriceChangeStatus = 'up' | 'down' | null;

export const useWalletData = () => {
    // === State Management ===
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [fundingWallets, setFundingWallets] = useState<Wallet[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [addressBook, setAddressBook] = useState<AddressBookEntry[]>(() => loadFromStorage(STORAGE_KEYS.ADDRESS_BOOK, []));
    
    // Transient UI State (Not persisted)
    const [walletPriceChanges, setWalletPriceChanges] = useState<Record<string, PriceChangeStatus>>({});
    const [isLoading, setIsLoading] = useState(true);
    
    const isMounted = useRef(true);
    const persistenceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const refreshWalletData = useCallback(async () => {
        setIsLoading(true);

        try {
            const [walletsRes, fundingRes, txRes] = await Promise.all([
                walletService.getWallets(),
                walletService.getFundingWallets(),
                walletService.getTransactions(),
            ]);

            if (isMounted.current) {
                if (walletsRes.success && walletsRes.data) {
                    setWallets(walletsRes.data.map(mapWallet));
                }
                if (fundingRes.success && fundingRes.data) {
                    setFundingWallets(fundingRes.data.map(mapWallet));
                }
                if (txRes.success && txRes.data) {
                    const items = Array.isArray(txRes.data) ? txRes.data : txRes.data.items || [];
                    setTransactions(items.map(mapTransaction));
                }
            }
        } catch (e) {
            // Backend error - show empty state
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, []);

    // 1. Initial Data Fetch from Backend
    useEffect(() => {
        refreshWalletData();
    }, [refreshWalletData]);

    // 2. Persist Address Book Only
    useEffect(() => {
        if (isLoading) return;

        if (persistenceTimeout.current) clearTimeout(persistenceTimeout.current);
        
        persistenceTimeout.current = setTimeout(() => {
            localStorage.setItem(STORAGE_KEYS.ADDRESS_BOOK, JSON.stringify(addressBook));
        }, 1000);

        return () => {
            if (persistenceTimeout.current) clearTimeout(persistenceTimeout.current);
        };
    }, [addressBook, isLoading]);

    // 3. High-Performance Market Sync
    // Updates USD values based on live market prices without unnecessary re-renders
    const updateWalletValues = useCallback((prices: Record<string, { price: number, change: number }>) => {
        const updateFn = (prevWallets: Wallet[]) => {
            let hasChanges = false;
            const updated = prevWallets.map(w => {
                const newData = prices[w.symbol];
                if (!newData) return w;
                
                const totalHolding = safeFloat(w.balance + (w.lockedBalance || 0));
                const newUsdValue = safeFloat(totalHolding * newData.price, 2);
                
                // Only update if value changed significantly (> 1 cent)
                if (Math.abs(newUsdValue - w.usdValue) > 0.01 || w.change24h !== newData.change) {
                    hasChanges = true;
                    return { ...w, usdValue: newUsdValue, change24h: newData.change };
                }
                return w;
            });
            return hasChanges ? updated : prevWallets;
        };

        setWallets(prev => {
            const nextWallets = updateFn(prev);
            // Detect price direction for UI flash effect
            if (nextWallets !== prev) {
                const newChanges: Record<string, PriceChangeStatus> = {};
                nextWallets.forEach((w, i) => {
                    if (Math.abs(w.usdValue - prev[i].usdValue) > 0.01) {
                        newChanges[w.id] = w.usdValue > prev[i].usdValue ? 'up' : 'down';
                    }
                });
                
                if (Object.keys(newChanges).length > 0) {
                    setWalletPriceChanges(curr => ({ ...curr, ...newChanges }));
                    setTimeout(() => {
                        if (isMounted.current) {
                            setWalletPriceChanges(curr => {
                                const next = { ...curr };
                                Object.keys(newChanges).forEach(k => delete next[k]);
                                return next;
                            });
                        }
                    }, 2000);
                }
            }
            return nextWallets;
        });

        setFundingWallets(prev => updateFn(prev));
    }, []);

    // 4. Atomic Balance Update
    // Optimistic update for immediate UI feedback
    const updateWalletBalance = useCallback((assetSymbol: string, amountChange: number, lockAmount: number = 0) => {
        setWallets(prev => {
            const walletIndex = prev.findIndex(w => w.symbol === assetSymbol);
            
            if (walletIndex > -1) {
                const newWallets = [...prev];
                const w = newWallets[walletIndex];
                
                const newBalance = Math.max(0, safeFloat(w.balance + amountChange));
                const newLocked = Math.max(0, safeFloat((w.lockedBalance || 0) + lockAmount));
                
                // Estimate new USD value based on current rate derived from existing value
                const rate = w.balance > 0 ? w.usdValue / w.balance : (w.usdValue > 0 ? w.usdValue : 1);
                const newUsdValue = safeFloat((newBalance + newLocked) * rate, 2);

                newWallets[walletIndex] = { 
                    ...w, 
                    balance: newBalance, 
                    lockedBalance: newLocked,
                    usdValue: newUsdValue 
                };
                return newWallets;
            } else if (amountChange > 0) {
                // Handle new asset deposit
                const newWallet: Wallet = {
                    id: `wallet-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name: ASSET_NAME_MAP[assetSymbol] || assetSymbol,
                    symbol: assetSymbol as any,
                    network: 'ERC20',
                    balance: safeFloat(amountChange),
                    lockedBalance: safeFloat(lockAmount),
                    usdValue: 0, // Will update on next market tick
                    change24h: 0
                };
                return [...prev, newWallet];
            }
            return prev;
        });
    }, []);

    // 5. Robust Internal Transfer Logic
    const performTransfer = useCallback(async (assetSymbol: string, amount: number, fromAccount: 'Spot' | 'Funding', toAccount: 'Spot' | 'Funding') => {
        if (fromAccount === toAccount) return false;

        const response = await walletService.transfer({ asset: assetSymbol, amount, fromAccount, toAccount });
        if (!response.success) return false;

        // Logic to execute transfer on a list of wallets
        const processList = (list: Wallet[], isSource: boolean) => {
            const idx = list.findIndex(w => w.symbol === assetSymbol);
            if (idx === -1 && isSource) return list; // Error state

            const newList = [...list];
            
            if (idx > -1) {
                const w = newList[idx];
                const newBal = isSource 
                    ? Math.max(0, safeFloat(w.balance - amount))
                    : safeFloat(w.balance + amount);
                
                const rate = w.balance > 0 ? w.usdValue / w.balance : 1;
                newList[idx] = { 
                    ...w, 
                    balance: newBal,
                    usdValue: safeFloat(newBal * rate, 2)
                };
            } else if (!isSource) {
                // Receiving into a wallet that doesn't have this asset yet
                // Need to find asset details from source or constants. 
                // For simplicity, we create a basic entry.
                newList.push({
                    id: `fund-${Date.now()}`,
                    name: ASSET_NAME_MAP[assetSymbol] || assetSymbol,
                    symbol: assetSymbol as any,
                    network: 'ERC20',
                    balance: safeFloat(amount),
                    lockedBalance: 0,
                    usdValue: 0, // Will sync
                    change24h: 0
                });
            }
            return newList;
        };

        if (fromAccount === 'Spot') {
            setWallets(prev => processList(prev, true));
            setFundingWallets(prev => processList(prev, false));
        } else {
            setFundingWallets(prev => processList(prev, true));
            setWallets(prev => processList(prev, false));
        }
        return true;
    }, []);

    const addTransaction = useCallback((transaction: Transaction) => {
        setTransactions(prev => [transaction, ...prev]);
    }, []);

    const deleteTransaction = useCallback((id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    }, []);

    const addAddressBookEntry = useCallback((entry: AddressBookEntry) => {
        setAddressBook(prev => [...prev, entry]);
    }, []);

    const deleteAddressBookEntry = useCallback((id: string) => {
        setAddressBook(prev => prev.filter(item => item.id !== id));
    }, []);

    return {
        wallets,
        fundingWallets,
        transactions,
        addressBook,
        walletPriceChanges,
        isLoading,
        updateWalletBalance,
        updateWalletValues,
        performTransfer,
        addTransaction,
        deleteTransaction,
        addAddressBookEntry,
        deleteAddressBookEntry,
        refreshWalletData
    };
};
