
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ isOpen, onClose }) => {
    const { primaryColor } = useTheme();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleLogin = () => {
        onClose();
        navigate('/login');
    }

    const handleRegister = () => {
        onClose();
        navigate('/register');
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('login_required')}>
            <div className="space-y-6 text-center">
                <p className="text-text-secondary">{t('login_to_continue')}</p>
                
                <div className="flex flex-col gap-3 pt-2">
                     <button onClick={handleLogin} className={`w-full p-3 rounded-lg font-bold text-background-primary bg-${primaryColor}`}>
                        {t('login')}
                    </button>
                    <button onClick={handleRegister} className="w-full p-3 rounded-lg font-semibold bg-background-tertiary text-text-primary">
                        {t('signup')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
