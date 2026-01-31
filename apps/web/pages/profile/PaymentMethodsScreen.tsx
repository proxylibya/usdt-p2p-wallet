
import React, { useState, useMemo, useEffect } from 'react';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ALL_PAYMENT_METHODS } from '../../constants';
import { Modal } from '../../components/Modal';
import { Plus, CreditCard, Trash2, ChevronDown, Search, Check, Smartphone, Banknote, Edit2, MoreVertical, Building2, Globe } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';

// Standardized Payment Method Interface
interface UserPaymentMethod {
    id: string;
    methodKey: string;
    type: 'card' | 'bank' | 'wallet';
    details: {
        accountName: string;
        accountNumber: string; // Used for IBAN, Phone, or Card Number
        bankName?: string; // Optional, for generic bank transfers
        expiryDate?: string; // Only for cards
    };
    isDefault?: boolean;
}

const STORAGE_KEY_METHODS = 'usdt_wallet_saved_payment_methods';

const PaymentMethodsScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { user } = useAuth();
    const { addNotification } = useNotifications();

    // Initialize with data from localStorage or default mocks
    const [userMethods, setUserMethods] = useState<UserPaymentMethod[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_METHODS);
            if (saved) return JSON.parse(saved);
        } catch {
            // Failed to load from storage
        }
        
        return [
            { 
                id: 'c1', 
                methodKey: 'visa', 
                type: 'card',
                details: { accountName: user?.name || 'User', accountNumber: '4829', expiryDate: '12/25' },
                isDefault: true
            },
            { 
                id: 'p1', 
                methodKey: 'cib_bank', 
                type: 'bank',
                details: { accountName: user?.name || 'User', accountNumber: '10002938475' } 
            }
        ];
    });

    // Persistence
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_METHODS, JSON.stringify(userMethods));
    }, [userMethods]);
    
    // UI State
    const [isManageModalOpen, setManageModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form State
    const [selectedMethodKey, setSelectedMethodKey] = useState('');
    const [formData, setFormData] = useState({
        accountName: '',
        accountNumber: '',
        bankName: '',
        expiryDate: ''
    });

    // Helper: Determine Method Type based on Key
    const getMethodType = (key: string): 'card' | 'bank' | 'wallet' => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('visa') || lowerKey.includes('mastercard')) return 'card';
        if (lowerKey.includes('cash') || lowerKey.includes('pay') || lowerKey.includes('money') || lowerKey.includes('wallet')) return 'wallet';
        return 'bank';
    };

    const availableMethods = useMemo(() => {
        if (!user || !user.countryCode) return ALL_PAYMENT_METHODS;
        return ALL_PAYMENT_METHODS.filter(m => m.scope === 'global' || m.countryCode === user.countryCode);
    }, [user]);

    const filteredMethods = useMemo(() => {
        return availableMethods.filter(m => t(m.key as any).toLowerCase().includes(searchTerm.toLowerCase()));
    }, [availableMethods, searchTerm, t]);

    const handleOpenAdd = () => {
        setModalMode('add');
        setEditingId(null);
        setSelectedMethodKey('');
        setFormData({ accountName: user?.name || '', accountNumber: '', bankName: '', expiryDate: '' });
        setManageModalOpen(true);
    };

    const handleOpenEdit = (method: UserPaymentMethod) => {
        setModalMode('edit');
        setEditingId(method.id);
        setSelectedMethodKey(method.methodKey);
        setFormData({
            accountName: method.details.accountName,
            accountNumber: method.details.accountNumber,
            bankName: method.details.bankName || '',
            expiryDate: method.details.expiryDate || ''
        });
        setManageModalOpen(true);
    };

    const handleSaveMethod = () => {
        if (!selectedMethodKey) return;
        
        const methodType = getMethodType(selectedMethodKey);
        
        if (modalMode === 'add') {
            const newMethod: UserPaymentMethod = {
                id: Date.now().toString(),
                methodKey: selectedMethodKey,
                type: methodType,
                details: {
                    accountName: formData.accountName,
                    accountNumber: formData.accountNumber,
                    bankName: formData.bankName,
                    expiryDate: formData.expiryDate
                }
            };
            setUserMethods(prev => [...prev, newMethod]);
            addNotification({ icon: 'success', title: t('success'), message: 'Payment method added.' });
        } else if (modalMode === 'edit' && editingId) {
            setUserMethods(prev => prev.map(m => m.id === editingId ? {
                ...m,
                methodKey: selectedMethodKey,
                type: methodType,
                details: {
                    accountName: formData.accountName,
                    accountNumber: formData.accountNumber,
                    bankName: formData.bankName,
                    expiryDate: formData.expiryDate
                }
            } : m));
            addNotification({ icon: 'success', title: t('success'), message: 'Payment method updated.' });
        }

        setManageModalOpen(false);
    };

    const handleDeleteMethod = (id: string) => {
        if(window.confirm("Are you sure you want to remove this payment method?")) {
            setUserMethods(prev => prev.filter(m => m.id !== id));
            addNotification({ icon: 'info', title: t('delete'), message: 'Method removed.' });
        }
    };

    const handleSetDefault = (id: string) => {
        setUserMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
        addNotification({ icon: 'success', title: t('success'), message: 'Default method updated.' });
    };

    const getFormLabels = () => {
        const type = getMethodType(selectedMethodKey);
        switch (type) {
            case 'card':
                return { number: 'Card Number', name: 'Cardholder Name', extra: 'Expiry Date (MM/YY)' };
            case 'wallet':
                return { number: 'Phone Number / Wallet ID', name: 'Full Name' };
            default:
                return { number: 'Account Number / IBAN', name: 'Beneficiary Name', extra: 'Bank Name (Optional)' };
        }
    };

    const formLabels = getFormLabels();

    return (
        <PageLayout 
            title={t('payment_methods')} 
            action={
                <button onClick={handleOpenAdd} className="text-brand-yellow bg-background-tertiary p-2 rounded-full hover:bg-background-secondary transition-colors border border-border-divider/50">
                    <Plus className="w-5 h-5" />
                </button>
            }
        >
            <div className="space-y-8 pb-10 px-4 pt-4">
                
                {/* Section: Cards */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2 px-1">
                        <CreditCard className="w-3.5 h-3.5" /> {t('global_cards')}
                    </h3>
                    
                    <div className="space-y-4">
                        {userMethods.filter(m => m.type === 'card').length > 0 ? (
                            userMethods.filter(m => m.type === 'card').map(card => (
                                <div key={card.id} className="relative h-48 bg-gradient-to-br from-background-secondary to-background-tertiary rounded-2xl border border-border-divider p-6 shadow-xl overflow-hidden group transition-all hover:shadow-2xl">
                                    {/* Decorative Elements */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full -ml-8 -mb-8 blur-xl"></div>
                                    
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div className="flex justify-between items-start">
                                            <span className="font-black text-lg tracking-widest text-white italic opacity-90">
                                                {t(card.methodKey as any) || 'CARD'}
                                            </span>
                                            {card.isDefault && (
                                                <span className="bg-brand-yellow text-background-primary text-[9px] px-2 py-0.5 rounded-full font-bold">DEFAULT</span>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <div className="flex items-center gap-3 mb-5">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="flex gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                                                    </div>
                                                ))}
                                                <span className="font-mono text-white text-lg tracking-widest font-bold">{card.details.accountNumber.slice(-4)}</span>
                                            </div>
                                            
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[8px] text-white/50 uppercase font-bold mb-0.5">Card Holder</p>
                                                    <p className="text-sm font-bold text-white uppercase tracking-wide truncate max-w-[150px]">{card.details.accountName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-white/50 uppercase font-bold mb-0.5 text-end">Expires</p>
                                                    <p className="text-sm font-bold text-white font-mono">{card.details.expiryDate}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons Overlay */}
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenEdit(card)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:text-brand-yellow">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteMethod(card.id)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:text-error">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 px-4 border border-dashed border-border-divider rounded-xl bg-background-secondary/30">
                                <p className="text-xs text-text-secondary mb-3">No cards added yet.</p>
                                <button onClick={handleOpenAdd} className="text-xs font-bold text-brand-yellow hover:underline">Add a Card</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section: P2P Methods */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2 px-1">
                        <Banknote className="w-3.5 h-3.5" /> P2P Payment Methods
                    </h3>
                    <div className="space-y-3">
                        {userMethods.filter(m => m.type !== 'card').length === 0 ? (
                            <EmptyState 
                                icon={Smartphone} 
                                title={t('no_payment_methods')} 
                                message={t('add_payment_method_desc')}
                                action={
                                    <button onClick={handleOpenAdd} className="px-6 py-2.5 rounded-xl font-bold text-background-primary bg-brand-yellow text-sm hover:brightness-110 transition-all">
                                        {t('add_payment_method')}
                                    </button>
                                }
                            />
                        ) : (
                            userMethods.filter(m => m.type !== 'card').map(method => {
                                const config = ALL_PAYMENT_METHODS.find(m => m.key === method.methodKey);
                                const isWallet = method.type === 'wallet';
                                return (
                                    <div key={method.id} className="bg-background-secondary p-4 rounded-xl border border-border-divider hover:border-brand-yellow/30 transition-colors group relative">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-4 items-center">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-background-tertiary border border-border-divider`}>
                                                    {isWallet ? <Smartphone className="w-6 h-6 text-blue-500" /> : <Building2 className="w-6 h-6 text-purple-500" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-text-primary text-sm">{config ? t(config.key as any) : method.methodKey}</h4>
                                                        {method.isDefault && <span className="bg-background-tertiary border border-border-divider text-[9px] px-1.5 py-0.5 rounded text-text-secondary font-bold">Default</span>}
                                                    </div>
                                                    <p className="text-xs text-text-secondary mt-0.5 font-medium">{method.details.accountName}</p>
                                                    <div className="flex flex-col">
                                                        <p className="text-xs text-text-secondary font-mono opacity-80">{method.details.accountNumber}</p>
                                                        {method.details.bankName && <p className="text-[10px] text-text-secondary mt-0.5 opacity-70">{method.details.bankName}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-1">
                                                {!method.isDefault && (
                                                    <button onClick={() => handleSetDefault(method.id)} className="p-2 text-text-secondary hover:text-success rounded-full hover:bg-background-tertiary transition-colors" title="Set as Default">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleOpenEdit(method)} className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-background-tertiary transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteMethod(method.id)} className="p-2 text-text-secondary hover:text-error rounded-full hover:bg-background-tertiary transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Manage Modal (Add/Edit) */}
            <Modal isOpen={isManageModalOpen} onClose={() => setManageModalOpen(false)} title={modalMode === 'add' ? t('add_payment_method') : 'Edit Payment Method'}>
                <div className="space-y-5">
                    {/* Method Selector */}
                    <div>
                        <label className="text-xs font-bold text-text-secondary mb-1.5 block ms-1">{t('payment_method')}</label>
                        <button 
                            onClick={() => setIsSelectorOpen(true)}
                            className="w-full bg-background-tertiary border border-border-divider rounded-xl p-3.5 flex justify-between items-center hover:bg-background-tertiary/80 transition-colors"
                        >
                            <span className={selectedMethodKey ? "text-text-primary font-bold text-sm" : "text-text-secondary font-medium text-sm"}>
                                {selectedMethodKey ? t(selectedMethodKey as any) : t('select_placeholder')}
                            </span>
                            <ChevronDown className="w-4 h-4 text-text-secondary" />
                        </button>
                    </div>

                    {selectedMethodKey && (
                        <div className="space-y-4 animate-fadeIn">
                            <div>
                                <label className="text-xs font-bold text-text-secondary mb-1.5 block ms-1">{formLabels.name}</label>
                                <input 
                                    type="text" 
                                    value={formData.accountName}
                                    onChange={e => setFormData(prev => ({...prev, accountName: e.target.value}))}
                                    className="w-full bg-background-secondary rounded-xl p-3.5 border border-border-divider focus:outline-none focus:border-brand-yellow text-text-primary text-sm font-medium" 
                                    placeholder={t('full_name_placeholder')}
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-text-secondary mb-1.5 block ms-1">{formLabels.number}</label>
                                <input 
                                    type="text" 
                                    value={formData.accountNumber}
                                    onChange={e => setFormData(prev => ({...prev, accountNumber: e.target.value}))}
                                    className="w-full bg-background-secondary rounded-xl p-3.5 border border-border-divider focus:outline-none focus:border-brand-yellow text-text-primary font-mono text-sm" 
                                    placeholder="0000..."
                                />
                            </div>

                            {/* Extra Fields based on type */}
                            {getMethodType(selectedMethodKey) === 'card' && (
                                <div>
                                    <label className="text-xs font-bold text-text-secondary mb-1.5 block ms-1">{formLabels.extra}</label>
                                    <input 
                                        type="text" 
                                        value={formData.expiryDate}
                                        onChange={e => setFormData(prev => ({...prev, expiryDate: e.target.value}))}
                                        className="w-full bg-background-secondary rounded-xl p-3.5 border border-border-divider focus:outline-none focus:border-brand-yellow text-text-primary font-mono text-sm" 
                                        placeholder="MM/YY"
                                        maxLength={5}
                                    />
                                </div>
                            )}
                            
                            {getMethodType(selectedMethodKey) === 'bank' && (
                                <div>
                                    <label className="text-xs font-bold text-text-secondary mb-1.5 block ms-1">{formLabels.extra}</label>
                                    <input 
                                        type="text" 
                                        value={formData.bankName}
                                        onChange={e => setFormData(prev => ({...prev, bankName: e.target.value}))}
                                        className="w-full bg-background-secondary rounded-xl p-3.5 border border-border-divider focus:outline-none focus:border-brand-yellow text-text-primary text-sm font-medium" 
                                        placeholder="Bank Name"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <button 
                        onClick={handleSaveMethod} 
                        disabled={!selectedMethodKey || !formData.accountNumber || !formData.accountName} 
                        className="w-full py-4 rounded-xl font-bold text-background-primary bg-brand-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg"
                    >
                        {modalMode === 'add' ? t('save') : 'Update Method'}
                    </button>
                </div>
            </Modal>

            {/* Method Selector Modal */}
            <Modal isOpen={isSelectorOpen} onClose={() => setIsSelectorOpen(false)} title={t('select_method')}>
                <div className="flex flex-col h-[60vh]">
                    <div className="relative mb-4 flex-shrink-0">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input 
                            type="text" 
                            placeholder={t('search')} 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 ps-10 focus:outline-none text-text-primary text-sm" 
                        />
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-1">
                        {filteredMethods.map(m => (
                            <button 
                                key={m.key} 
                                onClick={() => { setSelectedMethodKey(m.key); setIsSelectorOpen(false); }} 
                                className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-background-tertiary transition-colors text-start group ${selectedMethodKey === m.key ? 'bg-background-tertiary' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    {m.countryCode ? (
                                        <div className="w-6 h-4 bg-background-secondary rounded overflow-hidden shadow-sm flex items-center justify-center">
                                            <span className="text-[10px] font-bold">{m.countryCode}</span>
                                        </div>
                                    ) : (
                                        <Globe className="w-4 h-4 text-text-secondary" />
                                    )}
                                    <span className={`text-sm ${selectedMethodKey === m.key ? 'font-bold text-text-primary' : 'font-medium text-text-secondary group-hover:text-text-primary'}`}>
                                        {t(m.key as any)}
                                    </span>
                                </div>
                                {selectedMethodKey === m.key && <Check className="w-4 h-4 text-brand-yellow" />}
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        </PageLayout>
    );
};

export default PaymentMethodsScreen;
