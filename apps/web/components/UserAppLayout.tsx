
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSettings } from '../context/SettingsContext';
import { useCall } from '../context/CallContext';
import BottomNav from './BottomNav';
import { FullScreenLoader } from './FullScreenLoader';
import AIAssistantButton from './AIAssistantButton';
import AIChatModal from './AIChatModal';
import OfflineBanner from './OfflineBanner';
import { InstallPrompt } from './InstallPrompt';
import { NetworkBanner, NetworkWatermark } from './NetworkBanner';
import { LockScreenOverlay } from './LockScreenOverlay';
import { CallOverlay } from './CallOverlay';
import { AppRoutes } from '../AppRoutes';

export const UserAppLayout: React.FC = () => {
    const location = useLocation();
    const { settings } = useAppSettings();
    const { callState, setMinimized } = useCall();
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);
    
    // Track previous location to detect route changes
    const prevPathname = useRef(location.pathname);
    
    // Security Lock State
    const [isLocked, setIsLocked] = useState(() => {
        const hasLock = localStorage.getItem('usdt_wallet_app_lock');
        return hasLock === 'true';
    });

    // Auto-lock when app goes to background
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                const hasLock = localStorage.getItem('usdt_wallet_app_lock');
                if (hasLock === 'true') {
                    setIsLocked(true);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Improved Auto-minimize: Only minimize when the route *changes*.
    // This allows the user to maximize the call on ANY page if they wish.
    useEffect(() => {
        if (prevPathname.current !== location.pathname) {
            // Route has changed
            if (callState.isActive && !callState.isMinimized) {
                setMinimized(true);
            }
            prevPathname.current = location.pathname;
        }
    }, [location.pathname, callState.isActive, callState.isMinimized, setMinimized]);

    const handleUnlock = () => {
        setIsLocked(false);
    };

    // List of routes where Bottom Navigation should be HIDDEN for immersive experience
    const hiddenRoutes = [
        '/login', 
        '/register',
        '/forgot-password',
        '/p2p/trade/', 
        '/p2p/create', 
        '/wallet/transaction/',
        '/security/password',
        '/security/2fa',
        '/security/devices',
        '/security/passcode',
        '/security/address-book',
        '/security/questions',
        '/profile/kyc',
        '/referral',
        '/profile/payment-methods',
        '/profile/edit',
        '/markets/', // Hides nav on detail pages like /markets/btc
        '/admin',
        '/deposit',
        '/withdraw',
        '/send',
        '/receive',
        '/transfer',
        '/tasks',
        '/rewards'
    ];

    const isFullScreenRoute = hiddenRoutes.some(route => location.pathname.includes(route));

    // If app is locked, render ONLY the lock screen
    if (isLocked) {
        return <LockScreenOverlay onUnlock={handleUnlock} />;
    }

    return (
        <div className="bg-background-primary text-text-primary h-[100dvh] w-full font-sans overflow-hidden flex flex-col">
            <div className="w-full h-full max-w-md mx-auto flex flex-col shadow-2xl overflow-hidden bg-background-primary relative">
                
                <NetworkBanner />
                <OfflineBanner />
                <InstallPrompt />
                <NetworkWatermark />
                
                {/* Global Call Overlay - Persists across all pages */}
                <CallOverlay />

                <main className="flex-1 w-full overflow-hidden relative flex flex-col z-0">
                    <Suspense fallback={<FullScreenLoader />}>
                        <AppRoutes />
                    </Suspense>
                </main>
                
                {!isFullScreenRoute && (
                    <div className="z-50 flex-none">
                        <BottomNav />
                    </div>
                )}

                {settings.aiAssistant.enabled && !isFullScreenRoute && (
                    <>
                        <AIAssistantButton onOpen={() => setIsAiChatOpen(true)} />
                        <AIChatModal isOpen={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} />
                    </>
                )}
            </div>
        </div>
    )
}
