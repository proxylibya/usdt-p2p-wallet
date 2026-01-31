
import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Wallet } from '../types';
import { Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { assetIcons } from './icons/CryptoIcons';

interface AssetSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (wallet: Wallet) => void;
  title: string;
  wallets: Wallet[];
}

export const AssetSelectModal: React.FC<AssetSelectModalProps> = ({ isOpen, onClose, onSelect, title, wallets }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useLanguage();
    
    const groupedWallets = useMemo(() => {
        // Aggregate balances by symbol
        const aggregated = wallets.reduce((acc, current) => {
            const existing = acc.find(w => w.symbol === current.symbol);
            if (existing) {
                existing.balance += current.balance;
                existing.usdValue += current.usdValue;
            } else {
                // Clone to avoid mutating original
                acc.push({ ...current }); 
            }
            return acc;
        }, [] as Wallet[]);

        return aggregated.filter(wallet => 
            wallet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wallet.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, wallets]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex flex-col h-[50vh]">
                <div className="relative mb-4">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                        type="text"
                        placeholder={t('search_asset')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 ps-10 focus:outline-none"
                    />
                </div>
                <div className="flex-grow overflow-y-auto">
                    {groupedWallets.length > 0 ? (
                        <div className="space-y-2">
                            {groupedWallets.map(wallet => {
                                const IconComponent = assetIcons[wallet.symbol];
                                return (
                                <button key={wallet.symbol} onClick={() => onSelect(wallet)} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-background-tertiary transition-colors">
                                    <div className="flex items-center gap-3 text-start">
                                        {IconComponent && <IconComponent className="w-10 h-10" />}
                                        <div>
                                            <div className="flex items-center">
                                                <p className="font-bold text-text-primary">{wallet.symbol}</p>
                                                {/* Removed network badge for cleaner "Binance-like" look in selection */}
                                            </div>
                                            <p className="text-sm text-text-secondary">{wallet.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <p className="font-semibold text-text-primary">{wallet.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })}</p>
                                        <p className="text-sm text-text-secondary">${wallet.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </button>
                            );
                        })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-text-secondary">
                            <p>{t('no_assets_found')}</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
