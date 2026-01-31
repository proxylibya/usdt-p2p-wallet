
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export const FullScreenLoader: React.FC = () => {
    const { primaryColor } = useTheme();
    const [showLoader, setShowLoader] = useState(false);
    
    // تأخير ظهور الـ loader لتجنب الوميض في التحميل السريع
    useEffect(() => {
        const timer = setTimeout(() => setShowLoader(true), 150);
        return () => clearTimeout(timer);
    }, []);
    
    if (!showLoader) {
        return <div className="absolute inset-0 bg-background-primary z-50" />;
    }
    
    return (
        <div className="absolute inset-0 bg-background-primary flex items-center justify-center z-50">
            <div className="relative flex flex-col items-center animate-fadeIn">
                <div className="w-12 h-12 rounded-2xl bg-background-secondary animate-pulse flex items-center justify-center shadow-lg">
                    <div className={`w-6 h-6 rounded-full bg-${primaryColor} opacity-50`}></div>
                </div>
            </div>
        </div>
    );
};
