
import React, { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useLiveData } from '../../context/LiveDataContext';
import { WALLETS } from '../../constants';
import { AddressBookEntry } from '../../types';
import { PlusCircle, Trash2, BookUser, Search, Copy, Clipboard } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { assetIcons } from '../../components/icons/CryptoIcons';
import { useNotifications } from '../../context/NotificationContext';
import { SelectField } from '../../components/SelectField';
import { SelectModal } from '../../components/SelectModal';

const AddressBookScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { addressBook, addAddressBookEntry, deleteAddressBookEntry } = useLiveData();
    const { addNotification } = useNotifications();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAddAddress = (newAddress: Omit<AddressBookEntry, 'id'>) => {
        addAddressBookEntry({ id: `addr-${Date.now()}`, ...newAddress });
        setIsAddModalOpen(false);
        addNotification({ icon: 'success', title: 'Success', message: 'Address added successfully.' });
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure you want to delete this address?')) {
            deleteAddressBookEntry(id);
            addNotification({ icon: 'info', title: 'Deleted', message: 'Address removed.' });
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        addNotification({ icon: 'success', title: 'Copied', message: 'Address copied to clipboard.' });
    };

    const filteredEntries = addressBook.filter(entry => 
        entry.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.asset.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <PageLayout 
            title={t('address_book')} 
            action={
                <button onClick={() => setIsAddModalOpen(true)} className={`${primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'} p-2 hover:bg-background-tertiary rounded-full transition-colors`}>
                    <PlusCircle className="w-6 h-6" />
                </button>
            }
        >
            <div className="flex flex-col h-full">
                <div className="relative mb-4">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search addresses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background-secondary border border-border-divider rounded-xl p-3 ps-10 focus:outline-none focus:border-brand-yellow transition-colors text-text-primary placeholder-text-secondary/50"
                        style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                    />
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 pb-6 no-scrollbar">
                    {filteredEntries.length > 0 ? (
                        filteredEntries.map(entry => {
                            const IconComponent = assetIcons[entry.asset];
                            return (
                                <div key={entry.id} className="bg-background-secondary p-4 rounded-xl flex items-start justify-between border border-border-divider/30 hover:border-border-divider transition-colors group">
                                    <div className="flex items-start gap-3 min-w-0 flex-grow">
                                        <div className="mt-1 flex-shrink-0">
                                            {IconComponent ? <IconComponent className="w-10 h-10" /> : <div className="w-10 h-10 bg-background-tertiary rounded-full" />}
                                        </div>
                                        <div className="min-w-0 flex-grow space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-text-primary truncate">{entry.label}</p>
                                                <span className="text-[10px] font-bold bg-background-tertiary px-1.5 py-0.5 rounded text-text-secondary border border-border-divider">{entry.network}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-text-secondary font-mono truncate max-w-[180px] sm:max-w-xs bg-background-tertiary/30 px-2 py-1 rounded select-all">
                                                    {entry.address}
                                                </p>
                                                <button 
                                                    onClick={() => handleCopy(entry.address)}
                                                    className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-background-tertiary"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-text-secondary font-medium">{entry.asset}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(entry.id)} 
                                        className="text-text-secondary hover:text-error p-2 hover:bg-error/10 rounded-lg transition-colors flex-shrink-0 ms-2"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        addressBook.length === 0 ? (
                            <div className="pt-16">
                                <EmptyState
                                    icon={BookUser}
                                    title={t('no_addresses_title')}
                                    message={t('no_addresses_message')}
                                    action={
                                        <button onClick={() => setIsAddModalOpen(true)} className={`px-6 py-3 rounded-xl font-bold text-background-primary ${primaryColor === 'brand-yellow' ? 'bg-brand-yellow' : 'bg-brand-green'} shadow-lg hover:brightness-110 transition-all active:scale-95`}>
                                            {t('add_address')}
                                        </button>
                                    }
                                />
                            </div>
                        ) : (
                             <div className="text-center py-10 text-text-secondary">
                                <p>No addresses found matching "{searchTerm}"</p>
                            </div>
                        )
                    )}
                </div>
            </div>
            <AddAddressModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddAddress} />
        </PageLayout>
    );
};

const AddAddressModal: React.FC<{isOpen: boolean, onClose: () => void, onAdd: (addr: Omit<AddressBookEntry, 'id'>) => void}> = ({isOpen, onClose, onAdd}) => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const [label, setLabel] = useState('');
    const [address, setAddress] = useState('');
    const [isWalletPickerOpen, setIsWalletPickerOpen] = useState(false);
    // Use ID to uniquely identify wallet (asset + network combo)
    const [selectedWalletId, setSelectedWalletId] = useState<string>(WALLETS[0].id);

    const selectedWallet = WALLETS.find(w => w.id === selectedWalletId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!label || !address || !selectedWallet) return;
        
        onAdd({
            label,
            address,
            asset: selectedWallet.symbol,
            network: selectedWallet.network
        });
        
        // Reset
        setLabel('');
        setAddress('');
        setSelectedWalletId(WALLETS[0].id);
    }

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setAddress(text);
        } catch {
            // Clipboard access denied
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('add_address')}>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="text-sm font-medium text-text-secondary ms-1 mb-1.5 block">{t('asset')}</label>
                    <div className="relative">
                        <SelectField
                            valueLabel={selectedWallet ? `${selectedWallet.symbol} - ${selectedWallet.name} (${selectedWallet.network})` : ''}
                            onClick={() => setIsWalletPickerOpen(true)}
                            className="w-full bg-background-tertiary border border-border-divider rounded-xl p-4 ltr:pl-4 ltr:pr-12 rtl:pr-4 rtl:pl-12 appearance-none focus:outline-none focus:border-brand-yellow transition-colors text-text-primary"
                            style={{ '--tw-ring-color': `var(--tw-color-${primaryColor})` } as React.CSSProperties}
                        />
                    </div>
                </div>
                
                <div>
                    <label htmlFor="label" className="text-sm font-medium text-text-secondary ms-1 mb-1.5 block">{t('label')}</label>
                    <input 
                        id="label" 
                        type="text" 
                        placeholder="e.g. My Binance Wallet"
                        value={label} 
                        onChange={e => setLabel(e.target.value)} 
                        className="w-full bg-background-tertiary border border-border-divider rounded-xl p-4 focus:outline-none focus:border-brand-yellow transition-colors" 
                    />
                </div>
                
                 <div>
                    <label htmlFor="address" className="text-sm font-medium text-text-secondary ms-1 mb-1.5 block">{t('address')}</label>
                    <div className="relative">
                        <input 
                            id="address" 
                            type="text" 
                            placeholder="Paste address here"
                            value={address} 
                            onChange={e => setAddress(e.target.value)} 
                            className="w-full bg-background-tertiary border border-border-divider rounded-xl p-4 pe-20 font-mono text-sm focus:outline-none focus:border-brand-yellow transition-colors" 
                        />
                        <button 
                            type="button" 
                            onClick={handlePaste}
                            className={`absolute end-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-background-secondary border border-border-divider hover:bg-background-primary transition-colors ${primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'}`}
                        >
                            Paste
                        </button>
                    </div>
                </div>

                <div className="pt-2">
                    <button 
                        type="submit" 
                        disabled={!label || !address}
                        className={`w-full p-4 rounded-xl font-bold text-background-primary transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${primaryColor === 'brand-yellow' ? 'bg-brand-yellow' : 'bg-brand-green'}`}
                    >
                        {t('add_address')}
                    </button>
                </div>
            </form>

            <SelectModal
                isOpen={isWalletPickerOpen}
                onClose={() => setIsWalletPickerOpen(false)}
                title={t('asset')}
                value={selectedWalletId}
                searchable
                searchPlaceholder={t('search_asset')}
                accentColorClassName={primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'}
                options={WALLETS.map((w) => {
                    const Ico = assetIcons[w.symbol];
                    return {
                        value: w.id,
                        label: `${w.symbol} - ${w.name}`,
                        description: w.network,
                        icon: Ico ? <Ico className="w-8 h-8" /> : undefined,
                    };
                })}
                onChange={(id) => setSelectedWalletId(id)}
            />
        </Modal>
    );
}

export default AddressBookScreen;
