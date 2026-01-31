
import React, { useState } from 'react';
import { Modal } from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ChevronRight, Loader2, ShieldCheck, Zap } from 'lucide-react';

// Real Brand Icons Components

const MetaMaskIcon = () => (
    <svg viewBox="0 0 32 32" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
        <path fill="#E17726" d="M29.62 13.98l-2.58-6.04-7.46 2.76 1.74-6.62-5.3 2.1-5.3-2.1 1.74 6.62-7.46-2.76-2.58 6.04 5.92 5.06-2.54 8.78 10.22-6.24 10.22 6.24-2.54-8.78 5.92-5.06z"/>
        <path fill="#E2761B" d="M29.62 13.98l-5.92 5.06 1.34 4.62-7.86-13.3-1.16-6.28 2.58 6.04zM2.38 13.98l2.58-6.04-1.16 6.28-7.86 13.3 1.34-4.62-5.92-5.06z"/>
        <path fill="#E4761B" d="M10.74 13.88l-1.34-8.7-5.3 2.1 2.94 8.24 3.7-1.64zM21.26 13.88l3.7 1.64 2.94-8.24-5.3-2.1-1.34 8.7z"/>
        <path fill="#D7C1B3" d="M13.24 15.76l-2.5-1.88-3.7 1.64 2.1 7.24 1.76-1.08 2.34-5.92zM18.76 15.76l2.34 5.92 1.76 1.08 2.1-7.24-3.7-1.64-2.5 1.88z"/>
        <path fill="#233447" d="M10.74 13.88l2.5 1.88-1.54 3.96-3.18-1.92 2.22-3.92zM21.26 13.88l-2.22 3.92-3.18 1.92-1.54-3.96 2.5-1.88z"/>
    </svg>
);

const TrustWalletIcon = () => (
    <svg viewBox="0 0 32 32" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
        <path fill="#3375BB" d="M16 2.667c-7.333 3.333-12 9.333-12 16 0 9.333 12 10.667 12 10.667s12-1.333 12-10.667c0-6.667-4.667-12.667-12-16z"/>
        <path fill="#FFF" d="M14.667 18.667l-3.333-3.333-1.333 1.333 4.667 4.667 9.333-9.333-1.333-1.333z"/>
    </svg>
);

const WalletConnectIcon = () => (
    <svg viewBox="0 0 32 32" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
        <path fill="#3B99FC" d="M10.25 8.5c3.2-3.15 8.3-3.15 11.5 0l1.5 1.5c.5.5.5 1.3 0 1.8l-1.5 1.5c-.25.25-.65.25-.9 0l-1.1-1.1c-1.9-1.9-5-1.9-6.9 0l-1.1 1.1c-.25.25-.65.25-.9 0l-1.5-1.5c-.5-.5-.5-1.3 0-1.8l1.5-1.5zM6 13.5l4.5 4.5c.25.25.65.25.9 0l4.6-4.6c.25-.25.65-.25.9 0l4.6 4.6c.25.25.65.25.9 0L26.9 13.5c.5-.5.5-1.3 0-1.8l-1.5-1.5c-.25-.25-.65-.25-.9 0l-8.5 8.5-8.5-8.5c-.25-.25-.65-.25-.9 0l-1.5 1.5c-.5.5-.5 1.3 0 1.8z"/>
    </svg>
);

const CoinbaseIcon = () => (
    <svg viewBox="0 0 32 32" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="#0052FF"/>
        <path fill="#FFF" d="M16 7c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zm0 14c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"/>
    </svg>
);

interface WalletProvider {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
}

const WALLETS: WalletProvider[] = [
    { id: 'metamask', name: 'MetaMask', icon: <MetaMaskIcon />, description: 'Connect to your MetaMask Wallet' },
    { id: 'trust', name: 'Trust Wallet', icon: <TrustWalletIcon />, description: 'Connect to your Trust Wallet' },
    { id: 'walletconnect', name: 'WalletConnect', icon: <WalletConnectIcon />, description: 'Scan with WalletConnect to connect' },
    { id: 'coinbase', name: 'Coinbase Wallet', icon: <CoinbaseIcon />, description: 'Connect to your Coinbase Wallet' },
];

interface WalletConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: (walletId: string) => Promise<void>;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ isOpen, onClose, onConnect }) => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const [connectingId, setConnectingId] = useState<string | null>(null);

    const handleConnect = async (walletId: string) => {
        setConnectingId(walletId);
        await onConnect(walletId);
        setConnectingId(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet">
            <div className="space-y-6">
                <div className="text-center px-4">
                    <p className="text-sm text-text-secondary leading-relaxed">
                        Securely connect your decentralized wallet. We never access your private keys.
                    </p>
                </div>

                <div className="space-y-3">
                    {WALLETS.map((wallet) => (
                        <button
                            key={wallet.id}
                            onClick={() => handleConnect(wallet.id)}
                            disabled={connectingId !== null}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border border-border-divider bg-background-secondary hover:bg-background-tertiary transition-all active:scale-[0.98] group ${connectingId === wallet.id ? 'border-brand-yellow ring-1 ring-brand-yellow/50' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-background-primary shadow-sm border border-border-divider/50 group-hover:scale-110 transition-transform">
                                    {wallet.icon}
                                </div>
                                <div className="text-start">
                                    <h4 className="font-bold text-text-primary text-sm">{wallet.name}</h4>
                                    <p className="text-[10px] text-text-secondary">{wallet.description}</p>
                                </div>
                            </div>
                            
                            {connectingId === wallet.id ? (
                                <Loader2 className={`w-5 h-5 animate-spin text-${primaryColor}`} />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors rtl:rotate-180" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="pt-4 border-t border-border-divider">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                            <ShieldCheck className="w-5 h-5 text-success" />
                            <span className="text-[10px] text-text-secondary font-bold uppercase">End-to-End Encrypted</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <Zap className="w-5 h-5 text-brand-yellow" />
                            <span className="text-[10px] text-text-secondary font-bold uppercase">Instant Connection</span>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-text-secondary mt-6 opacity-60">
                        By connecting, you agree to our Terms of Service.
                    </p>
                </div>
            </div>
        </Modal>
    );
};
