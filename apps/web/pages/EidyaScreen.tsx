

import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Gift, Copy, Share2, Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { eidyaService } from '../services/eidyaService';

const EidyaScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { addNotification } = useNotifications();
    
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState('');
    const [count, setCount] = useState('');
    const [message, setMessage] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!amount || !count) return;
        
        setIsLoading(true);
        try {
            const result = await eidyaService.create({
                asset: 'USDT', // Defaulting to USDT as per UI
                totalAmount: parseFloat(amount) * parseInt(count), // UI input is amount per person
                quantity: parseInt(count),
                message: message
            });

            // Generate deep link or web link
            const link = `${window.location.origin}/eidya/claim/${result.code}`;
            setGeneratedLink(link);
            setStep(2);
            addNotification({ icon: 'success', title: t('success'), message: 'Eidya created successfully!' });
        } catch (error: any) {
            addNotification({ icon: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to create Eidya' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink);
        addNotification({ icon: 'success', title: t('copied'), message: 'Gift link copied!' });
    };

    return (
        <PageLayout title={t('eidya_title')} noPadding>
            <div className="flex flex-col h-full bg-[#A61818] text-white overflow-hidden relative">
                {/* Decorative Islamic Pattern Background Overlay */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #FFD700 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                <div className="flex-grow flex flex-col items-center justify-center p-6 relative z-10">
                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md border border-white/20 shadow-xl">
                        <Gift className="w-12 h-12 text-[#FFD700]" />
                    </div>
                    
                    <h1 className="text-3xl font-black mb-2 text-[#FFD700] drop-shadow-md">{t('eidya_title')}</h1>
                    <p className="text-white/80 text-sm text-center max-w-xs mb-8">{t('eidya_desc')}</p>

                    {step === 1 ? (
                        <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-[#FFD700] uppercase mb-1 block">{t('amount_per_person')} (USDT)</label>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:border-[#FFD700]"
                                    placeholder="10"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#FFD700] uppercase mb-1 block">{t('number_of_people')}</label>
                                <input 
                                    type="number" 
                                    value={count}
                                    onChange={(e) => setCount(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:border-[#FFD700]"
                                    placeholder="5"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#FFD700] uppercase mb-1 block">{t('envelope_message')}</label>
                                <input 
                                    type="text" 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:border-[#FFD700]"
                                    placeholder={t('best_wishes')}
                                />
                            </div>
                            <button 
                                onClick={handleGenerate}
                                disabled={!amount || !count || isLoading}
                                className="w-full py-4 rounded-xl font-bold text-[#A61818] bg-[#FFD700] hover:brightness-110 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center items-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('generate_link')}
                            </button>
                        </div>
                    ) : (
                        <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center shadow-2xl animate-fadeInUp">
                            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-success" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Share!</h2>
                            <p className="text-gray-500 text-sm mb-6">Share this link. Friends can claim their Eidya instantly.</p>
                            
                            <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl mb-6 cursor-pointer" onClick={handleCopy}>
                                <span className="flex-grow text-gray-800 font-mono text-sm truncate text-start">{generatedLink}</span>
                                <Copy className="w-4 h-4 text-gray-500" />
                            </div>

                            <button className="w-full py-3 rounded-xl font-bold text-white bg-[#A61818] flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95" onClick={handleCopy}>
                                <Share2 className="w-5 h-5" />
                                {t('share_eidya')}
                            </button>
                            
                            <button onClick={() => setStep(1)} className="mt-4 text-sm text-gray-500 font-medium hover:text-gray-900">
                                Create Another
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default EidyaScreen;
