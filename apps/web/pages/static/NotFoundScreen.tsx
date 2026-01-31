
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Map, Home } from 'lucide-react';

const NotFoundScreen: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { primaryColor } = useTheme();

    return (
        <div className="flex flex-col h-full w-full bg-background-primary items-center justify-center p-6 text-center animate-fadeIn">
            <div className="relative mb-8">
                <div className={`absolute inset-0 ${primaryColor === 'brand-yellow' ? 'bg-primary-gold' : 'bg-primary-green'} blur-[60px] opacity-20 rounded-full`}></div>
                <Map className={`w-32 h-32 ${primaryColor === 'brand-yellow' ? 'text-primary-gold' : 'text-primary-green'} relative z-10 opacity-80`} />
            </div>
            
            <h1 className="text-6xl font-black text-text-primary mb-2 tracking-tighter">404</h1>
            <h2 className="text-xl font-bold text-text-primary mb-4">Page Not Found</h2>
            <p className="text-text-secondary max-w-xs mx-auto mb-8 leading-relaxed">
                The decentralized web is vast, but we couldn't find the block you are looking for.
            </p>
            
            <button 
                onClick={() => navigate('/')}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-background-primary ${primaryColor === 'brand-yellow' ? 'bg-primary-gold' : 'bg-primary-green'} hover:brightness-110 transition-all active:scale-95`}
            >
                <Home className="w-5 h-5" />
                {t('home')}
            </button>
        </div>
    );
};

export default NotFoundScreen;
