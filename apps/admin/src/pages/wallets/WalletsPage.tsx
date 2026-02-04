import { useState, useEffect } from 'react';
import { Search, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface WalletStats {
  asset: string;
  totalBalance: number;
  lockedBalance: number;
  usersCount: number;
  change24h: number;
}

const WalletsPage: React.FC = () => {
  const [wallets, setWallets] = useState<WalletStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ wallets: WalletStats[] }>('/admin/wallets/stats');
      if (response.success && response.data) {
        setWallets(response.data.wallets);
      }
    } catch {
      setWallets([]);
    }
    setIsLoading(false);
  };

  const filteredWallets = wallets.filter(w => 
    w.asset.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = wallets.reduce((acc, w) => {
    if (w.asset === 'BTC') return acc + w.totalBalance * 65000;
    if (w.asset === 'ETH') return acc + w.totalBalance * 3200;
    if (w.asset === 'BNB') return acc + w.totalBalance * 580;
    return acc + w.totalBalance;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Wallets Overview</h1>
        <p className="text-text-secondary mt-1">Platform wallet balances and statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-yellow/20 rounded-xl">
              <Wallet className="w-6 h-6 text-brand-yellow" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Total Platform Value</p>
              <p className="text-2xl font-bold text-text-primary">${totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-warning/20 rounded-xl">
              <AlertCircle className="w-6 h-6 text-status-warning" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Locked in Escrow</p>
              <p className="text-2xl font-bold text-text-primary">$170,000</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-success/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-status-success" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">24h Volume</p>
              <p className="text-2xl font-bold text-text-primary">$89,432</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-brand-yellow border-t-transparent rounded-full" />
          </div>
        ) : filteredWallets.length === 0 ? (
          <div className="col-span-full text-center py-8 text-text-secondary">No wallets found</div>
        ) : (
          filteredWallets.map((wallet) => (
            <div key={wallet.asset} className="bg-background-secondary p-6 rounded-xl border border-border-divider hover:border-brand-yellow/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                    <span className="font-bold text-brand-yellow">{wallet.asset.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{wallet.asset}</p>
                    <p className="text-sm text-text-secondary">{wallet.usersCount.toLocaleString()} users</p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${wallet.change24h >= 0 ? 'text-status-success' : 'text-status-error'}`}>
                  {wallet.change24h >= 0 ? '+' : ''}{wallet.change24h}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Balance</span>
                  <span className="font-medium text-text-primary">{wallet.totalBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Locked</span>
                  <span className="font-medium text-status-warning">{wallet.lockedBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Available</span>
                  <span className="font-medium text-status-success">{(wallet.totalBalance - wallet.lockedBalance).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WalletsPage;
