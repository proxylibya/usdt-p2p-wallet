
import React from 'react';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Search, MessageCircle, Mail, FileText, Shield, Wallet, RefreshCw, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SupportScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const navigate = useNavigate();

    const topics = [
        { id: 'account', icon: Shield, label: 'Account Functions' },
        { id: 'wallet', icon: Wallet, label: 'Crypto Deposit/Withdrawal' },
        { id: 'p2p', icon: RefreshCw, label: 'P2P Trading' },
        { id: 'kyc', icon: FileText, label: 'Identity Verification' },
    ];

    const faqs = [
        { q: 'How to reset password?', id: 'faq1' },
        { q: 'Why is my deposit pending?', id: 'faq2' },
        { q: 'How to buy crypto with card?', id: 'faq3' },
    ];

    return (
        <PageLayout title={t('help_support')} noPadding>
            <div className="flex flex-col h-full bg-background-primary">
                {/* Hero Search Section */}
                <div className="bg-background-secondary p-6 rounded-b-3xl border-b border-border-divider shadow-sm text-center space-y-4 z-10 relative">
                    <h1 className="text-2xl font-bold text-text-primary">How can we help you?</h1>
                    <div className="relative max-w-md mx-auto w-full">
                        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input 
                            type="text" 
                            placeholder="Search for issues..." 
                            className="w-full bg-background-tertiary border border-border-divider rounded-full py-3 ps-12 pe-4 focus:outline-none focus:border-brand-yellow transition-colors text-text-primary"
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6">
                    {/* Topics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {topics.map((topic) => (
                            <button key={topic.id} className="bg-background-secondary p-4 rounded-xl border border-border-divider shadow-sm flex flex-col items-center text-center gap-3 hover:border-brand-yellow/50 transition-colors group active:scale-95 transform">
                                <div className="p-3 rounded-full bg-background-tertiary group-hover:bg-background-primary transition-colors">
                                    <topic.icon className={`${primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green'} w-6 h-6`} />
                                </div>
                                <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary">{topic.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Top Questions */}
                    <div>
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className="text-sm font-bold text-text-primary">Top Questions</h3>
                            <button onClick={() => navigate('/faq')} className={`${primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green'} text-xs font-bold hover:underline`}>View All</button>
                        </div>
                        <div className="space-y-2">
                            {faqs.map((faq) => (
                                <button key={faq.id} className="w-full bg-background-secondary p-4 rounded-xl border border-border-divider flex justify-between items-center hover:bg-background-tertiary transition-colors text-start">
                                    <span className="text-sm font-medium text-text-primary">{faq.q}</span>
                                    <ChevronRight className="w-4 h-4 text-text-secondary rtl:rotate-180" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contact Actions */}
                    <div className="bg-background-tertiary/30 rounded-xl p-4 border border-border-divider mt-auto">
                        <h3 className="text-sm font-bold text-text-primary mb-4">Still need help?</h3>
                        <div className="flex gap-3">
                            <button className={`${primaryColor === 'brand-yellow' ? 'bg-primary-gold text-background-primary' : 'bg-primary-green text-background-primary'} flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform`}>
                                <MessageCircle className="w-5 h-5" />
                                <span>Live Chat</span>
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-background-secondary border border-border-divider text-text-primary font-bold text-sm hover:bg-background-tertiary transition-colors">
                                <Mail className="w-5 h-5" />
                                <span>Email Us</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default SupportScreen;
