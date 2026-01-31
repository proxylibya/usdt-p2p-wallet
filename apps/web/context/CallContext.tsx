
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

export type CallType = 'audio' | 'video';

interface CallState {
    isActive: boolean;
    isMinimized: boolean;
    type: CallType;
    remoteName: string;
    remoteAvatar?: string;
    startTime: number; // To persist timer across navigation
}

interface CallContextType {
    callState: CallState;
    startCall: (type: CallType, name: string, avatar?: string) => void;
    endCall: () => void;
    toggleMinimize: () => void;
    setMinimized: (isMinimized: boolean) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [callState, setCallState] = useState<CallState>({
        isActive: false,
        isMinimized: false,
        type: 'audio',
        remoteName: '',
        startTime: 0
    });

    const startCall = useCallback((type: CallType, name: string, avatar?: string) => {
        setCallState({
            isActive: true,
            isMinimized: false, // Start full screen
            type,
            remoteName: name,
            remoteAvatar: avatar,
            startTime: Date.now()
        });
    }, []);

    const endCall = useCallback(() => {
        setCallState(prev => ({ ...prev, isActive: false }));
    }, []);

    const toggleMinimize = useCallback(() => {
        setCallState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
    }, []);

    const setMinimized = useCallback((isMinimized: boolean) => {
        setCallState(prev => ({ ...prev, isMinimized }));
    }, []);

    return (
        <CallContext.Provider value={{ callState, startCall, endCall, toggleMinimize, setMinimized }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = (): CallContextType => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
};
