
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export interface Web3Asset {
    symbol: string;
    name: string;
    balance: number;
    price: number;
    change24h: number;
    network: 'Ethereum' | 'BSC' | 'Polygon' | 'Solana';
    iconUrl?: string;
    decimals: number;
    contractAddress?: string;
}

export interface NFTAsset {
    id: string;
    name: string;
    collection: string;
    imageUrl: string;
    floorPrice: number;
    description?: string;
}

export interface Web3Transaction {
    hash: string;
    type: 'send' | 'receive' | 'approve' | 'swap';
    asset: string;
    amount: number;
    to: string;
    date: string;
    status: 'success' | 'failed' | 'pending';
}

interface Web3ContextType {
    isConnected: boolean;
    walletType: string | null;
    address: string | null;
    chainId: number;
    networkName: string;
    balance: number; // Total USD balance
    assets: Web3Asset[];
    nfts: NFTAsset[];
    transactions: Web3Transaction[];
    connectWallet: (walletType?: string) => Promise<void>;
    disconnectWallet: () => void;
    sendWeb3Transaction: (symbol: string, toAddress: string, amount: number) => Promise<{ hash: string, status: 'success' | 'failed' }>;
    switchNetwork: (chainId: number) => Promise<void>;
    isLoading: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Extend Window interface for EIP-1193
declare global {
    interface Window {
        ethereum?: any;
    }
}

const MOCK_WEB3_ASSETS: Web3Asset[] = [
    { symbol: 'BNB', name: 'BNB Chain', balance: 0.05, price: 601.50, change24h: 2.1, network: 'BSC', decimals: 18 },
    { symbol: 'USDT', name: 'Tether (BEP20)', balance: 10.00, price: 1.00, change24h: 0.01, network: 'BSC', decimals: 18 },
];

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [address, setAddress] = useState<string | null>(null);
    const [walletType, setWalletType] = useState<string | null>(null);
    const [chainId, setChainId] = useState(1);
    const [networkName, setNetworkName] = useState('Ethereum');
    const [isLoading, setIsLoading] = useState(false);
    const [assets, setAssets] = useState<Web3Asset[]>([]);
    const [nfts, setNfts] = useState<NFTAsset[]>([]);
    const [transactions, setTransactions] = useState<Web3Transaction[]>([]);

    // Check for existing session or window.ethereum status
    useEffect(() => {
        const checkConnection = async () => {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    // Check if already connected
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        handleAccountsChanged(accounts);
                    }
                    
                    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
                    handleChainChanged(chainIdHex);

                    window.ethereum.on('accountsChanged', handleAccountsChanged);
                    window.ethereum.on('chainChanged', handleChainChanged);
                } catch (error) {
                    console.error("Error checking Web3 connection:", error);
                }
            }
        };
        
        checkConnection();

        return () => {
            if (window.ethereum && window.ethereum.removeListener) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);

    const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            setWalletType('metamask');
            
            // In a real production app, we would fetch balances here using ethers.js or web3.js
            // For now, we simulate fetching assets after connection to populate the UI
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500)); 
            setAssets(MOCK_WEB3_ASSETS); 
            setIsLoading(false);
        } else {
            disconnectWallet();
        }
    };

    const handleChainChanged = (chainIdHex: string) => {
        const id = parseInt(chainIdHex, 16);
        setChainId(id);
        if (id === 1) setNetworkName('Ethereum Mainnet');
        else if (id === 56) setNetworkName('BSC Mainnet');
        else if (id === 137) setNetworkName('Polygon');
        else setNetworkName(`Chain ID ${id}`);
        
        // Reload page recommended by MetaMask docs, but we'll just refresh state here for SPA feel
        // window.location.reload(); 
    };

    const connectWallet = async (type: string = 'metamask') => {
        setIsLoading(true);
        
        try {
            if (type === 'metamask' && typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                handleAccountsChanged(accounts);
            } else {
                // Fallback / Simulation for other wallet types or if Metamask not installed
                console.warn("Real wallet not found, using simulation for:", type);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Simulate a connected state for non-metamask or dev environment without ext
                setAddress("0x71C...9A23");
                setIsConnected(true);
                setAssets(MOCK_WEB3_ASSETS);
                setWalletType(type);
            }
        } catch (error: any) {
            console.error("Connection failed", error);
            if (error.code === 4001) {
                // User rejected request
                alert("Please connect to MetaMask.");
            } else {
                console.error(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const disconnectWallet = () => {
        setIsConnected(false);
        setAddress(null);
        setWalletType(null);
        setAssets([]);
        setNfts([]);
        // Note: You can't programmatically disconnect MetaMask from the dApp side purely via JS API
    };

    const switchNetwork = async (newChainId: number) => {
        if (!window.ethereum) return;
        const chainIdHex = `0x${newChainId.toString(16)}`;
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }],
            });
        } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                // Chain needs to be added - wallet_addEthereumChain
            }
        }
    };

    const sendWeb3Transaction = async (symbol: string, toAddress: string, amount: number) => {
        setIsLoading(true);
        
        try {
            if (window.ethereum && isConnected && address) {
                // Determine value in Wei (assuming 18 decimals for simplicity in this hybrid app)
                // In production, use ethers.utils.parseUnits(amount.toString(), decimals)
                const valueInWei = (amount * 1000000000000000000).toString(16); // Hex string

                const params = [{
                  from: address,
                  to: toAddress,
                  value: `0x${valueInWei}` // hex encoded value
                }];

                const txHash = await window.ethereum.request({ 
                    method: 'eth_sendTransaction', 
                    params 
                });
                
                return { hash: txHash, status: 'success' as const };
            } else {
                // Simulation fallback
                await new Promise(resolve => setTimeout(resolve, 2000));
                const hash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
                return { hash, status: 'success' as const };
            }

        } catch (e: any) {
            console.error("Transaction Error:", e);
            return { hash: "", status: 'failed' as const };
        } finally {
            setIsLoading(false);
        }
    };

    const totalBalance = assets.reduce((acc, curr) => acc + (curr.balance * curr.price), 0);

    const value = {
        isConnected,
        walletType,
        address,
        chainId,
        networkName,
        balance: totalBalance,
        assets,
        nfts,
        transactions,
        connectWallet,
        disconnectWallet,
        sendWeb3Transaction,
        switchNetwork,
        isLoading
    };

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = (): Web3ContextType => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
};
