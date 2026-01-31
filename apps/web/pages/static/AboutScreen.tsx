
import React from 'react';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, Globe, Twitter, Facebook, Send } from 'lucide-react';

const AboutScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();

    const SocialLink = ({ icon: Icon, label, color }: any) => (
        <a href="#" className="flex flex-col items-center gap-2 group">
            <div className={`w-12 h-12 rounded-full bg-background-tertiary flex items-center justify-center group-hover:bg-background-secondary border border-border-divider transition-all group-active:scale-95`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <span className="text-[10px] font-bold text-text-secondary group-hover:text-text-primary">{label}</span>
        </a>
    );

    const LegalItem = ({ label }: { label: string }) => (
        <div className="flex items-center justify-between p-4 bg-background-secondary border-b border-border-divider last:border-0 hover:bg-background-tertiary transition-colors cursor-pointer group">
            <span className="text-sm font-medium text-text-primary">{label}</span>
            <ChevronRight className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors rtl:rotate-180" />
        </div>
    );

    return (
        <PageLayout title={t('about_us')} noPadding>
            <div className="flex flex-col h-full bg-background-primary overflow-y-auto">
                {/* Brand Hero */}
                <div className="flex flex-col items-center pt-10 pb-8 px-4 text-center">
                    <div className="w-24 h-24 bg-background-secondary rounded-3xl flex items-center justify-center shadow-xl border border-border-divider mb-6 relative overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br from-${primaryColor}/20 to-transparent`}></div>
                        <svg width="48" height="48" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg" className={`text-${primaryColor}`}>
                            <rect width="192" height="192" rx="32" fill="currentColor" fillOpacity="0.1"/>
                            <path d="M56 48V108C56 125.673 70.3269 140 88 140H104C121.673 140 136 125.673 136 108V48" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black text-text-primary mb-1">{t('app_name')}</h1>
                    <p className="text-sm text-text-secondary font-mono">Version 2.4.0 (Build 892)</p>
                </div>

                {/* Community Links */}
                <div className="px-6 mb-8">
                    <div className="flex justify-center gap-6">
                        <SocialLink icon={Twitter} label="Twitter" color="text-blue-400" />
                        <SocialLink icon={Send} label="Telegram" color="text-blue-500" />
                        <SocialLink icon={Facebook} label="Facebook" color="text-blue-600" />
                        <SocialLink icon={Globe} label="Website" color={`text-${primaryColor}`} />
                    </div>
                </div>

                {/* Legal Section */}
                <div className="px-4 pb-8 space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">Legal & Privacy</h3>
                        <div className="rounded-xl overflow-hidden border border-border-divider">
                            <LegalItem label={t('privacy_policy')} />
                            <LegalItem label="Terms of Service" />
                            <LegalItem label="Risk Disclosure" />
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">Company</h3>
                        <div className="rounded-xl overflow-hidden border border-border-divider">
                            <LegalItem label="Our Story" />
                            <LegalItem label="Careers" />
                            <LegalItem label="Partnership" />
                        </div>
                    </div>
                </div>
                
                <div className="mt-auto py-6 text-center">
                    <p className="text-[10px] text-text-secondary">© 2023 USDT Wallet. All rights reserved.</p>
                </div>
            </div>
        </PageLayout>
    );
};

export default AboutScreen;
