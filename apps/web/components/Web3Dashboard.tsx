
import React, { useState } from 'react';
import { useWeb3, Web3Asset, NFTAsset } from '../context/Web3Context';
import { Copy, Plus, Send, ArrowDownToLine, Globe, Layers, ShieldCheck, Wallet, RefreshCw, History, CheckCircle, X, ChevronDown, Scan, LogOut, Grid, Image as ImageIcon, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { EthIcon, BtcIcon, UsdtIcon } from './icons/CryptoIcons';
import { Modal } from './Modal';
import { WalletConnectModal } from './WalletConnectModal';
import { QRCodeSVG } from 'qrcode.react'; 
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { SelectField } from './SelectField';
import { SelectModal } from './SelectModal';

const AssetIcon = ({ symbol }: { symbol: string }) => {
    switch(symbol) {
        case 'ETH': return <EthIcon className="w-10 h-10" />;
        case 'BTC': return <BtcIcon className="w-10 h-10" />;
        case 'USDT': return <UsdtIcon className="w-10 h-10" />;
        case 'BNB': return <div className="w-10 h-10 rounded-full bg-[#F0B90B] flex items-center justify-center text-white font-bold text-lg">B</div>;
        case 'MATIC': return <div className="w-10 h-10 rounded-full bg-[#8247E5] flex items-center justify-center text-white font-bold text-lg">M</div>;
        case 'CAKE': return <div className="w-10 h-10 rounded-full bg-[#D1884F] flex items-center justify-center text-white font-bold text-lg">C</div>;
        case 'SOL': return <div className="w-10 h-10 rounded-full bg-[#14F195] flex items-center justify-center text-black font-bold text-lg">S</div>;
        default: return <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-xs">{symbol.substring(0,3)}</div>;
    }
};

export const Web3Dashboard: React.FC = () => {
    const { isConnected, address, balance, assets, nfts, connectWallet, walletType, transactions, sendWeb3Transaction, disconnectWallet, networkName } = useWeb3();
    const { addNotification } = useNotifications();
    const navigate = useNavigate();

    // View State
    const [currentView, setCurrentView] = useState<'dashboard' | 'history'>('dashboard');

    // Modal States
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const [isSendOpen, setIsSendOpen] = useState(false);
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'tokens' | 'nfts'>('tokens');
    const [selectedNft, setSelectedNft] = useState<NFTAsset | null>(null);
    
    // Send Logic State
    const [selectedAsset, setSelectedAsset] = useState<Web3Asset | null>(null);
    const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);

    React.useEffect(() => {
        if (assets.length > 0 && !selectedAsset) {
            setSelectedAsset(assets[0]);
        }
    }, [assets]);

    const handleCopyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            addNotification({ icon: 'success', title: 'Copied', message: 'Address copied to clipboard' });
        }
    };

    const handleMax = () => {
        if (selectedAsset) {
            setAmount(selectedAsset.balance.toString());
        }
    };

    const handleSend = async () => {
        if (!selectedAsset || !amount || !recipient) return;
        
        const numAmount = parseFloat(amount);
        if (numAmount > selectedAsset.balance) {
            addNotification({ icon: 'error', title: 'Error', message: 'Insufficient balance' });
            return;
        }

        setIsSending(true);
        try {
            const result = await sendWeb3Transaction(selectedAsset.symbol, recipient, numAmount);
            if (result.status === 'success') {
                setTxHash(result.hash);
                addNotification({ icon: 'success', title: 'Transaction Sent', message: 'Transaction submitted successfully' });
            } else {
                addNotification({ icon: 'error', title: 'Error', message: 'Transaction failed' });
            }
        } catch {
            addNotification({ icon: 'error', title: 'Error', message: 'Transaction failed' });
        } finally {
            setIsSending(false);
        }
    };

    const closeSendModal = () => {
        setIsSendOpen(false);
        setTxHash(null);
        setAmount('');
        setRecipient('');
    };

    if (!isConnected) {
        return (
            <>
                <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fadeIn pb-32">
                    <div className="w-40 h-40 mb-8 relative">
                        <div className="absolute inset-0 bg-[#F0B90B]/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="relative z-10 w-full h-full bg-gradient-to-tr from-[#1E2026] to-[#2B3139] rounded-[2rem] border border-[#F0B90B]/20 flex items-center justify-center shadow-2xl rotate-3 transform transition-transform hover:rotate-0">
                            <Wallet className="w-20 h-20 text-[#F0B90B]" />
                        </div>
                    </div>
                    
                    <h1 className="text-3xl font-black text-[#FEFEFE] mb-3">UbinPay Web3</h1>
                    <p className="text-[#848E9C] mb-10 max-w-xs leading-relaxed text-sm">
                        Discover the decentralized world. Your keys, your assets. Secure and seamless DeFi access.
                    </p>

                    <button 
                        onClick={() => setIsConnectModalOpen(true)}
                        className="w-full max-w-xs py-4 rounded-xl font-bold text-black bg-[#F0B90B] shadow-[0_4px_20px_rgba(240,185,11,0.3)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        Connect Wallet
                    </button>
                    
                    <div className="mt-8 flex items-center justify-center gap-4 text-[10px] text-[#848E9C] uppercase font-bold tracking-wider">
                        <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-[#0ECB81]" /> MPC Technology</span>
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3 text-[#F0B90B]" /> Multi-Chain</span>
                    </div>
                </div>
                
                <WalletConnectModal 
                    isOpen={isConnectModalOpen} 
                    onClose={() => setIsConnectModalOpen(false)}
                    onConnect={connectWallet}
                />
            </>
        );
    }

    const walletName = walletType ? (walletType.charAt(0).toUpperCase() + walletType.slice(1)) : 'Web3';

    return (
        <div className="animate-fadeIn pb-32">
            {/* Header Card */}
            <div className="m-4 p-6 rounded-3xl bg-gradient-to-br from-[#1E2026] via-[#1E2026] to-[#0B0E11] border border-[#2B3139] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 end-0 w-64 h-64 bg-[#F0B90B]/5 rounded-full blur-[80px] -me-20 -mt-20 pointer-events-none group-hover:bg-[#F0B90B]/10 transition-colors duration-700"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={handleCopyAddress} className="flex items-center gap-2 bg-[#2B3139]/50 px-3 py-1.5 rounded-full border border-[#F0B90B]/20 backdrop-blur-sm active:scale-95 transition-transform">
                            <div className="w-2 h-2 rounded-full bg-[#0ECB81] animate-pulse"></div>
                            <span className="text-xs font-mono text-[#F0B90B] font-bold">{address?.substring(0, 6)}...{address?.substring(address.length - 4)}</span>
                            <Copy className="w-3 h-3 text-[#848E9C]" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="px-2 py-1 rounded bg-[#2B3139] border border-[#2B3139] text-[10px] font-bold text-[#848E9C] flex items-center gap-1">
                                <Globe className="w-3 h-3" /> {networkName}
                            </div>
                            <button onClick={disconnectWallet} className="p-2 rounded-full bg-[#2B3139] text-[#F6465D] hover:bg-[#F6465D]/10 border border-transparent hover:border-[#F6465D]/20 transition-colors" title="Disconnect">
                                <LogOut className="w-5 h-5 rtl:rotate-180" />
                            </button>
                        </div>
                    </div>

                    <div className="mb-8 text-center">
                        <p className="text-[#848E9C] text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
                            Total Asset Value <span className="bg-[#2B3139] text-[9px] px-1.5 py-0.5 rounded text-[#848E9C]">{walletName}</span>
                        </p>
                        <h1 className="text-4xl font-black text-[#FEFEFE] tracking-tight font-mono">
                            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h1>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <button onClick={() => setIsSendOpen(true)} className="flex flex-col items-center gap-2 group/btn">
                            <div className="w-12 h-12 rounded-2xl bg-[#2B3139] flex items-center justify-center backdrop-blur-sm border border-transparent group-hover/btn:border-[#F0B90B]/50 transition-all shadow-lg group-active/btn:scale-95">
                                <Send className="w-5 h-5 text-[#FEFEFE]" />
                            </div>
                            <span className="text-[10px] font-bold text-[#848E9C] group-hover/btn:text-[#FEFEFE]">Send</span>
                        </button>
                        <button onClick={() => setIsReceiveOpen(true)} className="flex flex-col items-center gap-2 group/btn">
                            <div className="w-12 h-12 rounded-2xl bg-[#2B3139] flex items-center justify-center backdrop-blur-sm border border-transparent group-hover/btn:border-[#F0B90B]/50 transition-all shadow-lg group-active/btn:scale-95">
                                <ArrowDownToLine className="w-5 h-5 text-[#FEFEFE]" />
                            </div>
                            <span className="text-[10px] font-bold text-[#848E9C] group-hover/btn:text-[#FEFEFE]">Receive</span>
                        </button>
                        <button onClick={() => navigate('/web3/browser')} className="flex flex-col items-center gap-2 group/btn">
                            <div className="w-12 h-12 rounded-2xl bg-[#2B3139] flex items-center justify-center backdrop-blur-sm border border-transparent group-hover/btn:border-[#F0B90B]/50 transition-all shadow-lg group-active/btn:scale-95">
                                <Grid className="w-5 h-5 text-[#FEFEFE]" />
                            </div>
                            <span className="text-[10px] font-bold text-[#848E9C] group-hover/btn:text-[#FEFEFE]">DApps</span>
                        </button>
                        <button onClick={() => setCurrentView(currentView === 'dashboard' ? 'history' : 'dashboard')} className="flex flex-col items-center gap-2 group/btn">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-transparent transition-all shadow-lg group-active/btn:scale-95 ${currentView === 'history' ? 'bg-[#F0B90B] text-black' : 'bg-[#2B3139] text-[#FEFEFE] group-hover/btn:border-[#F0B90B]/50'}`}>
                                <History className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-[#848E9C] group-hover/btn:text-[#FEFEFE]">History</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* View Switcher */}
            {currentView === 'dashboard' ? (
                <>
                    {/* Assets / NFT Switcher */}
                    <div className="px-4 mb-4">
                        <div className="flex p-1 bg-[#1E2026] rounded-xl border border-[#2B3139]">
                            <button 
                                onClick={() => setActiveTab('tokens')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'tokens' ? 'bg-[#2B3139] text-[#FEFEFE] shadow' : 'text-[#848E9C] hover:text-[#FEFEFE]'}`}
                            >
                                Tokens
                            </button>
                            <button 
                                onClick={() => setActiveTab('nfts')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'nfts' ? 'bg-[#2B3139] text-[#FEFEFE] shadow' : 'text-[#848E9C] hover:text-[#FEFEFE]'}`}
                            >
                                NFTs
                            </button>
                        </div>
                    </div>

                    {/* Content List */}
                    <div className="px-4">
                        {activeTab === 'tokens' ? (
                            <div className="space-y-3 animate-fadeIn">
                                {assets.map((asset, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-[#1E2026] rounded-xl border border-transparent hover:border-[#F0B90B]/20 transition-all group cursor-pointer active:scale-[0.99]">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <AssetIcon symbol={asset.symbol} />
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0B0E11] flex items-center justify-center border border-[#2B3139]">
                                                    <div className={`w-2 h-2 rounded-full ${asset.network === 'BSC' ? 'bg-[#F0B90B]' : asset.network === 'Ethereum' ? 'bg-[#627EEA]' : asset.network === 'Solana' ? 'bg-[#14F195]' : 'bg-[#8247E5]'}`}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#FEFEFE]">{asset.symbol}</span>
                                                </div>
                                                <span className="text-xs text-[#848E9C] font-medium">{asset.network}</span>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <p className="font-bold text-[#FEFEFE] font-mono">{asset.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                                            <p className="text-xs text-[#848E9C] font-mono">${(asset.balance * asset.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="mt-6 pt-4 border-t border-[#2B3139] text-center">
                                    <button className="text-xs font-bold text-[#F0B90B] flex items-center justify-center gap-1 hover:underline">
                                        <Plus className="w-3 h-3" /> Add Custom Token
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                                {nfts.map((nft) => (
                                    <div key={nft.id} onClick={() => setSelectedNft(nft)} className="bg-[#1E2026] rounded-xl overflow-hidden border border-[#2B3139] hover:border-[#F0B90B]/30 transition-all cursor-pointer">
                                        <div className="aspect-square relative">
                                            <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="p-3">
                                            <h4 className="font-bold text-[#FEFEFE] text-xs truncate">{nft.name}</h4>
                                            <p className="text-[10px] text-[#848E9C] mb-2">{nft.collection}</p>
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] text-[#848E9C]">Floor</span>
                                                <span className="text-xs font-bold text-[#FEFEFE] font-mono">{nft.floorPrice} ETH</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {nfts.length === 0 && (
                                    <div className="col-span-2 text-center py-10">
                                        <ImageIcon className="w-12 h-12 text-[#2B3139] mx-auto mb-2" />
                                        <p className="text-sm text-[#848E9C]">No NFTs found</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                // HISTORY VIEW
                <div className="px-4 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-4">
                        <button onClick={() => setCurrentView('dashboard')} className="p-2 -ms-2 rounded-full hover:bg-[#2B3139] text-[#848E9C]">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold text-[#FEFEFE]">Transaction History</h2>
                    </div>
                    
                    <div className="space-y-3">
                        {transactions.length > 0 ? (
                            transactions.map((tx, idx) => (
                                <div key={idx} className="bg-[#1E2026] p-4 rounded-xl border border-[#2B3139] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-full ${tx.type === 'send' ? 'bg-[#F0B90B]/10 text-[#F0B90B]' : 'bg-[#0ECB81]/10 text-[#0ECB81]'}`}>
                                            {tx.type === 'send' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownToLine className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#FEFEFE] text-sm uppercase">{tx.type}</p>
                                            <p className="text-xs text-[#848E9C]">{new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <p className="font-bold text-[#FEFEFE] font-mono">
                                            {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.asset}
                                        </p>
                                        <p className={`text-[10px] font-bold uppercase ${tx.status === 'success' ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>{tx.status}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <History className="w-12 h-12 text-[#2B3139] mx-auto mb-3" />
                                <p className="text-sm text-[#848E9C]">No transactions yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SEND MODAL */}
            <Modal isOpen={isSendOpen} onClose={closeSendModal} title="Send Crypto">
                {txHash ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-[#0ECB81]/10 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-[#0ECB81]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#FEFEFE]">Transaction Sent</h3>
                        <p className="text-[#848E9C] text-sm">Your transaction has been submitted to the blockchain.</p>
                        <div className="bg-[#1E2026] p-3 rounded-lg w-full">
                            <p className="text-xs text-[#848E9C] mb-1">Transaction Hash</p>
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[#F0B90B] text-xs truncate">{txHash}</span>
                                <Copy className="w-4 h-4 text-[#848E9C] cursor-pointer" onClick={() => navigator.clipboard.writeText(txHash)} />
                            </div>
                        </div>
                        <button onClick={closeSendModal} className="w-full py-3 rounded-xl font-bold bg-[#1E2026] text-[#FEFEFE]">Close</button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs text-[#848E9C] ms-1 font-bold uppercase">Asset</label>
                            <div className="relative">
                                <SelectField
                                    valueLabel={selectedAsset ? `${selectedAsset.symbol} - ${selectedAsset.balance.toFixed(4)}` : ''}
                                    onClick={() => setIsAssetPickerOpen(true)}
                                    className="w-full bg-[#1E2026] border border-[#2B3139] rounded-xl p-3 ltr:pl-3 ltr:pr-10 rtl:pr-3 rtl:pl-10 appearance-none focus:outline-none focus:border-[#F0B90B] text-[#FEFEFE]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs text-[#848E9C] ms-1 font-bold uppercase">Recipient Address</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={recipient}
                                    onChange={e => setRecipient(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full bg-[#1E2026] border border-[#2B3139] rounded-xl p-3 pe-10 focus:outline-none focus:border-[#F0B90B] text-[#FEFEFE] font-mono text-sm"
                                />
                                <Scan className="absolute end-3 top-1/2 -translate-y-1/2 text-[#848E9C] w-4 h-4" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between px-1">
                                <label className="text-xs text-[#848E9C] font-bold uppercase">Amount</label>
                                <span className="text-xs text-[#848E9C]">Available: <span className="text-[#FEFEFE]">{selectedAsset?.balance.toFixed(6)}</span></span>
                            </div>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-[#1E2026] border border-[#2B3139] rounded-xl p-3 pe-16 focus:outline-none focus:border-[#F0B90B] text-[#FEFEFE] font-bold"
                                />
                                <button onClick={handleMax} className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] bg-[#F0B90B]/10 text-[#F0B90B] px-2 py-1 rounded font-bold">MAX</button>
                            </div>
                        </div>

                        <div className="bg-[#1E2026]/50 p-3 rounded-lg space-y-1 text-xs text-[#848E9C]">
                            <div className="flex justify-between">
                                <span>Network Fee (Est.)</span>
                                <span className="text-[#FEFEFE]">0.00042 ETH</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total</span>
                                <span className="text-[#FEFEFE] font-bold">{amount || '0.00'} {selectedAsset?.symbol}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleSend}
                            disabled={isSending || !amount || !recipient}
                            className={`w-full py-4 rounded-xl font-bold text-black bg-[#F0B90B] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                        >
                            {isSending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                    Signing...
                                </>
                            ) : 'Confirm Send'}
                        </button>
                    </div>
                )}
            </Modal>

            <SelectModal
                isOpen={isAssetPickerOpen}
                onClose={() => setIsAssetPickerOpen(false)}
                title="Asset"
                value={selectedAsset?.symbol || ''}
                searchable
                searchPlaceholder="Search asset..."
                accentColorClassName="text-[#F0B90B]"
                options={assets.map((a) => ({
                    value: a.symbol,
                    label: `${a.symbol} - ${a.balance.toFixed(4)}`,
                }))}
                onChange={(sym) => setSelectedAsset(assets.find(a => a.symbol === sym) || null)}
            />

            {/* RECEIVE MODAL */}
            <Modal isOpen={isReceiveOpen} onClose={() => setIsReceiveOpen(false)} title="Receive Assets">
                <div className="flex flex-col items-center text-center space-y-6 py-4">
                    <p className="text-sm text-[#848E9C]">Scan to send funds to this wallet</p>
                    <div className="p-4 bg-white rounded-xl shadow-inner">
                        <QRCodeSVG value={address || ''} size={180} />
                    </div>
                    <div className="w-full bg-[#1E2026] p-4 rounded-xl border border-[#2B3139] flex items-center justify-between gap-2">
                        <div className="text-start overflow-hidden">
                            <p className="text-[10px] text-[#848E9C] uppercase font-bold mb-1">Wallet Address</p>
                            <p className="text-sm font-mono text-[#F0B90B] truncate">{address}</p>
                        </div>
                        <button onClick={handleCopyAddress} className="p-2 bg-[#2B3139] rounded-lg hover:bg-black/20 text-[#FEFEFE]">
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex gap-2 text-xs text-[#848E9C] bg-[#F0B90B]/5 p-3 rounded-lg border border-[#F0B90B]/10">
                        <ShieldCheck className="w-4 h-4 text-[#F0B90B] shrink-0" />
                        <span>Send only supported assets (ETH, BNB, MATIC, BEP20, ERC20) to this address.</span>
                    </div>
                </div>
            </Modal>

            {/* NFT Modal */}
            <Modal isOpen={!!selectedNft} onClose={() => setSelectedNft(null)} title="NFT Details">
                {selectedNft && (
                    <div className="space-y-5">
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-[#2B3139]">
                            <img src={selectedNft.imageUrl} alt={selectedNft.name} className="w-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#FEFEFE]">{selectedNft.name}</h2>
                            <p className="text-[#F0B90B] text-sm font-medium">{selectedNft.collection}</p>
                        </div>
                        <div className="bg-[#1E2026] p-4 rounded-xl border border-[#2B3139]">
                            <p className="text-xs text-[#848E9C] uppercase font-bold mb-2">Description</p>
                            <p className="text-sm text-[#FEFEFE] leading-relaxed">{selectedNft.description}</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1 bg-[#1E2026] p-3 rounded-xl border border-[#2B3139]">
                                <p className="text-[10px] text-[#848E9C] uppercase font-bold">Floor Price</p>
                                <p className="text-lg font-mono font-bold text-[#FEFEFE]">{selectedNft.floorPrice} ETH</p>
                            </div>
                            <div className="flex-1 bg-[#1E2026] p-3 rounded-xl border border-[#2B3139]">
                                <p className="text-[10px] text-[#848E9C] uppercase font-bold">Standard</p>
                                <p className="text-lg font-mono font-bold text-[#FEFEFE]">ERC-721</p>
                            </div>
                        </div>
                        <button className="w-full py-4 rounded-xl font-bold text-black bg-[#F0B90B] hover:brightness-110 transition-all flex items-center justify-center gap-2">
                            <Send className="w-5 h-5" /> Send NFT
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};
