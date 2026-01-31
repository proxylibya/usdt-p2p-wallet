import React, { useState, useRef } from 'react';
import { Notification } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Trash2 } from 'lucide-react';

const NotificationIcon: React.FC<{ type: Notification['icon'] }> = ({ type }) => {
    const baseClasses = "w-3 h-3 rounded-full";
    switch(type) {
        case 'success': return <div className={`${baseClasses} bg-success`}></div>;
        case 'error': return <div className={`${baseClasses} bg-error`}></div>;
        case 'info': return <div className={`${baseClasses} bg-brand-yellow`}></div>;
        default: return <div className={`${baseClasses} bg-brand-yellow`}></div>;
    }
};

const SWIPE_WIDTH = 80;
const SWIPE_SENSITIVITY = 10;

const SwipeableNotificationItem: React.FC<{ 
    notification: Notification; 
    onDelete: (id: string) => void;
    onMarkAsRead: (id: string) => void;
}> = ({ notification, onDelete, onMarkAsRead }) => {
    const { t } = useLanguage();
    const itemRef = useRef<HTMLDivElement>(null);
    const swipedRef = useRef(false);

    const [isSwiping, setIsSwiping] = useState(false);
    const [startX, setStartX] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    const handlePointerDown = (e: React.PointerEvent) => {
        setStartX(e.clientX);
        setIsSwiping(true);
        swipedRef.current = false;
        if (itemRef.current) itemRef.current.style.transition = 'none';
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isSwiping) return;
        e.preventDefault();
        const delta = e.clientX - startX;

        if (Math.abs(delta) > SWIPE_SENSITIVITY) {
            swipedRef.current = true;
        }
        
        const newTranslateX = Math.max(-SWIPE_WIDTH, Math.min(0, translateX + delta));
        if (delta < 0 || (delta > 0 && translateX < 0)) {
            setTranslateX(newTranslateX);
        }
    };
    
    const handlePointerUp = () => {
        if (!isSwiping) return;
        setIsSwiping(false);
        if (itemRef.current) itemRef.current.style.transition = 'transform 0.3s ease-out';
        
        if (translateX < -SWIPE_WIDTH / 2) {
            setTranslateX(-SWIPE_WIDTH);
        } else {
            setTranslateX(0);
        }
    };

    const handleClick = () => {
        if (swipedRef.current) return;
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }
        // Future: navigate to a details page here.
    };

    const handleDelete = () => setIsDeleting(true);

    const onAnimationEnd = () => {
        if (isDeleting) {
            onDelete(notification.id);
        }
    };
    
    return (
        <div 
            className={`relative rounded-lg overflow-hidden ${isDeleting ? 'item-deleting' : ''}`}
            onAnimationEnd={onAnimationEnd}
        >
            <div className="absolute top-0 right-0 h-full w-20 bg-error flex items-center justify-center">
                <button onClick={handleDelete} aria-label={t('delete')} className="text-white p-4">
                    <Trash2 size={24} />
                </button>
            </div>
            <div
                onClick={handleClick}
                ref={itemRef}
                style={{ transform: `translateX(${translateX}px)`, touchAction: 'pan-y' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`w-full cursor-pointer transition-colors duration-300 ${notification.read ? 'bg-background-secondary' : 'bg-background-tertiary'}`}
            >
                <div className="p-4 flex gap-4">
                    <div className="pt-1.5"><NotificationIcon type={notification.icon} /></div>
                    <div className="flex-grow">
                        <p className="font-bold text-text-primary">{notification.title}</p>
                        <p className="text-sm text-text-secondary mt-1">{notification.message}</p>
                        <p className="text-xs text-text-secondary/70 mt-2">{notification.date}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const NotificationList: React.FC<{ 
    notifications: Notification[]; 
    onDelete: (id: string) => void;
    onMarkAsRead: (id: string) => void;
}> = ({ notifications, onDelete, onMarkAsRead }) => {
    return (
        <div className="space-y-3">
            {notifications.map(notif => (
                <SwipeableNotificationItem key={notif.id} notification={notif} onDelete={onDelete} onMarkAsRead={onMarkAsRead} />
            ))}
        </div>
    );
};
