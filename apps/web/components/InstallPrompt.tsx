
import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { primaryColor } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user has already dismissed it recently
      const hasDismissed = localStorage.getItem('install_prompt_dismissed');
      if (!hasDismissed) {
          setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
      setIsVisible(false);
      // Hide for 1 day (mock logic, in production store timestamp)
      localStorage.setItem('install_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-[80px] left-4 right-4 z-40 animate-fadeInUp">
      <div className="bg-background-secondary border border-border-divider p-4 rounded-xl shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg bg-${primaryColor}/10 text-${primaryColor}`}>
                <Download className="w-6 h-6" />
            </div>
            <div>
                <h4 className="font-bold text-text-primary text-sm">{t('install_app')}</h4>
                <p className="text-xs text-text-secondary">{t('get_best_experience')}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handleDismiss}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
            <button 
                onClick={handleInstallClick}
                className={`px-4 py-2 rounded-lg font-bold text-xs text-background-primary bg-${primaryColor}`}
            >
                {t('install')}
            </button>
        </div>
      </div>
    </div>
  );
};
