
import React, { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { ChevronDown } from 'lucide-react';

const FAQ_CATEGORIES = {
    'General': [
        { id: '1', q: 'What is a stablecoin?', a: 'A stablecoin is a type of cryptocurrency whose value is pegged to another asset class, such as a fiat currency or gold, to maintain a stable price.' },
        { id: '2', q: 'Is my account secure?', a: 'Yes, we use industry-standard encryption, cold storage for assets, and mandatory 2FA for withdrawals.' },
    ],
    'Wallet': [
        { id: '3', q: 'How to deposit funds?', a: 'Go to Wallet > Deposit, select the asset and network. Send funds to the displayed address.' },
        { id: '4', q: 'What are the withdrawal fees?', a: 'Fees vary by network. TRC20 is approx 1 USDT, while ERC20 depends on Ethereum gas fees.' },
    ],
    'P2P': [
        { id: '5', q: 'How does P2P Escrow work?', a: 'When you start a trade, the seller\'s crypto is locked in escrow. It is only released when the seller confirms receipt of payment.' },
        { id: '6', q: 'What if the seller doesn\'t release?', a: 'You can file an appeal after the payment timer expires. Our support team will intervene.' },
    ]
};

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { primaryColor } = useTheme();

    return (
        <div className={`bg-background-secondary rounded-xl border transition-colors overflow-hidden ${isOpen ? (primaryColor === 'brand-yellow' ? 'border-primary-gold/50' : 'border-primary-green/50') : 'border-border-divider'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-start"
            >
                <span className={`font-bold text-sm ${isOpen ? (primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green') : 'text-text-primary'}`}>{question}</span>
                <ChevronDown className={`w-5 h-5 text-text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-4 pt-0 text-sm text-text-secondary leading-relaxed border-t border-border-divider/50 mt-2">
                    {answer}
                </div>
            </div>
        </div>
    );
};

const FAQScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const [activeTab, setActiveTab] = useState<keyof typeof FAQ_CATEGORIES>('General');

    return (
        <PageLayout title={t('faq')} noPadding>
            <div className="flex flex-col h-full">
                <div className="px-4 pt-4 pb-2 bg-background-primary z-10">
                    <div className="flex bg-background-secondary p-1 rounded-xl border border-border-divider/50">
                        {Object.keys(FAQ_CATEGORIES).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat as any)}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === cat ? (primaryColor === 'brand-yellow' ? 'bg-background-tertiary text-primary-gold shadow-sm' : 'bg-background-tertiary text-primary-green shadow-sm') : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto px-4 py-4 space-y-3">
                    {FAQ_CATEGORIES[activeTab].map(item => (
                        <FAQItem key={item.id} question={item.q} answer={item.a} />
                    ))}
                </div>
            </div>
        </PageLayout>
    );
};

export default FAQScreen;
