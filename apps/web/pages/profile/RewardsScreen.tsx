
import React, { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import { useTheme } from '../../context/ThemeContext';
import { Ticket, Clock, CheckCircle, Info } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const RewardsScreen: React.FC = () => {
    const { primaryColor } = useTheme();
    const { addNotification } = useNotifications();
    const [activeTab, setActiveTab] = useState<'available' | 'used'>('available');

    const vouchers = [
        { id: 1, amount: '5 USDT', type: 'Cashback Voucher', expiry: 'Expires in 7 days', status: 'available' },
        { id: 2, amount: '20% OFF', type: 'Trading Fee Rebate', expiry: 'Expires in 30 days', status: 'available' },
        { id: 3, amount: '10 USDT', type: 'Trial Fund', expiry: 'Used on Oct 20', status: 'used' },
    ];

    const handleUse = (id: number) => {
        addNotification({
            icon: 'info',
            title: 'Redeemed',
            message: 'Voucher applied to your account.'
        });
    };

    return (
        <PageLayout title="Rewards Hub" noPadding>
            <div className="flex flex-col h-full bg-background-primary">
                <div className="p-4 bg-background-secondary border-b border-border-divider">
                    <div className="flex bg-background-tertiary p-1 rounded-xl">
                        <button 
                            onClick={() => setActiveTab('available')}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'available' ? `bg-background-secondary text-${primaryColor} shadow-sm` : 'text-text-secondary'}`}
                        >
                            Available (2)
                        </button>
                        <button 
                            onClick={() => setActiveTab('used')}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'used' ? `bg-background-secondary text-text-primary shadow-sm` : 'text-text-secondary'}`}
                        >
                            Used / Expired
                        </button>
                    </div>
                </div>

                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {vouchers.filter(v => v.status === activeTab).map(voucher => (
                        <div key={voucher.id} className="relative bg-background-secondary rounded-xl overflow-hidden border border-border-divider flex shadow-sm group hover:border-brand-yellow/30 transition-colors">
                            {/* Left Side: Amount */}
                            <div className={`w-28 ${activeTab === 'available' ? `bg-${primaryColor}/10` : 'bg-background-tertiary'} flex flex-col items-center justify-center p-4 border-r border-dashed border-border-divider relative`}>
                                <div className={`absolute -top-3 -right-3 w-6 h-6 rounded-full bg-background-primary`}></div>
                                <div className={`absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-background-primary`}></div>
                                
                                <Ticket className={`w-8 h-8 ${activeTab === 'available' ? `text-${primaryColor}` : 'text-text-secondary'} mb-2`} />
                                <span className={`text-lg font-black text-center leading-tight ${activeTab === 'available' ? `text-${primaryColor}` : 'text-text-secondary'}`}>
                                    {voucher.amount}
                                </span>
                            </div>

                            {/* Right Side: Details */}
                            <div className="flex-1 p-4 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-text-primary text-sm">{voucher.type}</h3>
                                    <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {voucher.expiry}
                                    </p>
                                </div>
                                
                                <div className="mt-3 flex justify-end">
                                    {activeTab === 'available' ? (
                                        <button 
                                            onClick={() => handleUse(voucher.id)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold bg-${primaryColor} text-background-primary hover:brightness-110 transition-colors`}
                                        >
                                            Use Now
                                        </button>
                                    ) : (
                                        <span className="text-xs font-bold text-text-secondary px-3 py-1 bg-background-tertiary rounded-full">Used</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {vouchers.filter(v => v.status === activeTab).length === 0 && (
                        <div className="text-center py-10 opacity-50">
                            <Info className="w-12 h-12 mx-auto mb-2" />
                            <p>No vouchers found.</p>
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default RewardsScreen;
