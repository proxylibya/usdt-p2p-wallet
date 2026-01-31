
import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { t } = useLanguage();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-[74px] left-4 right-4 z-[60] animate-fadeInUp">
      <div className="bg-[#2B3139] border border-[#F6465D] text-[#FEFEFE] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
        <WifiOff className="w-5 h-5 text-[#F6465D]" />
        <div>
            <p className="text-sm font-bold">{t('no_internet')}</p>
            <p className="text-xs text-[#848E9C]">{t('check_network')}</p>
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;
