
import React, { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, AlertCircle, Save } from 'lucide-react';
import { userService } from '../../services';
import { SelectField } from '../../components/SelectField';
import { SelectModal } from '../../components/SelectModal';

const SECURITY_QUESTIONS = [
    "What was the name of your first pet?",
    "In what city were you born?",
    "What is your mother's maiden name?",
    "What was the model of your first car?",
    "What is the name of your favorite childhood teacher?",
    "What is your favorite book?",
    "What is the name of the street you grew up on?"
];

const SecurityQuestionsScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { addNotification } = useNotifications();
    const { updateUser } = useAuth();
    const navigate = useNavigate();

    const [question1, setQuestion1] = useState(SECURITY_QUESTIONS[0]);
    const [answer1, setAnswer1] = useState('');
    const [question2, setQuestion2] = useState(SECURITY_QUESTIONS[1]);
    const [answer2, setAnswer2] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [activeQuestionPicker, setActiveQuestionPicker] = useState<1 | 2 | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!answer1.trim() || !answer2.trim()) {
            addNotification({ icon: 'error', title: t('error'), message: 'Please answer both questions.' });
            return;
        }

        if (question1 === question2) {
            addNotification({ icon: 'error', title: t('error'), message: 'Please select two different questions.' });
            return;
        }

        setIsSaving(true);
        const response = await userService.setSecurityQuestions([
            { question: question1, answer: answer1 },
            { question: question2, answer: answer2 },
        ]);

        if (response.success) {
            updateUser({ hasSecurityQuestions: true });
            addNotification({ icon: 'success', title: t('success'), message: 'Security questions updated.' });
            navigate('/security');
        } else {
            addNotification({ icon: 'error', title: t('error'), message: response.error || 'Failed to update questions.' });
        }

        setIsSaving(false);
    };

    return (
        <PageLayout title="Security Questions" scrollable={false}>
            <form onSubmit={handleSubmit} className="flex flex-col h-full bg-background-primary">
                <div className="flex-grow overflow-y-auto p-4 space-y-8">
                    <div className="bg-background-tertiary/30 p-5 rounded-2xl border border-border-divider/50 flex gap-4">
                        <div className="bg-brand-yellow/10 p-2 rounded-lg h-fit">
                            <AlertCircle className="w-5 h-5 text-brand-yellow" />
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Set up security questions to recover your account if you lose access to your 2FA or password.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* Question 1 */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-text-secondary ms-1 uppercase tracking-wide">Question 1</label>
                            <div className="relative">
                                <SelectField
                                    valueLabel={question1}
                                    onClick={() => setActiveQuestionPicker(1)}
                                    className="w-full bg-background-secondary border border-border-divider rounded-xl p-4 ltr:pl-4 ltr:pr-12 rtl:pr-4 rtl:pl-12 appearance-none focus:outline-none focus:border-brand-yellow transition-colors text-sm font-medium text-text-primary"
                                    style={{ borderColor: answer1 ? `var(--tw-color-${primaryColor})` : '' } as React.CSSProperties}
                                />
                            </div>
                            <input 
                                type="text"
                                value={answer1}
                                onChange={(e) => setAnswer1(e.target.value)}
                                placeholder="Enter your answer"
                                className="w-full bg-background-tertiary border border-transparent rounded-xl p-4 focus:outline-none focus:border-brand-yellow transition-colors text-sm font-medium text-text-primary"
                            />
                        </div>

                        <div className="h-px bg-border-divider/50 w-full"></div>

                        {/* Question 2 */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-text-secondary ms-1 uppercase tracking-wide">Question 2</label>
                            <div className="relative">
                                <SelectField
                                    valueLabel={question2}
                                    onClick={() => setActiveQuestionPicker(2)}
                                    className="w-full bg-background-secondary border border-border-divider rounded-xl p-4 ltr:pl-4 ltr:pr-12 rtl:pr-4 rtl:pl-12 appearance-none focus:outline-none focus:border-brand-yellow transition-colors text-sm font-medium text-text-primary"
                                    style={{ borderColor: answer2 ? `var(--tw-color-${primaryColor})` : '' } as React.CSSProperties}
                                />
                            </div>
                            <input 
                                type="text"
                                value={answer2}
                                onChange={(e) => setAnswer2(e.target.value)}
                                placeholder="Enter your answer"
                                className="w-full bg-background-tertiary border border-transparent rounded-xl p-4 focus:outline-none focus:border-brand-yellow transition-colors text-sm font-medium text-text-primary"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 pb-8 bg-background-primary border-t border-border-divider/10 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
                    <button 
                        type="submit" 
                        disabled={isSaving || !answer1 || !answer2}
                        className={`w-full p-4 rounded-xl font-bold text-background-primary bg-${primaryColor} disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-background-primary border-t-transparent rounded-full animate-spin"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>{t('save')}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            <SelectModal
                isOpen={activeQuestionPicker !== null}
                onClose={() => setActiveQuestionPicker(null)}
                title={activeQuestionPicker === 1 ? 'Question 1' : 'Question 2'}
                value={activeQuestionPicker === 1 ? question1 : question2}
                searchable
                searchPlaceholder="Search question..."
                accentColorClassName={primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'}
                options={SECURITY_QUESTIONS.map((q) => ({ value: q, label: q }))}
                onChange={(q) => {
                    if (activeQuestionPicker === 1) setQuestion1(q);
                    if (activeQuestionPicker === 2) setQuestion2(q);
                }}
            />
        </PageLayout>
    );
};

export default SecurityQuestionsScreen;
