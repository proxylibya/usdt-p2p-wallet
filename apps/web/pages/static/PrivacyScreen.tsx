
import React from 'react';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';

const PrivacyScreen: React.FC = () => {
    const { t } = useLanguage();
    return (
        <PageLayout title={t('privacy_policy')}>
            <div className="space-y-6 text-text-secondary leading-relaxed p-2">
                <div className="bg-background-secondary p-4 rounded-xl border border-border-divider">
                    <p className="text-xs font-mono text-text-primary mb-1">{t('privacy_last_updated')}</p>
                    <p className="text-xs">Effective Date: October 27, 2023</p>
                </div>
                
                <section>
                    <h3 className="text-lg font-bold text-text-primary mb-2">{t('privacy_title1')}</h3>
                    <p className="text-sm">
                        {t('privacy_p1')} We collect information you provide directly to us, such as when you create an account, update your profile, request customer support, or communicate with us.
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-text-primary mb-2">{t('privacy_title2')}</h3>
                    <p className="text-sm">
                        {t('privacy_p2')} This includes using data to maintain and improve our services, verify your identity, and detect, investigate, and prevent fraudulent transactions and other illegal activities.
                    </p>
                </section>
                
                <section>
                    <h3 className="text-lg font-bold text-text-primary mb-2">{t('privacy_title3')}</h3>
                    <p className="text-sm">
                        {t('privacy_p3')} We implement appropriate technical and organizational measures to protect your personal data against accidental or unlawful destruction, loss, change, or damage.
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-text-primary mb-2">Data Sharing</h3>
                    <p className="text-sm">
                        We do not share your personal information with third parties except as described in this policy or with your consent.
                    </p>
                </section>
            </div>
        </PageLayout>
    );
};

export default PrivacyScreen;
