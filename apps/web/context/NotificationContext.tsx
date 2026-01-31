
import React, { createContext, useState, useContext, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { CONFIG } from '../config';

interface Notification {
  id: string;
  icon: 'success' | 'error' | 'info';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

// Helper function to convert the VAPID public key string to a Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

interface InAppNotificationPayload {
    icon: Notification['icon'];
    title: string;
    message: string;
    toast?: boolean; // Option to show visual toast
}

export interface ToastMessage {
    id: string;
    icon: Notification['icon'];
    title: string;
    message: string;
}

interface NotificationContextType {
    isPushSubscribed: boolean;
    pushPermissionState: NotificationPermission;
    togglePushSubscription: () => Promise<void>;
    sendPushNotification: (title: string, options: NotificationOptions) => Promise<void>;

    // In-App Notifications (History)
    notifications: Notification[];
    unreadCount: number;
    addNotification: (payload: InAppNotificationPayload) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;
    clearAllNotifications: () => void;

    // Toast System (Visual Popups)
    toasts: ToastMessage[];
    removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY_NOTIFS = 'usdt_wallet_notifications';

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // === Push Notification State ===
    const [isPushSubscribed, setIsPushSubscribed] = useState(false);
    const [pushPermissionState, setPushPermissionState] = useState<NotificationPermission>('default');

    // === In-App Notification State ===
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // === Toast State ===
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // Persist Notifications
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    }, [notifications]);

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    // === Push Notification Logic ===
    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            // console.warn('Push messaging is not supported by this browser.');
            return;
        }

        const checkSubscription = async () => {
            try {
                setPushPermissionState(Notification.permission);
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                setIsPushSubscribed(!!subscription);
            } catch (error) {
                console.error('Error checking for push subscription:', error);
            }
        };

        checkSubscription();
    }, []);

    const subscribeUser = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const applicationServerKey = urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY);
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });
            // Push subscription successful
            setIsPushSubscribed(true);
        } catch (error) {
            console.error('Failed to subscribe the user: ', error);
            if (Notification.permission === 'denied') {
                setPushPermissionState('denied');
            }
        }
    };

    const unsubscribeUser = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                // Push unsubscription successful
                setIsPushSubscribed(false);
            }
        } catch (error) {
            console.error('Error unsubscribing', error);
        }
    };

    const togglePushSubscription = async () => {
        if (pushPermissionState === 'denied') {
            // Permission for notifications was denied
            return;
        }

        if (isPushSubscribed) {
            await unsubscribeUser();
        } else {
            const currentPermission = await Notification.requestPermission();
            setPushPermissionState(currentPermission);
            if (currentPermission === 'granted') {
                await subscribeUser();
            }
        }
    };
    
    const sendPushNotification = async (title: string, options: NotificationOptions) => {
        if (pushPermissionState !== 'granted') {
            return;
        }
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.showNotification(title, { 
                    ...options, 
                    icon: '/icons/icon-192x192.svg',
                    badge: '/icons/icon-192x192.svg',
                });
            }
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    };


    // === In-App Notification & Toast Logic ===

    const addNotification = (payload: InAppNotificationPayload) => {
        // 1. Add to persistent history
        const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            date: new Date().toISOString().substring(0, 16).replace('T', ' '),
            read: false,
            icon: payload.icon,
            title: payload.title,
            message: payload.message
        };
        setNotifications(prev => [newNotification, ...prev]);

        // 2. Trigger visual toast (default true unless specified false)
        if (payload.toast !== false) {
            const newToast: ToastMessage = {
                id: `toast-${Date.now()}-${Math.random()}`,
                icon: payload.icon,
                title: payload.title,
                message: payload.message
            };
            setToasts(prev => [...prev, newToast]);

            // Auto remove after 3s
            setTimeout(() => {
                removeToast(newToast.id);
            }, 3000);
        }
    };

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };
    
    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    const value = {
        isPushSubscribed,
        pushPermissionState,
        togglePushSubscription,
        sendPushNotification,
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        toasts,
        removeToast
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
