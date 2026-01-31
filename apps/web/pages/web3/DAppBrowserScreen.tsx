
import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/PageLayout';
import { Search, Globe, ChevronRight, Zap, ExternalLink, ChevronLeft, RotateCcw, Home, X, Wallet } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useWeb3 } from '../../context/Web3Context';

interface DApp {
    id: string;
    name: string;
    url: string;
    icon: string;
    category: string;
    description: string;
}

const POPULAR_DAPPS: DApp[] = [
    { id: '1', name: 'Uniswap', url: 'https://app.uniswap.org', category: 'DeFi', icon: '🦄', description: 'Swap, earn, and build on the leading decentralized crypto trading protocol.' },
    { id: '2', name: 'PancakeSwap', url: 'https://pancakeswap.finance', category: 'DeFi', icon: '🥞', description: 'The #1 AMM and yield farm on BNB Smart Chain.' },
    { id: '3', name: 'OpenSea', url: 'https://opensea.io', category: 'NFT', icon: '🌊', description: 'The world\'s first and largest web3 marketplace for NFTs and crypto collectibles.' },
    { id: '4', name: 'Aave', url: 'https://app.aave.com', category: 'Lending', icon: '👻', description: 'Open Source Protocol to create Non-Custodial Liquidity Markets.' },
    { id: '5', name: 'Axie Infinity', url: 'https://axieinfinity.com', category: 'Gaming', icon: '👾', description: 'Battle, collect, and trade cute digital pets.' },
    { id: '6', name: 'Curve', url: 'https://curve.fi', category: 'DeFi', icon: '🌈', description: 'Deep on-chain liquidity using advanced bonding curves.' }
];

const DAppBrowserScreen: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { addNotification } = useNotifications();
    const { address } = useWeb3();
    const [urlInput, setUrlInput] = useState('');
    
    // Browser State
    const [currentUrl, setCurrentUrl] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isLoadingPage, setIsLoadingPage] = useState(false);
    const [isConnectedToSite, setIsConnectedToSite] = useState(false);

    const filteredDApps = POPULAR_DAPPS.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const navigateTo = (url: string) => {
        setIsLoadingPage(true);
        setUrlInput(url);
        
        // Add to history if new
        if (historyIndex === -1 || history[historyIndex] !== url) {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(url);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
        
        setCurrentUrl(url);
        setIsConnectedToSite(false); // Reset connection for new site

        // Simulate page load
        setTimeout(() => {
            setIsLoadingPage(false);
        }, 1500);
    };

    const handleBack = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setCurrentUrl(history[historyIndex - 1]);
            setUrlInput(history[historyIndex - 1]);
        }
    };

    const handleForward = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setCurrentUrl(history[historyIndex + 1]);
            setUrlInput(history[historyIndex + 1]);
        }
    };

    const handleRefresh = () => {
        setIsLoadingPage(true);
        setTimeout(() => setIsLoadingPage(false), 1000);
    };

    const handleHome = () => {
        setCurrentUrl(null);
        setUrlInput('');
        setHistoryIndex(-1);
        setHistory([]);
    };

    const handleGo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlInput) return;
        let finalUrl = urlInput;
        if (!urlInput.startsWith('http')) finalUrl = 'https://' + urlInput;
        navigateTo(finalUrl);
    };

    const connectToSite = () => {
        setIsConnectedToSite(true);
        addNotification({ icon: 'success', title: 'Connected', message: `Wallet connected to ${new URL(currentUrl!).hostname}` });
    };

    return (
        <PageLayout title="DApp Browser" noPadding>
            <div className="flex flex-col h-full bg-background-primary">
                {/* Search Bar / Address Bar */}
                <div className="p-3 bg-background-secondary border-b border-border-divider">
                    <form onSubmit={handleGo} className="relative flex items-center gap-2">
                        <div className="relative flex-grow">
                            <Globe className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                            <input
                                type="text"
                                placeholder="Search or enter URL"
                                value={urlInput || searchTerm}
                                onChange={(e) => {
                                    if (currentUrl) setUrlInput(e.target.value);
                                    else setSearchTerm(e.target.value);
                                }}
                                className="w-full bg-background-tertiary border border-border-divider rounded-xl py-2.5 ps-9 pe-10 focus:outline-none focus:border-brand-yellow text-text-primary text-sm font-medium"
                            />
                            {currentUrl && isLoadingPage ? (
                                <div className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                currentUrl && <button type="button" onClick={handleHome} className="absolute end-3 top-1/2 -translate-y-1/2 p-0.5 bg-background-secondary rounded-full"><X className="w-3 h-3 text-text-secondary" /></button>
                            )}
                        </div>
                    </form>
                    
                    {isLoadingPage && (
                        <div className="h-0.5 bg-background-tertiary w-full mt-2 overflow-hidden rounded-full">
                            <div className="h-full bg-brand-yellow w-1/2 animate-[shimmer_1s_infinite]"></div>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-grow overflow-y-auto relative bg-white">
                    {currentUrl ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-800">
                            {/* Simulated Browser View */}
                            <div className="text-center p-8">
                                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-sm border border-gray-300">
                                    🌐
                                </div>
                                <h2 className="text-2xl font-bold mb-2">{new URL(currentUrl).hostname}</h2>
                                <p className="text-gray-500 mb-8">DApp Interface Simulation</p>
                                
                                {!isConnectedToSite ? (
                                    <button 
                                        onClick={connectToSite}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg active:scale-95"
                                    >
                                        Connect Wallet
                                    </button>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 animate-fadeIn">
                                        <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full border border-green-200 font-medium">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            Connected: {address?.substring(0, 6)}...
                                        </div>
                                        <p className="text-xs text-gray-400">You can now interact with this DApp</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Home / DApp Store View (Dark Mode)
                        <div className="p-4 space-y-6 bg-background-primary min-h-full">
                            {/* Favorites / History Placeholder */}
                            <div>
                                <h3 className="text-xs font-bold text-text-secondary uppercase mb-3 flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-brand-yellow" /> Popular
                                </h3>
                                <div className="grid grid-cols-4 gap-4">
                                    {POPULAR_DAPPS.slice(0, 4).map(dapp => (
                                        <button key={dapp.id} onClick={() => navigateTo(dapp.url)} className="flex flex-col items-center gap-2 group">
                                            <div className="w-14 h-14 rounded-2xl bg-background-secondary border border-border-divider flex items-center justify-center text-2xl shadow-sm group-hover:border-brand-yellow/50 transition-colors">
                                                {dapp.icon}
                                            </div>
                                            <span className="text-[10px] font-medium text-text-primary truncate w-full text-center">{dapp.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <h3 className="text-xs font-bold text-text-secondary uppercase mb-3">Explore</h3>
                                <div className="space-y-3">
                                    {filteredDApps.map(dapp => (
                                        <div key={dapp.id} onClick={() => navigateTo(dapp.url)} className="flex items-center gap-4 p-4 bg-background-secondary rounded-xl border border-border-divider hover:bg-background-tertiary transition-colors cursor-pointer active:scale-[0.99]">
                                            <div className="w-12 h-12 rounded-full bg-background-primary flex items-center justify-center text-2xl border border-border-divider">
                                                {dapp.icon}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className="font-bold text-text-primary text-sm">{dapp.name}</h4>
                                                    <span className="text-[10px] bg-background-tertiary px-1.5 py-0.5 rounded text-text-secondary border border-border-divider">{dapp.category}</span>
                                                </div>
                                                <p className="text-xs text-text-secondary truncate">{dapp.description}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-text-secondary rtl:rotate-180" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Navigation Toolbar */}
                <div className="p-3 bg-background-secondary border-t border-border-divider flex justify-between items-center px-6 pb-safe">
                    <button 
                        onClick={handleBack} 
                        disabled={historyIndex <= 0}
                        className={`p-2 rounded-full transition-colors ${historyIndex > 0 ? 'text-text-primary hover:bg-background-tertiary' : 'text-text-secondary/30 cursor-not-allowed'}`}
                    >
                        <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
                    </button>
                    
                    <button 
                        onClick={handleForward}
                        disabled={historyIndex >= history.length - 1}
                        className={`p-2 rounded-full transition-colors ${historyIndex < history.length - 1 ? 'text-text-primary hover:bg-background-tertiary' : 'text-text-secondary/30 cursor-not-allowed'}`}
                    >
                        <ChevronRight className="w-6 h-6 rtl:rotate-180" />
                    </button>

                    <div className="w-px h-6 bg-border-divider"></div>

                    <button 
                        onClick={handleRefresh}
                        className="p-2 rounded-full hover:bg-background-tertiary text-text-primary transition-colors"
                    >
                        <RotateCcw className={`w-5 h-5 ${isLoadingPage ? 'animate-spin' : ''}`} />
                    </button>

                    <button 
                        onClick={handleHome}
                        className="p-2 rounded-full hover:bg-background-tertiary text-text-primary transition-colors"
                    >
                        <Home className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </PageLayout>
    );
};

export default DAppBrowserScreen;
