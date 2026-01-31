
import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { EmptyState } from '../components/EmptyState';
import { BellIcon, CheckCheck, Trash2 } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { NotificationList } from '../components/NotificationList';

const NotificationsScreen: React.FC = () => {
    const { t } = useLanguage();
    const { 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification, 
        clearAllNotifications 
    } = useNotifications();


    const actionButtons = notifications.length > 0 ? (
        <div className="flex items-center gap-1">
            {unreadCount > 0 && (
                <button 
                    onClick={markAllAsRead} 
                    className="p-2 rounded-full text-text-secondary hover:text-success hover:bg-background-tertiary transition-colors"
                    title={t('mark_as_read')}
                >
                    <CheckCheck className="w-5 h-5" />
                </button>
            )}
            <button 
                onClick={clearAllNotifications} 
                className="p-2 rounded-full text-text-secondary hover:text-error hover:bg-background-tertiary transition-colors"
                title={t('clear_all')}
            >
                <Trash2 className="w-5 h-5" />
            </button>
        </div>
    ) : undefined;

    return (
        <PageLayout title={t('notifications')} action={actionButtons}>
            {notifications.length > 0 ? (
                <NotificationList 
                    notifications={notifications} 
                    onDelete={deleteNotification}
                    onMarkAsRead={markAsRead}
                />
            ) : (
                <div className="pt-16">
                    <EmptyState
                        icon={BellIcon}
                        title={t('no_notifications_title')}
                        message={t('no_notifications_message')}
                    />
                </div>
            )}
        </PageLayout>
    );
};

export default NotificationsScreen;
