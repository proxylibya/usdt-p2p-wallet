
import React, { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Copy, Share2, Gift, Users, DollarSign, Trophy, History, ChevronRight, Check } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const ReferralScreen: React.FC = () => {
    const { user } = useAuth();
    const { primaryColor } = useTheme();
    const { t } = useLanguage();
    const { addNotification } = useNotifications();
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'my_referrals'>('overview');

    // Mock Referral Data
    const referralCode = user?.id ? user.id.substring(0, 8).toUpperCase() : 'ABC12345';
    const referralLink = `https://usdt-wallet.app/r/${referralCode}`;
    const totalEarned = 145.50;
    const totalFriends = 12;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        addNotification({ icon: 'success', title: t('copied'), message: 'Referral link copied' });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join USDT Wallet',
                    text: `Join me on USDT Wallet and get 5 USDT! Use my code: ${referralCode}`,
                    url: referralLink
                });
            } catch {
                // Share failed
            }
        } else {
            handleCopy(referralLink);
        }
    };

    const TabButton = ({ id, label }: { id: 'overview' | 'my_referrals', label: string }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === id ? `border-${primaryColor} text-text-primary` : 'border-transparent text-text-secondary'}`}
        >
            {label}
        </button>
    );

    return (
        <PageLayout title="Referral Program" noPadding scrollable={false}>
            <div className="flex flex-col h-full bg-background-primary">
                {/* Hero Section */}
                <div className="bg-background-secondary pb-0 pt-2 px-4 border-b border-border-divider/50">
                    <div className={`bg-gradient-to-r from-${primaryColor}/20 to-purple-500/20 p-6 rounded-2xl relative overflow-hidden border border-${primaryColor}/10 shadow-lg`}>
                        <div className="relative z-10">
                            <h1 className="text-2xl font-black text-text-primary mb-1">Invite Friends</h1>
                            <p className="text-sm text-text-secondary font-medium mb-4">Earn up to 40% commission every time your friends trade.</p>
                            
                            <div className="flex items-center gap-6 bg-background-primary/30 p-3 rounded-xl backdrop-blur-sm border border-white/5">
                                <div>
                                    <p className="text-[10px] text-text-secondary uppercase font-bold">Total Earned</p>
                                    <p className={`text-xl font-bold text-${primaryColor}`}>${totalEarned.toFixed(2)}</p>
                                </div>
                                <div className="w-px h-8 bg-white/10"></div>
                                <div>
                                    <p className="text-[10px] text-text-secondary uppercase font-bold">Friends</p>
                                    <p className="text-xl font-bold text-text-primary">{totalFriends}</p>
                                </div>
                            </div>
                        </div>
                        <Gift className={`absolute -bottom-6 -right-6 w-32 h-32 text-${primaryColor} opacity-10 rotate-12`} />
                    </div>

                    <div className="flex mt-4">
                        <TabButton id="overview" label="Overview" />
                        <TabButton id="my_referrals" label="My Referrals" />
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-grow overflow-y-auto">
                    {activeTab === 'overview' ? (
                        <div className="p-4 space-y-6">
                            {/* Referral Code Box */}
                            <div className="bg-background-secondary p-5 rounded-xl border border-border-divider">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Your Referral ID</span>
                                    <button onClick={() => handleCopy(referralCode)} className={`text-xs font-bold text-${primaryColor} flex items-center gap-1 hover:brightness-110`}>
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="bg-background-tertiary p-4 rounded-lg flex justify-between items-center font-mono text-2xl font-bold tracking-wider text-text-primary mb-4 border border-border-divider/50 text-center">
                                    <span className="w-full select-all">{referralCode}</span>
                                </div>
                                <button 
                                    onClick={handleShare}
                                    className={`w-full py-3.5 rounded-lg font-bold text-background-primary bg-${primaryColor} flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-${primaryColor}/20`}
                                >
                                    <Share2 className="w-4 h-4" />
                                    Invite Now
                                </button>
                            </div>

                            {/* Rules Visualization */}
                            <div>
                                <h3 className="text-sm font-bold text-text-primary mb-3 px-1">Commission Rules</h3>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    {[
                                        { icon: Share2, title: 'Share', desc: 'Send your link', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                        { icon: Users, title: 'Register', desc: 'Friends sign up', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                        { icon: DollarSign, title: 'Earn', desc: 'Get 40%', color: `text-${primaryColor}`, bg: `bg-${primaryColor}/10` }
                                    ].map((step, i) => (
                                        <div key={i} className="bg-background-secondary p-3 rounded-xl border border-border-divider flex flex-col items-center relative overflow-hidden group">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step.bg} ${step.color}`}>
                                                <step.icon className="w-5 h-5" />
                                            </div>
                                            <p className="text-xs font-bold text-text-primary">{step.title}</p>
                                            <p className="text-[10px] text-text-secondary mt-1 leading-tight">{step.desc}</p>
                                            {i < 2 && <div className="absolute top-1/2 -right-3 w-6 h-px bg-border-divider transform -translate-y-1/2 z-10 hidden sm:block"></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Leaderboard */}
                            <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
                                <div className="p-4 border-b border-border-divider flex justify-between items-center bg-background-tertiary/30">
                                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-brand-yellow" />
                                        Top Earners
                                    </h3>
                                    <span className="text-[10px] text-text-secondary bg-background-tertiary px-2 py-1 rounded border border-border-divider">This Week</span>
                                </div>
                                <div className="divide-y divide-border-divider/30">
                                    {[
                                        { name: 'CryptoKing', earned: '$4,250.00', rank: 1 },
                                        { name: 'AliceTrader', earned: '$3,105.50', rank: 2 },
                                        { name: 'BobHODL', earned: '$2,890.00', rank: 3 },
                                        { name: 'User9281', earned: '$1,100.00', rank: 4 },
                                        { name: 'LibyaWhale', earned: '$950.00', rank: 5 },
                                    ].map((earner) => (
                                        <div key={earner.rank} className="flex items-center justify-between p-4 hover:bg-background-tertiary/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${earner.rank === 1 ? 'bg-brand-yellow text-black' : earner.rank === 2 ? 'bg-gray-300 text-black' : earner.rank === 3 ? 'bg-orange-400 text-black' : 'bg-background-tertiary text-text-secondary'}`}>
                                                    {earner.rank}
                                                </div>
                                                <span className="text-sm font-medium text-text-primary">{earner.name}</span>
                                            </div>
                                            <span className="text-sm font-bold text-success">{earner.earned}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 h-full flex flex-col items-center justify-center text-center">
                            <div className="bg-background-secondary p-6 rounded-full mb-4 border-2 border-dashed border-border-divider">
                                <History className="w-12 h-12 text-text-secondary opacity-50" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-1">No referrals yet</h3>
                            <p className="text-text-secondary text-sm max-w-xs mx-auto mb-6">
                                Share your referral link with friends. Once they sign up and trade, they will appear here.
                            </p>
                            <button onClick={() => setActiveTab('overview')} className={`text-${primaryColor} font-bold text-sm hover:underline`}>
                                Go to Overview
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default ReferralScreen;
