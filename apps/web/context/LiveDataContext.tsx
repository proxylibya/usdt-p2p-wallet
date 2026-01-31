
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useMarket } from './MarketContext';
import { useWallet } from './WalletContext';
import { useP2P } from './P2PContext';

// This context aggregates data for legacy consumers.
// Performance Note: In a high-scale app, components should subscribe to the specific 
// context (e.g., useMarket) they need, rather than this aggregate, to avoid 
// coarse-grained re-renders.

interface LiveDataContextType {
    // Market Data
    marketCoins: ReturnType<typeof useMarket>['marketCoins'];
    marketCoinPriceChanges: ReturnType<typeof useMarket>['marketCoinPriceChanges'];
    latestPrices: ReturnType<typeof useMarket>['latestPrices'];
    
    // Wallet Data
    wallets: ReturnType<typeof useWallet>['wallets'];
    fundingWallets: ReturnType<typeof useWallet>['fundingWallets'];
    transactions: ReturnType<typeof useWallet>['transactions'];
    addressBook: ReturnType<typeof useWallet>['addressBook'];
    walletPriceChanges: ReturnType<typeof useWallet>['walletPriceChanges'];
    updateWalletBalance: ReturnType<typeof useWallet>['updateWalletBalance'];
    performTransfer: ReturnType<typeof useWallet>['performTransfer'];
    addTransaction: ReturnType<typeof useWallet>['addTransaction'];
    deleteTransaction: ReturnType<typeof useWallet>['deleteTransaction'];
    addAddressBookEntry: ReturnType<typeof useWallet>['addAddressBookEntry'];
    deleteAddressBookEntry: ReturnType<typeof useWallet>['deleteAddressBookEntry'];

    // P2P Data
    p2pOffers: ReturnType<typeof useP2P>['p2pOffers'];
    activeTrades: ReturnType<typeof useP2P>['activeTrades'];
    addP2POffer: ReturnType<typeof useP2P>['addP2POffer'];
    updateP2POffer: ReturnType<typeof useP2P>['updateP2POffer'];
    deleteP2POffer: ReturnType<typeof useP2P>['deleteP2POffer'];
    createP2PTrade: ReturnType<typeof useP2P>['createP2PTrade'];
    sendP2PMessage: ReturnType<typeof useP2P>['sendP2PMessage'];
    markP2PTradePaid: ReturnType<typeof useP2P>['markP2PTradePaid'];
    releaseP2PEscrow: ReturnType<typeof useP2P>['releaseP2PEscrow'];
    cancelP2PTrade: ReturnType<typeof useP2P>['cancelP2PTrade'];

    // General
    isLoading: boolean;
    refreshData: () => Promise<void>;
}

const LiveDataContext = createContext<LiveDataContextType | undefined>(undefined);

export const LiveDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const market = useMarket();
    const wallet = useWallet();
    const p2p = useP2P();

    // Critical Performance Optimization:
    // We break apart the dependency array. We only create a new object if the underlying
    // data *actually* changes (reference equality).
    
    const combinedContext = useMemo((): LiveDataContextType => {
        return {
            // Market
            marketCoins: market.marketCoins,
            marketCoinPriceChanges: market.marketCoinPriceChanges,
            latestPrices: market.latestPrices,
            
            // Wallet
            wallets: wallet.wallets,
            fundingWallets: wallet.fundingWallets,
            transactions: wallet.transactions,
            addressBook: wallet.addressBook,
            walletPriceChanges: wallet.walletPriceChanges,
            updateWalletBalance: wallet.updateWalletBalance,
            performTransfer: wallet.performTransfer,
            addTransaction: wallet.addTransaction,
            deleteTransaction: wallet.deleteTransaction,
            addAddressBookEntry: wallet.addAddressBookEntry,
            deleteAddressBookEntry: wallet.deleteAddressBookEntry,

            // P2P
            p2pOffers: p2p.p2pOffers,
            activeTrades: p2p.activeTrades,
            addP2POffer: p2p.addP2POffer,
            updateP2POffer: p2p.updateP2POffer,
            deleteP2POffer: p2p.deleteP2POffer,
            createP2PTrade: p2p.createP2PTrade,
            sendP2PMessage: p2p.sendP2PMessage,
            markP2PTradePaid: p2p.markP2PTradePaid,
            releaseP2PEscrow: p2p.releaseP2PEscrow,
            cancelP2PTrade: p2p.cancelP2PTrade,

            // General
            isLoading: market.isLoading || wallet.isLoading || p2p.isLoading,
            refreshData: async () => {
                await market.refreshMarketData();
            }
        };
    }, [
        // Only trigger update if these specific values change
        market.marketCoins, 
        market.marketCoinPriceChanges, 
        market.latestPrices,
        market.isLoading,

        wallet.wallets, 
        wallet.fundingWallets, 
        wallet.transactions, 
        wallet.addressBook,
        wallet.walletPriceChanges,
        wallet.isLoading,
        
        p2p.p2pOffers, 
        p2p.activeTrades,
        p2p.isLoading,
        
        // Functions are usually stable via useCallback in their respective hooks,
        // but we include them to satisfy the hook linter and ensure correctness if they change.
        wallet.updateWalletBalance,
        wallet.performTransfer,
        wallet.addTransaction,
        wallet.deleteTransaction,
        wallet.addAddressBookEntry,
        wallet.deleteAddressBookEntry,
        p2p.addP2POffer,
        p2p.updateP2POffer,
        p2p.deleteP2POffer,
        p2p.createP2PTrade,
        p2p.sendP2PMessage,
        p2p.markP2PTradePaid,
        p2p.releaseP2PEscrow,
        p2p.cancelP2PTrade,
        market.refreshMarketData
    ]);

    return (
        <LiveDataContext.Provider value={combinedContext}>
            {children}
        </LiveDataContext.Provider>
    );
};

export const useLiveData = (): LiveDataContextType => {
    const context = useContext(LiveDataContext);
    if (!context) {
        throw new Error('useLiveData must be used within a LiveDataProvider');
    }
    return context;
};
