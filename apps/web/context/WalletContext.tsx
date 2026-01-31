
import React, { createContext, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Wallet, Transaction, AddressBookEntry } from '../types';
import { useWalletData } from '../hooks/useWalletData';
import { useMarket } from './MarketContext';

type PriceChangeStatus = 'up' | 'down' | null;

interface WalletContextType {
    wallets: Wallet[];
    fundingWallets: Wallet[];
    transactions: Transaction[];
    addressBook: AddressBookEntry[];
    walletPriceChanges: Record<string, PriceChangeStatus>;
    isLoading: boolean;
    updateWalletBalance: (assetSymbol: string, amountChange: number, lockAmount?: number) => void;
    performTransfer: (assetSymbol: string, amount: number, fromAccount: 'Spot' | 'Funding', toAccount: 'Spot' | 'Funding') => void;
    addTransaction: (transaction: Transaction) => void;
    deleteTransaction: (id: string) => void;
    addAddressBookEntry: (entry: AddressBookEntry) => void;
    deleteAddressBookEntry: (id: string) => void;
    refreshWalletData: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const walletData = useWalletData();
    const { latestPrices } = useMarket();

    // Sync Market Data with Wallet Engine
    useEffect(() => {
        if (Object.keys(latestPrices).length > 0) {
            walletData.updateWalletValues(latestPrices);
        }
    }, [latestPrices, walletData.updateWalletValues]);

    // Optimization: Strict Memoization
    // Ensures components only re-render when specific wallet data changes
    const contextValue = useMemo(() => ({
        wallets: walletData.wallets,
        fundingWallets: walletData.fundingWallets,
        transactions: walletData.transactions,
        addressBook: walletData.addressBook,
        walletPriceChanges: walletData.walletPriceChanges,
        isLoading: walletData.isLoading,
        updateWalletBalance: walletData.updateWalletBalance,
        performTransfer: walletData.performTransfer,
        addTransaction: walletData.addTransaction,
        deleteTransaction: walletData.deleteTransaction,
        addAddressBookEntry: walletData.addAddressBookEntry,
        deleteAddressBookEntry: walletData.deleteAddressBookEntry,
        refreshWalletData: walletData.refreshWalletData
    }), [
        walletData.wallets,
        walletData.fundingWallets,
        walletData.transactions,
        walletData.addressBook,
        walletData.walletPriceChanges,
        walletData.isLoading,
        walletData.updateWalletBalance,
        walletData.performTransfer,
        walletData.addTransaction,
        walletData.deleteTransaction,
        walletData.addAddressBookEntry,
        walletData.deleteAddressBookEntry,
        walletData.refreshWalletData
    ]);

    return (
        <WalletContext.Provider value={contextValue}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = (): WalletContextType => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
