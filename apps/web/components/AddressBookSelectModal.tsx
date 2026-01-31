
import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { AddressBookEntry } from '../types';
import { useLiveData } from '../context/LiveDataContext';
import { Search, MapPin, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface AddressBookSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (entry: AddressBookEntry) => void;
  assetSymbol: string;
}

export const AddressBookSelectModal: React.FC<AddressBookSelectModalProps> = ({ isOpen, onClose, onSelect, assetSymbol }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { addressBook } = useLiveData(); // Use live data

    const filteredEntries = useMemo(() => {
        return addressBook.filter(entry => {
            const matchesAsset = entry.asset === assetSymbol;
            const matchesSearch = entry.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  entry.address.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesAsset && matchesSearch;
        });
    }, [searchTerm, assetSymbol, addressBook]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('address_book')}>
            <div className="flex flex-col h-[50vh]">
                <div className="relative mb-4">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 ps-10 focus:outline-none"
                        style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                    />
                </div>
                <div className="flex-grow overflow-y-auto">
                    {filteredEntries.length > 0 ? (
                        <div className="space-y-2">
                            {filteredEntries.map(entry => (
                                <button 
                                    key={entry.id} 
                                    onClick={() => onSelect(entry)} 
                                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-background-tertiary transition-colors text-start border border-transparent hover:border-border-divider"
                                >
                                    <div className={`p-2 rounded-full bg-${primaryColor}/10 text-${primaryColor} mt-1`}>
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-text-primary text-sm">{entry.label}</p>
                                        <p className="text-xs text-text-secondary font-mono mt-0.5 truncate">{entry.address}</p>
                                        <div className="flex gap-2 mt-1.5">
                                            <span className="text-[10px] bg-background-secondary px-1.5 py-0.5 rounded text-text-secondary border border-border-divider/50">{entry.network}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <div className="bg-background-tertiary p-4 rounded-full mb-3">
                                <AlertCircle className="w-8 h-8 text-text-secondary" />
                            </div>
                            <p className="text-text-primary font-medium text-sm">No addresses found</p>
                            <p className="text-text-secondary text-xs mt-1 max-w-[200px]">
                                No saved addresses for {assetSymbol}. Add one in your profile settings.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
