
import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';

interface AppSettings {
    aiAssistant: {
        enabled: boolean;
    };
    liveData: {
        enabled: boolean;
    };
    viewMode: 'pro' | 'lite';
}

interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
    aiAssistant: {
        enabled: false,
    },
    liveData: {
        enabled: true,
    },
    viewMode: 'pro',
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const saved = localStorage.getItem('app_settings');
            return saved ? JSON.parse(saved) : defaultSettings;
        } catch (e) {
            return defaultSettings;
        }
    });

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(prev => {
            const updated = {
                ...prev,
                ...newSettings,
                aiAssistant: {
                    ...prev.aiAssistant,
                    ...(newSettings.aiAssistant || {}),
                },
                liveData: {
                    ...prev.liveData,
                    ...(newSettings.liveData || {}),
                }
            };
            localStorage.setItem('app_settings', JSON.stringify(updated));
            return updated;
        });
    };

    // Performance fix: Memoize context value
    const value = useMemo(() => ({
        settings,
        updateSettings,
    }), [settings]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useAppSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useAppSettings must be used within a SettingsProvider');
    }
    return context;
};
