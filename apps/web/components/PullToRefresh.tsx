
import React, { useState, useRef } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, className = '' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pullY, setPullY] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [startY, setStartY] = useState(0);
    const { primaryColor } = useTheme();

    const THRESHOLD = 60;
    const MAX_PULL = 120;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (containerRef.current && containerRef.current.scrollTop === 0) {
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY === 0 || refreshing || !containerRef.current) return;
        const currentY = e.touches[0].clientY;
        const dy = currentY - startY;

        // Only allow pull if at top
        if (containerRef.current.scrollTop === 0 && dy > 0) {
            // Logic to dampen the pull
            const move = Math.min(dy * 0.45, MAX_PULL);
            setPullY(move);
        } else {
            setStartY(0); // Reset if we scrolled down
            setPullY(0);
        }
    };

    const handleTouchEnd = async () => {
        if (!startY) return;
        
        if (pullY > THRESHOLD) {
            setRefreshing(true);
            setPullY(THRESHOLD); // Snap to threshold position for loading
            try {
                await onRefresh();
            } finally {
                setRefreshing(false);
                setPullY(0);
            }
        } else {
            setPullY(0);
        }
        setStartY(0);
    };

    const iconColorClass = primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green';

    return (
        <div 
            ref={containerRef}
            className={`overflow-y-auto relative ${className}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Indicator Container */}
            <div 
                className="absolute left-0 w-full flex justify-center pointer-events-none z-20"
                style={{ 
                    top: `-${THRESHOLD}px`,
                    transform: `translateY(${pullY}px)`,
                    transition: refreshing ? 'transform 0.2s' : 'none',
                    height: `${THRESHOLD}px`,
                    alignItems: 'center'
                }}
            >
                <div className={`p-2 rounded-full bg-background-secondary shadow-md border border-border-divider ${refreshing ? 'opacity-100' : 'opacity-90'}`}>
                    {refreshing ? (
                        <Loader2 className={`w-5 h-5 animate-spin ${iconColorClass}`} />
                    ) : (
                        <div 
                            className={`transition-transform duration-200 ${iconColorClass}`}
                            style={{ transform: `rotate(${pullY > THRESHOLD ? 180 : 0}deg)` }}
                        >
                            <ArrowDown className="w-5 h-5" />
                        </div>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div 
                style={{ 
                    transform: `translateY(${pullY}px)`,
                    transition: refreshing ? 'transform 0.2s' : 'none' 
                }}
                className="min-h-full"
            >
                {children}
            </div>
        </div>
    );
};
