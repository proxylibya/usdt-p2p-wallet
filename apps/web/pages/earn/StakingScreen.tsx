import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useWallet } from '../../context/WalletContext';
import { useNotifications } from '../../context/NotificationContext';
import { Wallet as WalletIcon, TrendingUp, Lock, CheckCircle, Info, Loader2 } from 'lucide-react';
import { assetIcons } from '../../components/icons/CryptoIcons';
import { Modal } from '../../components/Modal';
import { earnService, StakingProduct } from '../../services/earnService';

const StakingScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { wallets, refreshWalletData } = useWallet();
    const { addNotification } = useNotifications();

    const [products, setProducts] = useState<StakingProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<StakingProduct | null>(null);
    const [amount, setAmount] = useState('');
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const data = await earnService.getProducts();
            setProducts(data);
        } catch (error) {
            console.error(error);
            // Fallback to mock/empty or show error
        } finally {
            setLoadingProducts(false);
        }
    };

    const activeWallet = wallets.find(w => w.symbol === selectedProduct?.asset);
    const balance = activeWallet ? activeWallet.balance : 0;

    const handleSubscribe = async () => {
        if (!selectedProduct || !amount) return;
        const val = parseFloat(amount);
        
        if (val > balance) {
            addNotification({ icon: 'error', title: 'Error', message: 'Insufficient balance' });
            return;
        }

        setIsSubscribing(true);
        try {
            await earnService.subscribe(selectedProduct.id, val);
            addNotification({ 
                icon: 'success', 
                title: 'Subscribed Successfully', 
                message: `You have staked ${val} ${selectedProduct.asset} at ${selectedProduct.apy}% APY.` 
            });
            setIsSubscribing(false);
            setSelectedProduct(null);
            setAmount('');
            refreshWalletData(); // Update balance
        } catch (error: any) {
            addNotification({ icon: 'error', title: 'Error', message: error.response?.data?.message || 'Subscription failed' });
            setIsSubscribing(false);
        }
    };

    return (
        <PageLayout title="Simple Earn" noPadding>
            <div className="flex flex-col h-full bg-background-primary">
                {/* Hero Banner */}
                <div className="bg-background-secondary p-6 border-b border-border-divider relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-${primaryColor}/10 rounded-full blur-3xl -mr-10 -mt-10`}></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className={`w-5 h-5 text-${primaryColor}`} />
                            <h1 className="text-xl font-bold text-text-primary">Grow Your Crypto</h1>
                        </div>
                        <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
                            Earn stable returns with simple and secure staking products.
                        </p>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {loadingProducts ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-text-secondary" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center p-8 text-text-secondary">
                            No staking products available at the moment.
                        </div>
                    ) : (
                        products.map(product => {
                            const Icon = assetIcons[product.asset] || WalletIcon;
                            return (
                                <div key={product.id} className="bg-background-secondary p-4 rounded-xl border border-border-divider shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-10 h-10" />
                                            <div>
                                                <span className="font-bold text-text-primary text-base">{product.asset}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] bg-background-tertiary px-2 py-0.5 rounded text-text-secondary font-medium border border-border-divider">
                                                        {product.durationDays === 0 ? 'Flexible' : `${product.durationDays} Days`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <p className="text-success font-black text-xl">{product.apy}%</p>
                                            <p className="text-[10px] text-text-secondary uppercase font-bold">APY</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedProduct(product)}
                                        className={`w-full py-3 rounded-lg font-bold text-sm bg-background-tertiary text-text-primary ${primaryColor === 'brand-yellow' ? 'hover:bg-primary-gold-10 hover:text-primary-gold hover:border-primary-gold/30' : 'hover:bg-primary-green-10 hover:text-primary-green hover:border-primary-green/30'} border border-transparent transition-all`}
                                    >
                                        Subscribe
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Subscribe Modal */}
            {selectedProduct && (
                <Modal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={`Subscribe ${selectedProduct.asset}`}>
                    <div className="space-y-6">
                        <div className="bg-background-tertiary p-4 rounded-lg flex justify-between items-center border border-border-divider">
                            <div>
                                <p className="text-xs text-text-secondary font-medium uppercase">Annual Yield</p>
                                <p className="text-success font-mono font-bold text-xl">{selectedProduct.apy}%</p>
                            </div>
                            <div className="text-end">
                                <p className="text-xs text-text-secondary font-medium uppercase">Duration</p>
                                <p className="text-text-primary font-bold">{selectedProduct.durationDays === 0 ? 'Flexible' : `${selectedProduct.durationDays} Days`}</p>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-bold text-text-secondary">Subscription Amount</label>
                                <span className="text-xs text-text-secondary">
                                    Available: <span className="text-text-primary font-bold">{balance} {selectedProduct.asset}</span>
                                </span>
                            </div>
                            <div className="relative">
                                <input 
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder={`Min ${selectedProduct.minAmount}`}
                                    className={`w-full bg-background-secondary border border-border-divider rounded-xl p-4 pr-16 font-bold text-text-primary focus:outline-none ${primaryColor === 'brand-yellow' ? 'focus:border-primary-gold' : 'focus:border-primary-green'}`}
                                />
                                <button 
                                    onClick={() => setAmount(balance.toString())}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${primaryColor === 'brand-yellow' ? 'text-primary-gold px-2 py-1 bg-primary-gold-10 rounded' : 'text-primary-green px-2 py-1 bg-primary-green-10 rounded'}`}
                                >
                                    MAX
                                </button>
                            </div>
                        </div>

                        <div className="bg-background-tertiary/50 p-3 rounded-lg border border-border-divider/50 flex gap-2 items-start">
                            <Info className="w-4 h-4 text-text-secondary mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-text-secondary leading-relaxed">
                                Assets will be locked for the duration. Interest is distributed daily to your Spot Wallet.
                            </p>
                        </div>

                        <button 
                            onClick={handleSubscribe}
                            disabled={!amount || parseFloat(amount) < selectedProduct.minAmount || isSubscribing}
                            className={`w-full py-4 rounded-xl font-bold text-background-primary bg-${primaryColor} transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2`}
                        >
                            {isSubscribing && <Loader2 className="w-5 h-5 animate-spin" />}
                            {isSubscribing ? 'Confirming...' : 'Confirm Subscription'}
                        </button>
                    </div>
                </Modal>
            )}
        </PageLayout>
    );
};

export default StakingScreen;